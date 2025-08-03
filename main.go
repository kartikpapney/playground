package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/joho/godotenv"
)

type ExecutionRequest struct {
	Language string `json:"language"`
	Code     string `json:"code"`
	Input    string `json:"input"`
}

type ExecutionResponse struct {
	Output string `json:"output"`
	Error  string `json:"error"`
}

type DefaultCodeResponse struct {
	Python     string `json:"python"`
	Java       string `json:"java"`
	Javascript string `json:"javascript"`
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func executeCode(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return // Handle preflight requests
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ExecutionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var image string
	var cmd []string

	switch req.Language {
	case "python":
		image = "python:3.9-slim"
		if req.Input != "" {
			cmd = []string{"sh", "-c", fmt.Sprintf("echo '%s' | python -c \"%s\"", req.Input, req.Code)}
		} else {
			cmd = []string{"python", "-c", req.Code}
		}

	case "java":
		image = "openjdk:17-jdk-slim"
		className := "Main"
		if req.Input != "" {
			cmd = []string{"sh", "-c", fmt.Sprintf("echo '%s' > %s.java && javac %s.java && echo '%s' | java %s", req.Code, className, className, req.Input, className)}
		} else {
			cmd = []string{"sh", "-c", fmt.Sprintf("echo '%s' > %s.java && javac %s.java && java %s", req.Code, className, className, className)}
		}
	case "javascript":
		image = "node:16-slim"
		if req.Input != "" {
			cmd = []string{"sh", "-c", fmt.Sprintf("echo '%s' | node -e \"%s\"", req.Input, req.Code)}
		} else {
			cmd = []string{"node", "-e", req.Code}
		}
	default:
		http.Error(w, "Language not supported", http.StatusBadRequest)
		return
	}

	pullCmd := exec.Command("docker", "pull", image)
	pullOutput, err := pullCmd.CombinedOutput()
	if err != nil {
		errMsg := fmt.Sprintf("Failed to pull Docker image: %v\nOutput: %s", err, pullOutput)
		http.Error(w, errMsg, http.StatusInternalServerError)
		return
	}

	dockerArgs := []string{
		"run",
		"--rm",           // Remove container after execution
		"--memory=512m",  // Limit memory
		"--cpus=1",       // Limit CPU
		"--network=none", // No network access
		image,            // Image name
	}

	dockerArgs = append(dockerArgs, cmd...)

	runCmd := exec.Command("docker", dockerArgs...)

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	runCmd.Stdout = &stdout
	runCmd.Stderr = &stderr

	err = runCmd.Run()

	// Prepare the response
	resp := ExecutionResponse{
		Output: stdout.String(),
		Error:  stderr.String(),
	}

	if err != nil {
		resp.Error += "\nExecution error: " + err.Error()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func getDefaultCode(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return // Handle preflight requests
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	defaultCode := DefaultCodeResponse{
		Python:     "print('Hello, World!')",
		Java:       "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
		Javascript: "console.log('Hello, World!');",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(defaultCode)
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return // Handle preflight requests
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Welcome to code execution API. Send POST request to /execute"})
}

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found or error loading it")
	}

	checkCmd := exec.Command("docker", "--version")
	output, err := checkCmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Docker not found or not accessible: %v\nOutput: %s", err, output)
	}
	log.Printf("Docker found: %s", strings.TrimSpace(string(output)))

	port := getEnv("PORT", "8080")
	log.Printf("Starting server on port %s", port)

	http.HandleFunc("/playground/execute", executeCode)
	http.HandleFunc("/playground/default", getDefaultCode)
	http.HandleFunc("/playground", handleRoot)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
