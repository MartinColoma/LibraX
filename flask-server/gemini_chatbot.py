# gemini_chatbot.py
import requests

API_KEY = "AIzaSyDkzUmc6A1cnnQJbhpaY0H_124u3mPtZLY"  # ✅ safer if you load this from environment

def chat_with_gemini(message: str) -> str:
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": API_KEY}

    data = {
        "contents": [
            {"parts": [{"text": f"You are a library assistant. {message}"}]}
        ]
    }

    response = requests.post(url, headers=headers, params=params, json=data)

    if response.status_code != 200:
        return f"Error: {response.status_code} - {response.text}"

    try:
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return "Error: Unexpected response format."
