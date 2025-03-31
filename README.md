# Code Execution Playground

This is a code execution engine built using Golang & Next.js

## How to Use

1.  **Choose a language:** Pick Python, JavaScript, or Java from the dropdown.
2.  **Write code:** Type your code in the input.
3.  **Add input:** If your code needs input parameters, write it in the input section.
4.  **Run code:** Click the "Run Code" button.
5.  **See output:** The results of your code will show in the box at the bottom.

## What it Needs

* **Backend:** This app needs a golang server running by default at `http://localhost:8080`.
* **Docker:** The server uses Docker to run code. Make sure Docker is installed.
* **.env file:** Create two `.env` file with `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080` inside frontend and `PORT=8080` inside the root.

## How to Run

1.  **Start the server:** Run the Go server using `./script.sh`.
2.  **Start the web app:** Run the React app using `npm run dev`.

## Notes

* Tab key makes spaces in the code and input boxes.
* Errors will show in red.
* Output will show in green.
* If there is no output, a grey message will appear.