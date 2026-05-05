# Z-OS

---

## Project Overview

Z-OS is an aggressive, next-generation local operating system interface designed to bridge the gap between natural language and raw machine execution.

The system bypasses standard GUI limitations by connecting a powerful Large Language Model (LLM) directly to underlying hardware via Python execution protocols.

It utilizes Groq LPU (Language Processing Unit) technology to parse user intent and generate execution arrays with near-zero latency (under 0.2 seconds).

Core capabilities include Native App Hijacking, which allows the AI to open, manipulate, and forcefully terminate local applications like Notepad or Spotify at the OS level.

The interface features a "Gen-Z premium" hacker aesthetic, utilizing a terminal-style log system to show real-time "Reasoning" and "Execution" steps.

---

## Tech Stack

* AI Engine: Groq API (Llama-3 70B Model)
* Backend: FastAPI (Python)
* Automation: PyAutoGUI & Subprocess
* Frontend: HTML5, CSS3 (Liquid Glass/Premium UI), Vanilla JavaScript
* Voice: Windows 11 Native Voice Engine 

---

## Deployment & Execution Steps

```bash
cd to your project location
.\venv\Scripts\activate
pip install -r requirements.txt
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open the `index.html` file located in the frontend folder directly in your browser (e.g., Microsoft Edge or Chrome) to initialize the OS.

---
