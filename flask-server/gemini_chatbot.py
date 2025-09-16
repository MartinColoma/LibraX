# gemini_chatbot.py
import requests
import os

# ⚠️ Load API key from environment (set with: export GEMINI_API_KEY="your_api_key_here")
API_KEY = os.getenv("AIzaSyB9yjQW4MaVhZOQd3JE9Sco7Qa4CfERnWk", "AIzaSyDkzUmc6A1cnnQJbhpaY0H_124u3mPtZLY")

# -----------------------
# Simple keyword filter
# -----------------------
def is_library_related(message: str) -> bool:
    """
    Checks if the user message is related to library inquiries.
    """
    keywords = [
        "book", "author", "isbn", "catalog", "borrow",
        "library", "reading", "reference", "return",
        "reserve", "renew", "fine", "due date", "shelf",
        "cast", "characters", "nfc", "card", "dashboard"
    ]
    return any(word.lower() in message.lower() for word in keywords)


# -----------------------
# Gemini Chat Function
# -----------------------
def chat_with_gemini(message: str) -> str:
    """
    Sends a user query to Gemini and enforces 'library-kiosk-only' rule.
    """
    if not is_library_related(message):
        return "Sorry, I can only help with library-related inquiries."

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"
    )
    headers = {"Content-Type": "application/json"}
    params = {"key": API_KEY}

    # Strong system prompt for kiosk context
    data = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            "You are an AI Library Assistant running on an AIoT library kiosk. "
                            "This kiosk does not need much human intervention. "
                            "All books are tagged with NFC for automatic identification. "
                            "Students access their dashboards by tapping their NFC library cards, "
                            "where they can view borrowed books, due dates, and fines. "
                            "You ONLY answer questions about books, library services, "
                            "catalog inquiries, borrowing policies, NFC card usage, "
                            "and student dashboards. "
                            "If the question is unrelated, politely respond with: "
                            "'Sorry, I can only help with library-related inquiries.' "
                            f"\n\nUser: {message}"
                        )
                    }
                ]
            }
        ]
    }

    response = requests.post(url, headers=headers, params=params, json=data)

    if response.status_code != 200:
        return f"Error: {response.status_code} - {response.text}"

    try:
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return "Error: Unexpected response format."


# -----------------------
# Example usage
# -----------------------
if __name__ == "__main__":
    while True:
        user_input = input("You: ")
        if user_input.lower() in {"quit", "exit"}:
            break
        reply = chat_with_gemini(user_input)
        print("LibraryBot:", reply)
