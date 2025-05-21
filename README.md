# WhatsApp Gemini Responder

A Chrome extension that enhances your WhatsApp Web experience with intelligent Gemini-powered responses.

## Features

*   **Gemini Integration:** Seamlessly integrates with Google's Gemini (formerly Bard) to generate context-aware replies to your WhatsApp conversations.
*   **Enable/Disable:** Easily toggle the Gemini responder on or off directly from the popup.
*   **API Key Configuration:** Securely store your Gemini API key within the extension.
*   **Model Selection:** Choose between different Gemini models for customized response generation.
*   **Contextual Understanding:** Collects the conversation history to provide Gemini with context for better responses.
*   **Quick Reply:**  Adds a "Respond with Gemini" option to the WhatsApp message menu for easy access.
*   **Mobile-Inspired Design:**  The extension popup features a clean, mobile-friendly design.

## Installation

1.  **Download the repository:** Clone or download this repository to your local machine.
2.  **Open Chrome Extensions:** In Chrome, go to `chrome://extensions/`.
3.  **Enable Developer Mode:** Toggle the "Developer mode" switch in the top right corner.
4.  **Load Unpacked:** Click the "Load unpacked" button and select the directory where you extracted the repository.

## Usage

1.  **Open WhatsApp Web:** Go to [https://web.whatsapp.com/](https://web.whatsapp.com/) in your Chrome browser.
2.  **Open the Extension Popup:** Click on the extension icon in the Chrome toolbar.
3.  **Configure Gemini Settings:**
    *   Enter your Gemini API key in the provided field.  (You'll need to obtain an API key from Google AI Studio).
    *   Select your preferred Gemini model (e.g., `gemini-pro`, `gemini-2.0-flash`).
    *   Enable or disable the Gemini responder using the toggle switch.
4.  **Save Settings:** Click the "Save Settings" button to save your configuration.
5.  **Start Chatting:**
    *   In a WhatsApp conversation, long press to select a message.
    *   Open the message menu (three vertical dots).
    *   Choose "Responder com Gemini" (Reply with Gemini).
    *   The extension will send the conversation history to Gemini, and a generated response will automatically be inserted into the input field.
    *   You can then edit and send the response as needed.

## Obtaining a Gemini API Key

1.  Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Google AI Studio - formerly MakerSuite).
2.  Follow the instructions to create a new API key.
3.  Copy the API key and paste it into the extension's settings.

## Manifest.json Configuration

```json
{
  "manifest_version": 3,
  "name": "WhatsApp Gemini Responder",
  "version": "1.3",
  "description": "Adiciona respostas inteligentes do Gemini ao WhatsApp Web.",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["https://web.whatsapp.com/*"],
  "content_scripts": [
    {
      "matches": ["https://web.whatsapp.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "48": "images/sign_icon_48.png"
    }
  },
  "web_accessible_resources": [
    {
      "resources": ["images/sign.svg"],
      "matches": ["https://web.whatsapp.com/*"]
    }
  ],
  "icons": {
    "48": "images/sign_icon_48.png"
  }
}