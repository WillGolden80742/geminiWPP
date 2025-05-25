let geminiObserver = null;

// Generic selector for WhatsApp text input field
const WHATSAPP_INPUT_SELECTOR = 'div[data-tab="10"][role="textbox"]';

/**
 * Gets a response from the Gemini API based on the conversation context.
 * @param {string} context Conversation history.
 * @returns {Promise<string>} Gemini's response.
 */
async function getGeminiResponse(context) {
    return new Promise((resolve) => {
        // Adds a small delay to ensure the WhatsApp interface is ready
        setTimeout(async () => {
            try {
                // Retrieves extension settings from local storage
                const {
                    geminiApiKey,
                    geminiModel,
                } = await chrome.storage.sync.get(["geminiApiKey", "geminiModel"]);

                const {
                    customPrompt
                } = await chrome.storage.local.get(["customPrompt"]);

                const {
                    fixedData
                } = await chrome.storage.local.get(["fixedData"]);

                // Defines the Gemini model to use (uses the default if not configured)
                const model = geminiModel || 'gemini-1.5-flash';
                const apiKey = geminiApiKey;

                // Checks if the API key is configured
                if (!apiKey) {
                    const errorMessage = "Gemini API key not set. Please configure in the extension options.";
                    console.error(errorMessage);
                    resolve(errorMessage);
                    return;
                }

                const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const quotedMessage = getQuotedMessage();
                const fromMessage = getFromMessage();
                const prompt = await createGeminiPrompt(context, quotedMessage, fromMessage, customPrompt, fixedData);

                const response = await fetch(geminiApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    })
                });

                // Gets the WhatsApp input element
                const whatsAppInputElement = document.querySelector(WHATSAPP_INPUT_SELECTOR);

                // Handles errors in the API response
                if (!response.ok) {
                    const error = `Gemini API request failed: ${response.status} - ${response.statusText}`;
                    injectGeminiResponse(whatsAppInputElement, error);
                    throw new Error(error);
                }

                const responseData = await response.json();

                // Extracts the response from Gemini or uses a fallback message
                let geminiReply = "Could not generate a response with Gemini.";
                if (responseData.candidates && responseData.candidates.length > 0) {
                    geminiReply = responseData.candidates[0].content.parts[0].text;
                } else {
                    console.warn("Gemini API response did not contain valid candidates.");
                }

                // Injects the response into the WhatsApp text field
                injectGeminiResponse(whatsAppInputElement, geminiReply);
                resolve(geminiReply);
            } catch (error) {
                const errorMessage = "Error fetching Gemini response:" + error;
                console.error(errorMessage);
                injectGeminiResponse(whatsAppInputElement, errorMessage);
                resolve("Error fetching Gemini response. Check the console for details.");
            }
        }, 1000);
    });
}

/**
 * "Trains" Gemini to improve the custom prompt.
 * @returns {Promise<void>}
 */
async function trainingGemini() {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const {
                    geminiApiKey,
                    geminiModel,
                } = await chrome.storage.sync.get(["geminiApiKey", "geminiModel"]);

                const {
                    customPrompt
                } = await chrome.storage.local.get(["customPrompt"]);

                const {
                    customTrainingPrompt
                } = await chrome.storage.local.get(["customTrainingPrompt"]);

                const model = geminiModel || 'gemini-1.5-flash';
                const apiKey = geminiApiKey;

                if (!apiKey) {
                    const whatsAppInputElement = document.querySelector(WHATSAPP_INPUT_SELECTOR);
                    injectGeminiResponse(whatsAppInputElement, "Gemini API key not set. Please configure in the extension options.");
                    reject("Gemini API key not set.");
                    return;
                }

                const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const quotedMessage = getQuotedMessage();
                const fromMessage = getFromMessage();
                const context = collectChatHistory();
                const trainingPrompt = await createTrainingPrompt(context, quotedMessage, fromMessage, customPrompt, customTrainingPrompt);
                const whatsAppInputElement = document.querySelector(WHATSAPP_INPUT_SELECTOR);
                const response = await fetch(geminiApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: trainingPrompt
                            }]
                        }]
                    })
                });

                if (!response.ok) {
                    const error = `Gemini API request failed: ${response.status} - ${response.statusText}`;
                    injectGeminiResponse(whatsAppInputElement, "Error training Gemini. Check console.");
                    console.error(error);
                    reject(error);
                    return;
                }

                const responseData = await response.json();

                let newCustomPrompt = "Could not generate a new custom prompt.";
                if (responseData.candidates && responseData.candidates.length > 0) {
                    newCustomPrompt = responseData.candidates[0].content.parts[0].text;

                    // Save the new custom prompt to local storage
                    chrome.storage.local.set({
                        customPrompt: newCustomPrompt
                    }, () => {
                        console.log("New custom prompt saved:", newCustomPrompt);
                        injectGeminiResponse(whatsAppInputElement, "Gemini trained successfully! New prompt saved.");
                        resolve();
                    });
                } else {
                    console.warn("Gemini API response did not contain valid candidates for training.");
                    injectGeminiResponse(whatsAppInputElement, "Error training Gemini. No valid response received.");
                    reject("No valid response from Gemini API.");
                }

            } catch (error) {
                console.error("Error training Gemini:", error);
                const whatsAppInputElement = document.querySelector(WHATSAPP_INPUT_SELECTOR);
                injectGeminiResponse(whatsAppInputElement, "Error training Gemini. Check console.");
                reject(error);
            }
        }, 1000);
    });
}
/**
 * Creates a prompt to train Gemini to generate a new custom prompt.
 * @param {string} context Conversation history.
 * @param {string} quotedMessage Ideal response (quoted message).
 * @param {string} currentPrompt Current custom prompt.
 * @param {string} customTrainingPrompt Custom training prompt template.
 * @returns {string} Formatted prompt for training.
 */
async function createTrainingPrompt(context, quotedMessage, fromMessage, currentPrompt, customTrainingPrompt) {
    const userLanguage = navigator.language || navigator.userLanguage;

    // Use the custom training prompt or the default if it's not configured
    let promptTemplate = customTrainingPrompt || `You are an expert prompt engineer. Your task is to enhance, but *not replace*, an existing custom prompt for the Gemini model. Analyze the following conversation context, an "ideal" response provided by a user, and the current custom prompt.

    Conversation Context: [CONTEXT]
    Ideal Response (Quoted Message): [QUOTEDMESSAGE]
    Current Custom Prompt: [CURRENTPROMPT]

    Based on this information, generate a new and improved custom prompt in [CURRENTLANGUAGE] language. Critically, *preserve the existing functionality of the current prompt*. Only add to or subtly refine the current prompt to make it better align with the "ideal" response, given the conversation context. Do not remove or significantly alter existing instructions unless absolutely necessary for improved performance. Prioritize adding new relevant instructions, clarifying existing ones, or making them more specific. Consider if the current prompt is missing any crucial information or constraints that would guide the Gemini model to a better response.

    New and Enhanced Custom Prompt (Preserving Existing Functionality):`;


    // Replace variables in the prompt template
    let prompt = promptTemplate.replace(/\[CONTEXT\]/g, context)
        .replace(/\[QUOTEDMESSAGE\]/g, quotedMessage)
        .replace(/\[FROMMESSAGE\]/g, fromMessage)
        .replace(/\[CURRENTPROMPT\]/g, currentPrompt).replace(/\[CURRENTLANGUAGE\]/g, userLanguage);

    return prompt;
}

/**
 * Creates the prompt for the Gemini API.
 * @param {string} context Conversation history.
 * @param {string} quotedMessage Quoted message.
 * @param {string} customPrompt Custom prompt.
 * @param {object} fixedData Fixed data.
 * @returns {string} Formatted prompt.
 */
async function createGeminiPrompt(context, quotedMessage, fromMessage, customPrompt, fixedData) {
    const userLanguage = navigator.language || navigator.userLanguage;
    // Add greeting with
    const now = new Date();
    let hour = now.getHours();
    if (hour >= 5 && hour < 12) {
        greeting = 'Good morning!';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Good afternoon!';
    } else {
        greeting = 'Good evening!';
    }

    const ampm = hour >= 12 ? 'PM' : 'AM';

    let prompt = `Current hour is ${hour}${ampm} and you should start the greeting with ${greeting} in current language!\n\n`;

    // Adds fixed data to the prompt
    if (fixedData) {
        prompt += "Here is fixed data to take into consideration:\n";
        for (const key in fixedData) {
            if (fixedData.hasOwnProperty(key)) {
                prompt += `${key}: ${fixedData[key]}\n`;
            }
        }
        prompt += "\n";
    }

    if (customPrompt) {
        prompt += `${customPrompt}\n\n`;
    }

    prompt += `Based on the following WhatsApp messages, generate an appropriate response in ${userLanguage} language: Context of the conversation: ${context} Respond to this message based on the context: ${quotedMessage} from: ${fromMessage}\nResponse:`;

    return prompt;
}

/**
 * Injects Gemini's response into the WhatsApp text field and triggers the input event.
 * @param {HTMLElement} whatsAppTargetElement WhatsApp input element.
 * @param {string} geminiResponse Gemini's response.
 */
async function injectGeminiResponse(whatsAppTargetElement, geminiResponse) {
    if (!whatsAppTargetElement) {
        console.warn("WhatsApp Signature: WhatsApp text input field not found.");
        return;
    }

    whatsAppTargetElement.textContent = geminiResponse;

    // Triggers the 'input' event so WhatsApp recognizes the change
    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: geminiResponse
    });
    whatsAppTargetElement.dispatchEvent(inputEvent);

    whatsAppTargetElement.focus(); // Keeps focus on the input for the user to continue typing
}

/**
 * Collects the message history of the current chat.
 * @returns {string} Formatted conversation history.
 */
function collectChatHistory() {
    const messageBotElements = document.querySelectorAll('.message-out .copyable-text');
    const messageUserElements = document.querySelectorAll('.message-in .copyable-text');
    const messages = [];

    messageBotElements.forEach(element => {
        messages.push({
            sender: 'bot',
            message: element.textContent.trim()
        });
    });

    messageUserElements.forEach(element => {
        messages.push({
            sender: 'client',
            message: element.textContent.trim()
        });
    });

    return JSON.stringify(messages); // Returns a formatted JSON string
}

/**
 * Gets the last quoted message.
 * @returns {string} Content of the quoted message.
 */
function getQuotedMessage() {
    const messageElements = document.querySelectorAll('.quoted-mention');
    if (messageElements && messageElements.length > 0) {
        return messageElements[messageElements.length - 1].parentElement.textContent;
    }
    return "";
}

function getFromMessage() {
    const messageElements = document.querySelectorAll('.quoted-mention');
    if (messageElements && messageElements.length > 0) {
        return messageElements[messageElements.length - 1].parentElement.parentElement.querySelector('div span').textContent;
    }
    return "";
}

/**
 * Observes the WhatsApp interface to add the Gemini menu item.
 */
function observeMenuElement() {
    const observer = new MutationObserver(mutations => {
        // Finds the ul element inside the menu
        try {
            const ulElement = document.querySelector('[data-icon="reply-refreshed"]').parentElement.parentElement.parentElement.parentElement.parentElement;
            ulElement.parentElement.parentElement.style.height = '325px';
            ulElement.parentElement.parentElement.style.overflowY = 'auto';
            if (ulElement) {
                // Small delay to ensure the element is fully loaded
                setTimeout(async () => {
                    const {
                        geminiEnabled
                    } = await chrome.storage.sync.get(["geminiEnabled"]);

                    // Checks if Gemini is enabled and the menu item doesn't already exist
                    if (geminiEnabled && !document.querySelector('.reply_by_gemini')) {
                        // Creates the "Reply with Gemini" menu item
                        const geminiLiElement = replyWithGeminiMenuItem();
                        const trainingLiMenuItem = trainingGeminiMenuItem();

                        // Adds the item to the beginning of the list
                        ulElement.insertBefore(trainingLiMenuItem, ulElement.firstChild);
                        ulElement.insertBefore(geminiLiElement, ulElement.firstChild);

                        // Adds the click event for the "Reply with Gemini" item
                        geminiLiElement.addEventListener('click', async () => {
                            const {
                                geminiEnabled
                            } = await chrome.storage.sync.get(["geminiEnabled"]);

                            // Checks if Gemini is enabled
                            if (!geminiEnabled) {
                                alert("Gemini is disabled in the extension options.");
                                return;
                            }

                            // Simulates a click on the reply button
                            document.querySelector('[data-icon="reply-refreshed"]').parentElement.click();

                            const chatHistory = collectChatHistory();
                            // Gets the Gemini response
                            getGeminiResponse(chatHistory);
                        });

                        // Adds the click event for the "Training Gemini" item
                        trainingLiMenuItem.addEventListener('click', async () => {
                            const {
                                geminiEnabled
                            } = await chrome.storage.sync.get(["geminiEnabled"]);

                            if (!geminiEnabled) {
                                alert("Gemini is disabled in the extension options.");
                                return;
                            }

                            // Simulates a click on the reply button (necessary for quoting the message)
                            document.querySelector('[data-icon="reply-refreshed"]').parentElement.click();

                            try {
                                await trainingGemini();
                            } catch (error) {
                                console.error("Error during training:", error);
                                // The trainingGemini function already displays an error message.
                            }
                        });
                    }
                }, 125);

                observer.disconnect(); // Disconnects the observer after finding and modifying the menu
                observeMenuElement(); // Restarts the observation for future changes
            }
        } catch {
            console.log('[data-icon="reply-refreshed"] not found');
        }
    });

    const config = {
        childList: true,
        subtree: true
    };

    observer.observe(document.body, config);
}

/**
 * Creates the "Reply with Gemini" menu item.
 * @returns {HTMLLIElement} "Reply with Gemini" menu item.
 */
function replyWithGeminiMenuItem() {
    return createGeminiMenuItem('reply_by_gemini', 'Reply with Gemini', 'gemini_gray_icon.svg');
}

function trainingGeminiMenuItem() {
    return createGeminiMenuItem('trainig_gemini', 'Training Gemini', 'neural_gray_icon.svg');
}

function createGeminiMenuItem(name, text, icon) {
    const geminiLiElement = document.createElement('li');
    geminiLiElement.setAttribute('tabindex', '0');
    geminiLiElement.className = name;
    geminiLiElement.style.color = '#a5a5a5';
    geminiLiElement.style.borderRadius = '10px';
    geminiLiElement.setAttribute('data-animate-dropdown-item', 'true');
    geminiLiElement.setAttribute('role', 'button');
    geminiLiElement.style.opacity = '1';

    // Adds hover style using JavaScript
    geminiLiElement.addEventListener('mouseover', function() {
        geminiLiElement.style.backgroundColor = '#343636';
    });

    geminiLiElement.addEventListener('mouseout', function() {
        geminiLiElement.style.backgroundColor = '';
    });

    const outerDiv = document.createElement('div');
    outerDiv.className = 'x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 x2lwn1j x1nhvcw1 x1q0g3np x6s0dn4 x1ypdohk x5w4yej x1vqgdyp xh8yej3';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 x2lwn1j xl56j7k x1q0g3np x1cy8zhl xt4ypqs x1i64zmx xmo9yow';

    const spanIcon = document.createElement('span');
    spanIcon.setAttribute('aria-hidden', 'true');
    spanIcon.setAttribute('data-icon', 'search-refreshed');

    // Use the SVG from the file
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL(`images/${icon}`); // Make sure the path is correct relative to the manifest
    img.style.width = '24px'; // Optional: Adjust size as needed
    img.style.height = '24px'; // Optional: Adjust size as needed
    img.alt = 'Gemini Icon'; // Optional: Add alt text for accessibility

    spanIcon.appendChild(img);
    iconDiv.appendChild(spanIcon);
    outerDiv.appendChild(iconDiv);

    const spanText = document.createElement('span');
    spanText.className = 'x1o2sk6j x6prxxf x6ikm8r x10wlt62 xlyipyv xuxw1ft xqmxbcd';
    spanText.textContent = text;

    outerDiv.appendChild(spanText);
    geminiLiElement.appendChild(outerDiv);

    return geminiLiElement;
}

// Waits for the interface to load before starting (first time)
const appObserver = new MutationObserver((mutations) => {
    // Uses the same generic selector for the initial element
    const appElement = document.querySelector(WHATSAPP_INPUT_SELECTOR);

    if (appElement) {
        // Starts the observation. Call this function when the page is loaded.
        observeMenuElement();
        appObserver.disconnect(); // Disconnects the observer once the #app element is found
    }
});

// Starts observation on the document for the element with the id 'app'
appObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
});