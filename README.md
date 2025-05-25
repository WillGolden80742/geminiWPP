# WhatsApp Gemini Responder

![Gemini Icon](images/gemini_icon_logo.png)

**Description:**

The WhatsApp Gemini Responder is a Chrome extension that enhances your WhatsApp Web experience by integrating the power of Google's Gemini AI. It provides intelligent reply suggestions based on the context of your conversations, allowing you to respond quickly and effectively.  This extension adds two new menu items "Reply with Gemini" and "Training Gemini"

**Note:** This project is currently unlicensed.

## Features

*   **AI-Powered Reply Suggestions:**  Generates relevant and context-aware responses using the Gemini API.
*   **Customizable Prompts:**  Allows you to define custom prompts to tailor the AI's responses to your specific needs and style.
*   **Gemini Training:**  Allows you to train Gemini to give you a better custom Prompt.
*   **Fixed Data Integration:** Incorporate permanent data like contact information.
*   **Easy to Use:** Seamlessly integrates into the WhatsApp Web interface.
*   **Enable/Disable Functionality:**  Quickly toggle the extension on or off via the popup.
*   **Model Selection:** Choose the Gemini model that best suits your needs.
*   **Privacy-Focused:** No data is sent to any third-party servers besides Google's Gemini API.

## Installation

1.  Download the repository as a ZIP file.
2.  Extract the ZIP file to a local directory.
3.  Open Chrome and navigate to `chrome://extensions/`.
4.  Enable "Developer mode" in the top right corner.
5.  Click "Load unpacked" and select the directory where you extracted the ZIP file.
6.  The extension is now installed!

## Usage

1.  Open WhatsApp Web in your Chrome browser ([https://web.whatsapp.com/](https://web.whatsapp.com/)).
2.  Click the three dots on any chat
3.  Click the `Reply with Gemini` menu item or `Training Gemini`.
4.  The Gemini-generated response will be injected into the input field, ready for you to send or edit.

## Configuration

The extension's settings can be configured via the popup and options pages

### Popup Page

*   **Gemini API Key:**  Enter your Google Gemini API key.  This is required for the extension to function.
*   **Gemini Model:** Select the specific Gemini model you want to use for generating responses. Make sure your API Key have permission to use this model.
*   **Custom Prompt:**  Enter a custom prompt to guide the AI's responses.  This is a powerful way to tailor the extension to your specific needs. For examples of what a good prompt looks like, see the `options.html` section below.
*   **Enable Gemini:**  A toggle to enable or disable the extension.
*   **Save Settings:** Saves the configuration.
*   **Configure:** Opens the options page for advanced settings.

### Options Page (Advanced)

The options page provides access to more advanced customization options.

*   **Custom Training Prompt:**
    This setting allows you to enhance the "Training Gemini" feature. When training, the extension uses this prompt to instruct Gemini on how to generate a better custom prompt, based on conversation context, ideal replies and the current custom prompt.
    The custom training prompt makes use of this vars: `[CONTEXT]`, `[QUOTEDMESSAGE]`, `[FROMMESSAGE]`, `[CURRENTPROMPT]`, `[CURRENTLANGUAGE]`.
*   **Fixed Data:**
    *   This section allows you to provide the Gemini Responder with permanent information, such as your phone number, email address, company details, or links to important resources. This data will be included in the context when generating replies, leading to more accurate and relevant suggestions.
    *   The Fixed Data is structured as key-value pairs.  For example:
        *   Key: `Email`
        *   Value: `support@example.com`
    *   This data is incorporated into the prompt sent to the Gemini API.

## Extension Logic

1.  **Content Script (`content.js`):**
    *   This script is injected into the WhatsApp Web page.
    *   It observes the DOM (Document Object Model) for changes, specifically looking for the menu element to add the "Reply with Gemini" and "Training Gemini" items.
    *   When a user clicks "Reply with Gemini":
        *   The script collects the chat history using the `collectChatHistory()` function. This function gathers the messages and their senders (bot/client) to give Gemini a context.
        *   The content of the last quoted message is get using `getQuotedMessage` for Gemini to have the message to answer.
        *   The name of the last quoted message is get using `getFromMessage`.
        *   The script calls the `getGeminiResponse()` function to communicate with the Gemini API.
    *   When a user clicks "Training Gemini":
        *   The script collects the chat history using the `collectChatHistory()` function. This function gathers the messages and their senders (bot/client) to give Gemini a context.
        *   The content of the last quoted message is get using `getQuotedMessage` for Gemini to have the message to answer.
        *   The name of the last quoted message is get using `getFromMessage`.
        *   The script calls the `trainingGemini()` function to communicate with the Gemini API and update the custom prompt

2.  **Gemini API Communication (`getGeminiResponse()`):**
    *   This function constructs a prompt to be sent to the Gemini API. The prompt includes:
        *   The conversation history.
        *   The custom prompt (if defined in the options).
        *   Any fixed data (from the options).
    *   It sends a `POST` request to the Gemini API endpoint (`https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`).
    *   The response from the Gemini API is parsed, and the generated reply is extracted.
    *   The reply is injected into the WhatsApp Web input field using the `injectGeminiResponse()` function.
    *   This function also dispatch a `InputEvent` to be possible to send the message to WhatsApp.

3.  **Training Gemini API Communication (`trainingGemini()`):**
    *   This function constructs a prompt to be sent to the Gemini API. The prompt includes:
        *   The conversation history.
        *   The custom prompt (if defined in the options).
        *   The custom training prompt (if defined in the options).
    *   It sends a `POST` request to the Gemini API endpoint (`https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`).
    *   The response from the Gemini API is parsed, and the new custom prompt is extracted.
    *   The new prompt is saved on the local storage.

4.  **Options Page (`options.html`, `options.js`):**
    *   Provides a user interface for configuring the extension's advanced settings.
    *   Allows users to add/edit fixed data and define a custom prompt.
    *   Saves the settings to `chrome.storage.local`.

5.  **Popup Page (`popup.html`, `popup.js`):**
    *   Provides a user interface for configuring the extension's basic settings.
    *   Allows users to define a custom prompt.
    *   Saves the settings to `chrome.storage.sync`.

## License

This project is currently unlicensed.
