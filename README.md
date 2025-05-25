# Gemini Responder - WhatsApp Web Extension

## Overview

Gemini Responder is a Chrome extension designed to enhance your WhatsApp Web experience by integrating intelligent responses powered by the Gemini AI model.  This extension adds a "Reply with Gemini" option to the WhatsApp context menu, allowing you to quickly generate context-aware replies based on your conversation history.  It also provides a unique "Training Gemini" feature to improve the quality of custom prompts over time.

**Key Features:**

*   **AI-Powered Replies:** Generate intelligent replies to WhatsApp messages using the Gemini AI model.
*   **Contextual Awareness:** The extension analyzes the current chat history and quoted messages to provide relevant responses.
*   **Customizable Prompts:** Tailor the AI's behavior with custom prompts to achieve the desired tone and style.
*   **"Training Gemini" Feature:**  Refine your custom prompt through user feedback.  Provide an "ideal" response to a conversation, and the extension will leverage Gemini to suggest an improved custom prompt for future interactions.
*   **Fixed Data Integration:** Configure the extension with key information like phone numbers, email addresses, or important links to ensure Gemini incorporates it into its responses.
*   **Easy to Use:** Adds a seamless "Reply with Gemini" option to the WhatsApp Web interface.
*   **Customizable Training Prompt:** Allows advanced users to customize the prompt used for improving custom prompts.
*   **Model Selection:**  Users can select which Gemini Model to use for response generation.
*   **Greeting Awareness:** Gemini is aware of the current time of day and incorporates an appropriate greeting into the generated response.

## Installation

1.  **Download the Repository:** Download the source code for Gemini Responder from the [GitHub repository](https://github.com/WillGolden80742/geminiWPP).  You can download it as a ZIP file or clone it using Git.

    ```bash
    git clone https://github.com/WillGolden80742/geminiWPP.git
    ```

2.  **Enable Developer Mode:** In Chrome, navigate to `chrome://extensions/`.  Toggle the "Developer mode" switch in the top right corner.

3.  **Load Unpacked Extension:** Click the "Load unpacked" button and select the directory where you extracted or cloned the Gemini Responder source code.

4.  **Configure the Extension:** Click the extension icon in the Chrome toolbar (it might be in the extensions menu - puzzle icon).

    *   **Enter your Gemini API Key:** You will need a valid Gemini API key to use the extension.  You can obtain one from the Google AI Studio ([https://ai.google.dev/](https://ai.google.dev/)).
    *   **Select a Gemini Model:** Choose the Gemini model you want to use for generating responses.
    *   **Enter a Custom Prompt (Optional):**  Customize the behavior of the AI by providing a custom prompt.  This allows you to control the tone, style, and content of the generated responses.
    *   **Enable Gemini:** Make sure the "Enable Gemini" checkbox is checked.

## Usage

1.  **Open WhatsApp Web:** Open [https://web.whatsapp.com/](https://web.whatsapp.com/) in your Chrome browser.

2.  **Select a Chat:** Choose the conversation you want to respond to.

3.  **Right-Click on a Message:** Right-click on the message you want to reply to.  A context menu will appear.

4.  **Choose "Reply with Gemini":** Select the "Reply with Gemini" option from the context menu.

5.  **Generated Response:** The extension will analyze the conversation context and generate a response based on your custom prompt and the Gemini AI model.  The generated response will be automatically inserted into the WhatsApp text input field.

6.  **Edit and Send:**  Review the generated response, make any necessary edits, and send the message.

### Training Gemini (Improving the Custom Prompt)

1.  **Use "Reply with Gemini" as Normal:** Use the "Reply with Gemini" function on a chat.
2.  **Notice a Suboptimal Response:** If Gemini's response isn't quite right, *before* sending the message, right-click on the original message and select **Training Gemini**.
3.  **Provide Your Ideal Response:** Edit the generated text in the input box to match the "ideal" response you wanted the AI to produce.  Send this message.  The extension uses this feedback to suggest improvements to your Custom Prompt.
4.  **Check the Options Page:** The extension will save a suggested change for your custom prompt. To view this suggestion, open the extension's options page from the Chrome toolbar. Review the suggested prompt and update your active custom prompt accordingly.

### Configure Fixed Data

1.  **Open the Options Page:** Open the extension's options page from the Chrome toolbar.
2.  **Navigate to the "Fixed Data" tab:** Click on the "Fixed Data" button on the sidebar.
3.  **Add/Edit Key-Value Pairs:** Add or edit the key-value pairs that represent your fixed data (e.g., `phone: +1-555-123-4567`, `email: example@example.com`).
4.  **Save Fixed Data:** Click the "Save Fixed Data" button to save your changes.

## Configuration Options

The extension provides the following configuration options, accessible through the extension popup and Options page:

*   **Gemini API Key:** Your API key for accessing the Gemini AI model.
*   **Gemini Model:** The specific Gemini model to use (e.g., `gemini-1.5-flash`).
*   **Custom Prompt:**  A text prompt that instructs the AI on how to behave.  This allows you to customize the tone, style, and content of the generated responses.  Example: "You are a helpful assistant that always responds in a friendly and concise manner."
*   **Custom Training Prompt:**  Customize how the AI suggests new custom prompts.  Advanced users only.
*   **Enable Gemini:** A toggle to enable or disable the Gemini Responder functionality.
*   **Fixed Data:**  A set of key-value pairs representing important information to be incorporated into Gemini's responses.

## File Structure

```
geminiWPP/
├── content.js       # Content script - injects functionality into WhatsApp Web
├── manifest.json      # Extension manifest file
├── options.html       # Options page HTML
├── options.js         # Options page JavaScript
├── popup.html         # Popup HTML
├── popup.js           # Popup JavaScript
├── style.css          # Styles for the popup and options pages
└── images/            # Directory containing images
    ├── gemini_gray_icon.svg
    ├── gemini_icon_logo.png
    ├── neural_gray_icon.svg
    └── sign.svg
```

## Technologies Used

*   JavaScript
*   HTML
*   CSS
*   Chrome Extension API
*   Gemini AI API

## Contributing

Contributions to Gemini Responder are welcome!  Please feel free to submit bug reports, feature requests, or pull requests through the GitHub repository.

## License

This project has no license. All rights reserved.

## Disclaimer

This extension utilizes the Gemini AI API, and the generated responses are subject to the limitations and biases of the underlying AI model.  Use responsibly and review all generated responses before sending them. The developer is not responsible for any consequences resulting from the use of this extension.
