// content.js

let geminiObserver = null;

// Seletor genérico para o campo de texto do WhatsApp
const WHATSAPP_INPUT_SELECTOR = 'div[data-tab="10"][role="textbox"]';

/**
 * Obtém uma resposta da API Gemini com base no contexto da conversa.
 * @param {string} context Histórico da conversa.
 * @returns {Promise<string>} Resposta do Gemini.
 */
async function getGeminiResponse(context) {
    return new Promise((resolve) => {
        // Adiciona um pequeno atraso para garantir que a interface do WhatsApp esteja pronta
        setTimeout(async () => {
            try {
                // Recupera as configurações da extensão do armazenamento local
                const {
                    geminiApiKey,
                    geminiModel,
                    customPrompt
                } = await chrome.storage.sync.get(["geminiApiKey", "geminiModel", "customPrompt"]);

                // Define o modelo Gemini a ser usado (usa o padrão se não estiver configurado)
                const model = geminiModel || 'gemini-1.5-flash';
                const apiKey = geminiApiKey;

                // Verifica se a chave da API está configurada
                if (!apiKey) {
                    const errorMessage = "Gemini API key not set. Please configure in the extension options.";
                    console.error(errorMessage);
                    resolve(errorMessage);
                    return;
                }

                const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const quotedMessage = getQuotedMessage();
                const prompt = createGeminiPrompt(context, quotedMessage, customPrompt);

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

                // Obtém o elemento de input do WhatsApp
                const whatsAppInputElement = document.querySelector(WHATSAPP_INPUT_SELECTOR);

                // Trata erros na resposta da API
                if (!response.ok) {
                    const error = `Gemini API request failed: ${response.status} - ${response.statusText}`;
                    injectGeminiResponse(whatsAppInputElement, error);
                    throw new Error(error);
                }

                const responseData = await response.json();

                // Extrai a resposta do Gemini ou usa uma mensagem de fallback
                let geminiReply = "Could not generate a response with Gemini.";
                if (responseData.candidates && responseData.candidates.length > 0) {
                    geminiReply = responseData.candidates[0].content.parts[0].text;
                } else {
                    console.warn("Gemini API response did not contain valid candidates.");
                }

                // Injeta a resposta no campo de texto do WhatsApp
                injectGeminiResponse(whatsAppInputElement, geminiReply);
                resolve(geminiReply);
            } catch (error) {
                console.error("Error fetching Gemini response:", error);
                resolve("Error fetching Gemini response. Check the console for details.");
            }
        }, 1000);
    });
}

/**
 * Cria o prompt para a API Gemini.
 * @param {string} context Histórico da conversa.
 * @param {string} quotedMessage Mensagem citada.
 * @param {string} customPrompt Prompt customizado.
 * @returns {string} Prompt formatado.
 */
function createGeminiPrompt(context, quotedMessage, customPrompt) {
    const userLanguage = navigator.language || navigator.userLanguage;
    let prompt = '';
    if (customPrompt) {
        prompt += `${customPrompt}\n\n`;
    }

    prompt += `Based on the following WhatsApp messages, generate an appropriate response in ${userLanguage} language: Context of the conversation: ${context} Respond to this message based on the context: ${quotedMessage} Response:`;

    return prompt;
}

/**
 * Injeta a resposta do Gemini no campo de texto do WhatsApp e dispara o evento de input.
 * @param {HTMLElement} whatsAppTargetElement Elemento de input do WhatsApp.
 * @param {string} geminiResponse Resposta do Gemini.
 */
async function injectGeminiResponse(whatsAppTargetElement, geminiResponse) {
    if (!whatsAppTargetElement) {
        console.warn("WhatsApp Signature: WhatsApp text input field not found.");
        return;
    }

    whatsAppTargetElement.textContent = geminiResponse;

    // Dispara o evento 'input' para que o WhatsApp reconheça a mudança
    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: geminiResponse
    });
    whatsAppTargetElement.dispatchEvent(inputEvent);

    whatsAppTargetElement.focus(); // Mantém o foco no input para o usuário continuar digitando
}

/**
 * Coleta o histórico de mensagens do chat atual.
 * @returns {string} Histórico da conversa formatado.
 */
function collectChatHistory() {
    const messageOutElements = document.querySelectorAll('.message-out .copyable-text');
    const messageInElements = document.querySelectorAll('.message-in .copyable-text');
    const messages = [];

    messageOutElements.forEach(element => {
        messages.push(`send me message => ${element.textContent}`);
    });

    messageInElements.forEach(element => {
        messages.push(`my message => ${element.textContent}`);
    });

    return messages.join('\n');
}

/**
 * Obtém a última mensagem citada.
 * @returns {string} Conteúdo da mensagem citada.
 */
function getQuotedMessage() {
    const messageElements = document.querySelectorAll('.quoted-mention');
    if (messageElements && messageElements.length > 0) {
        return messageElements[messageElements.length - 1].textContent;
    }
    return "";
}

/**
 * Observa a interface do WhatsApp para adicionar o item de menu Gemini.
 */
function observeMenuElement() {
    const observer = new MutationObserver(mutations => {
        // Encontra o elemento ul dentro do menu
        const ulElement = document.querySelector('[data-icon="reply-refreshed"]').parentElement.parentElement.parentElement.parentElement.parentElement;
        if (ulElement) {
            // Pequeno atraso para garantir que o elemento esteja totalmente carregado
            setTimeout(async () => {
                const {
                    geminiEnabled
                } = await chrome.storage.sync.get(["geminiEnabled"]);

                // Verifica se o Gemini está habilitado e o item de menu ainda não existe
                if (geminiEnabled && !document.querySelector('.reply_by_gemini')) {
                    // Cria o item de menu "Responder com Gemini"
                    const geminiLiElement = createGeminiMenuItem();

                    // Adiciona o item ao início da lista
                    ulElement.insertBefore(geminiLiElement, ulElement.firstChild);

                    // Adiciona o evento de clique para o item "Responder com Gemini"
                    geminiLiElement.addEventListener('click', async () => {
                        const {
                            geminiEnabled
                        } = await chrome.storage.sync.get(["geminiEnabled"]);

                        // Verifica se o Gemini está habilitado
                        if (!geminiEnabled) {
                            alert("Gemini is disabled in the extension options.");
                            return;
                        }

                        // Simula o clique no botão de resposta
                        document.querySelector('[data-icon="reply-refreshed"]').parentElement.click();

                        const chatHistory = collectChatHistory();
                        // Obtém a resposta do Gemini
                        getGeminiResponse(chatHistory);
                    });
                }
            }, 125);

            observer.disconnect(); // Desconecta o observer após encontrar e modificar o menu
            observeMenuElement(); // Reinicia a observação para futuras mudanças
        }
    });

    const config = {
        childList: true,
        subtree: true
    };

    observer.observe(document.body, config);
}

/**
 * Cria o elemento de menu "Responder com Gemini".
 * @returns {HTMLLIElement} Elemento de menu "Responder com Gemini".
 */
function createGeminiMenuItem() {
    const geminiLiElement = document.createElement('li');
    geminiLiElement.setAttribute('tabindex', '0');
    geminiLiElement.className = 'reply_by_gemini';
    geminiLiElement.style.color = '#FFFFFF99';
    geminiLiElement.style.borderRadius = '10px';
    geminiLiElement.setAttribute('data-animate-dropdown-item', 'true');
    geminiLiElement.setAttribute('role', 'button');
    geminiLiElement.style.opacity = '1';

    // Adiciona o estilo de hover usando JavaScript
    geminiLiElement.addEventListener('mouseover', function () {
        geminiLiElement.style.backgroundColor = '#ffffff1a';
    });

    geminiLiElement.addEventListener('mouseout', function () {
        geminiLiElement.style.backgroundColor = '';
    });

    const outerDiv = document.createElement('div');
    outerDiv.className = 'x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 x2lwn1j x1nhvcw1 x1q0g3np x6s0dn4 x1ypdohk x5w4yej x1vqgdyp xh8yej3';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 x2lwn1j xl56j7k x1q0g3np x1cy8zhl xt4ypqs x1i64zmx xmo9yow';

    const spanIcon = document.createElement('span');
    spanIcon.setAttribute('aria-hidden', 'true');
    spanIcon.setAttribute('data-icon', 'search-refreshed');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 225 225');
    svg.setAttribute('version', '1.1');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const gBlack = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gBlack.setAttribute('id', '#000000ff');

    const gWhite = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gWhite.setAttribute('id', '#FFFFFF99');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', '#FFFFFF99');
    path.setAttribute('opacity', '1.00');
    path.setAttribute('d', 'M 111.44 11.58 C 112.16 8.06 111.65 4.39 112.57 0.90 C 114.22 16.23 117.52 31.57 124.69 45.34 C 142.54 83.30 182.12 109.91 224.02 112.08 L 224.07 112.95 C 202.02 113.69 180.48 121.86 162.62 134.66 C 135.08 153.95 116.61 185.66 113.38 219.13 C 113.20 220.63 113.07 222.19 112.22 223.51 C 110.75 190.68 93.78 159.30 68.41 138.69 C 49.33 123.63 25.64 113.69 1.20 112.88 L 1.15 112.14 C 26.02 110.99 50.19 101.09 69.36 85.32 C 91.82 67.02 106.98 40.18 111.44 11.58 Z');

    gWhite.appendChild(path);
    svg.appendChild(gBlack);
    svg.appendChild(gWhite);
    spanIcon.appendChild(svg);
    iconDiv.appendChild(spanIcon);
    outerDiv.appendChild(iconDiv);

    const spanText = document.createElement('span');
    spanText.className = 'x1o2sk6j x6prxxf x6ikm8r x10wlt62 xlyipyv xuxw1ft xqmxbcd';
    spanText.textContent = 'Reply with Gemini';

    outerDiv.appendChild(spanText);
    geminiLiElement.appendChild(outerDiv);

    return geminiLiElement;
}

// Aguarda a interface carregar antes de iniciar (primeira vez)
const appObserver = new MutationObserver((mutations) => {
    // Usa o mesmo seletor genérico para o elemento inicial
    const appElement = document.querySelector(WHATSAPP_INPUT_SELECTOR);

    if (appElement) {
        // Inicia a observação.  Chame esta função quando a página estiver carregada.
        observeMenuElement();
        appObserver.disconnect(); // Desconecta o observer assim que o elemento #app é encontrado
    }
});

// Inicia a observação no documento para o elemento com o id 'app'
appObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
});