# StudyMate — AI-Powered Academic Assistant

A simple academic assistant web app built with React, Vite, Node.js, Express, and the Google Gemini API.

## Features

- **Ask AI:** Ask academic questions and receive explanations.
- **Generate notes:** Create simple study notes for a topic.
- **Summarize:** Summarize pasted academic text.
- **Categorize:** Identify a text's subject, topic, and keywords.
- Copy answers, see recent responses during the current session, and receive friendly error messages.

## Requirements

- Node.js 20 or newer recommended
- npm
- A Gemini API key from Google AI Studio: https://aistudio.google.com/app/apikey

## Run locally

1. Extract the ZIP and open the `academic-assistant-gemini` folder in VS Code.
2. Open a terminal in that folder and install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to a new file named `.env`.
4. Open `.env` and replace the placeholder with your API key:

   ```env
   GEMINI_API_KEY=your_real_api_key_here
   GEMINI_MODEL=gemini-3.5-flash
   PORT=3001
   ```

   Do not share the key or commit `.env` to GitHub.

5. Start both the backend and frontend:

   ```bash
   npm run dev
   ```

6. Open the local URL Vite prints in the terminal, usually `http://localhost:5173`.

## How it works

1. React sends the selected task and text to `POST /api/ai/ask`.
2. Express validates the request.
3. The server calls Gemini using the API key stored in `.env`.
4. The generated answer is returned to React and shown in the interface.

## API endpoints

- `GET /api/health` — checks server status and whether an API key is configured.
- `POST /api/ai/ask` — JSON body example:

  ```json
  {
    "task": "summarize",
    "text": "Paste your academic content here."
  }
  ```

  Supported tasks: `chat`, `generate`, `summarize`, `categorize`.

## Troubleshooting

- **Missing key:** Confirm `.env` is in the project root and restart `npm run dev`.
- **Invalid key:** Create/check the key in Google AI Studio and ensure Gemini API access is enabled.
- **Quota/rate limit:** Check your Google AI Studio usage and try later.
- **Port in use:** Change `PORT` in `.env`; if Vite's port is occupied it may offer another one.
- **Model unavailable:** Set `GEMINI_MODEL` to a model currently available to your API key.

## Academic use

This is a functional starter project, not a verified academic source. Review AI-generated content before using it in assignments. Avoid pasting private or sensitive information into the app.
