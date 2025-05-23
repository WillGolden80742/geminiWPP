# WhatsApp Gemini Responder

This Chrome extension enhances your WhatsApp Web experience by integrating smart responses powered by the Gemini API. It allows you to quickly generate replies based on the conversation context, making your communication more efficient and intelligent.

## Features

*   **Gemini-Powered Responses:** Generates contextually relevant replies using the Gemini API.
*   **Custom Prompting:** Allows you to define custom prompts to tailor the Gemini responses to your specific needs.
*   **Training Feature:**  Trains the Gemini API to improve custom prompts based on your feedback.
*   **Fixed Data Integration:**  Includes fixed data in the prompt for consistent and relevant responses.
*   **Easy Configuration:**  Simple setup through a popup menu to configure API keys, models, and other settings.
*   **WhatsApp Web Integration:** Seamlessly integrates into the WhatsApp Web interface, adding menu items for Gemini responses and training.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/WillGolden80742/geminiWPP.git
    cd geminiWPP
    ```

2.  **Open Chrome and go to `chrome://extensions`.**

3.  **Enable "Developer mode" in the top right corner.**

4.  **Click "Load unpacked" and select the directory where you cloned the repository (`geminiWPP`).**

5.  **The extension should now be installed.**

## Usage

1.  **Open WhatsApp Web in your browser.**
2.  **Click on the extension icon in the Chrome toolbar to open the popup.**
3.  **Enter your Gemini API key.**  You'll need a valid API key from Google Cloud's Generative AI service. You can obtain an API key at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey).
4.  **Select the Gemini model you want to use.**
5.  **Enable the extension by toggling the "Enable Gemini" option.**
6.  **(Optional) Customize the prompt according to your needs in the `Custom Prompt` field.**
7.  **(Optional) Set Fixed Data in the options page.** This data will be included in every prompt sent to the Gemini API.
8.  **Click "Save Settings".**
9.  **In WhatsApp Web, when you select a message, a "Reply with Gemini" and "Training Gemini" option will appear in the message options menu.**
10. **Click "Reply with Gemini" to generate a response based on the current conversation context.** The generated response will be inserted into the text input field.
11. **Click "Training Gemini" to generate an improved custom prompt for the API.  This will use the selected message as a guideline to train the API to generate a better custom prompt.**
12. **Edit or send the response as needed.**

## Configuration Options

*   **Gemini API Key:**  Your API key for accessing the Gemini API.  This is *required* for the extension to function.  You can obtain an API key from Google Cloud's Generative AI service at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey).
*   **Gemini Model:** The Gemini model to use for generating responses.  Defaults to `'gemini-1.5-flash'`.
*   **Enable Gemini:**  A toggle to enable or disable the Gemini integration in WhatsApp Web.
*   **Custom Prompt:** A customizable prompt that is included with every API request. This allows you to fine-tune how Gemini generates responses.
*   **Fixed Data:**  Key-value pairs that are added to the prompt for context.  Configure these in the options page.

## Understanding the Code

*   **`manifest.json`:**  Defines the extension's metadata, permissions, and content scripts.
*   **`content.js`:**  The content script that injects the Gemini integration into WhatsApp Web.  This script is responsible for:
    *   Observing the WhatsApp Web interface for new messages and menu actions.
    *   Collecting chat history.
    *   Calling the Gemini API to generate responses.
    *   Injecting the generated responses into the WhatsApp text input field.
*   **`popup.html`:**  The HTML for the extension's popup menu.
*   **`popup.js`:**  The JavaScript for the extension's popup menu, handling API key configuration, model selection, and enabling/disabling the extension.
*   **`options.html`:** The HTML for the extension's options page, to configure fixed data.
*   **`options.js`:** The Javascript for the extension's options page, to configure fixed data.
*   **`style.css`:**  Styling for the popup and options page.
*   **`images/`:** Contains the icons used in the extension.

## Technical Details

*   The extension uses `chrome.storage.sync` for storing configuration settings (API key, model, enabled state) across multiple devices.
*   The extension uses `chrome.storage.local` for storing the custom prompt, so it won't be synced across all logged-in chrome browsers.
*   The content script uses Mutation Observers to detect changes in the WhatsApp Web interface.
*   The content script injects custom menu items into the WhatsApp Web message options menu.
*   The extension calls the Gemini API using the `fetch` API.
*   Error handling is implemented to catch potential issues with the Gemini API and provide informative messages to the user.

## Contributing

Contributions are welcome! Feel free to submit pull requests with bug fixes, new features, or improvements to the documentation.

## License

This project is licensed under the [MIT License](LICENSE).

## Future Enhancements

*   Improve the accuracy and relevance of Gemini responses.
*   Implement a more sophisticated training mechanism.
*   Add options for response formatting.
*   Include the custom prompt at a global level or a chat level.

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository.
