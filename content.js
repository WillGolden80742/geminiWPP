let geminiObserver = null;
// Define um seletor mais genérico que busca pelo atributo contenteditable e o role="textbox"
const selectorWhatsAppInput = 'div[data-tab="10"][role="textbox"]';

async function getGeminiResponse(context) {
    setTimeout(() => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(["geminiApiKey", "geminiModel", "customPrompt"], async ({  // get customPrompt
                geminiApiKey,
                geminiModel,
                customPrompt
            }) => {
                const model = geminiModel || 'gemini-1.5-flash';
                const apiKey = geminiApiKey;
                const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const quotedMessage = getQuotedMessage();
                // Validar se apiKey está presente
                if (!apiKey) {
                    console.error("A chave da API Gemini não está definida. Por favor, adicione a chave nas opções da extensão.");
                    resolve("A chave da API Gemini não está definida. Por favor, adicione a chave nas opções da extensão.");
                    return;
                }

                let prompt = ``;

                if (customPrompt) {
                   prompt += `${customPrompt}\n\n`; // add custom prompt at the begining
                }

                 prompt += `Com base nas seguintes mensagens do WhatsApp, gere uma resposta adequada:

                Contexto da conversa:
                ${context}

                Responda essa mensagem com base no contexto:
                ${quotedMessage}

                Resposta:`;

                const data = {
                    prompt: prompt
                };

                try {
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
                    const whatsAppInputElement = document.querySelector(selectorWhatsAppInput);
                    if (!response.ok) {
                       const error = `Erro na requisição para a API Gemini: ${response.status} - ${response.statusText}`;
                       injectGeminiResponse(whatsAppInputElement, error);
                        throw new Error(error);
                    }

                    const responseData = await response.json();

                    let geminiReply = "Não foi possível gerar uma resposta com o Gemini.";  // fallback
                    if (responseData.candidates && responseData.candidates.length > 0) {
                        geminiReply = responseData.candidates[0].content.parts[0].text;
                    } else {
                        console.warn("Resposta da API Gemini não continha candidates válidos.");
                    }
                    resolve(geminiReply);
                    injectGeminiResponse(whatsAppInputElement, geminiReply);
                } catch (error) {
                    console.error("Erro ao obter resposta do Gemini:", error);
                    resolve("Erro ao obter resposta do Gemini. Verifique o console para detalhes.");
                }
            });
        });
    }, 1000);
}


// Função para injetar a resposta do Gemini no campo de texto do WhatsApp
async function injectGeminiResponse(whatsAppTargetElement, geminiResponse) {
    if (!whatsAppTargetElement) {
        console.warn("WhatsApp Signature: Campo de texto do WhatsApp não encontrado.");
        return;
    }

    // Usar a resposta do Gemini diretamente no campo de texto
    whatsAppTargetElement.textContent = geminiResponse;

    // Disparar evento 'input' para o WhatsApp reconhecer a mudança
    const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: geminiResponse
    });
    whatsAppTargetElement.dispatchEvent(inputEvent);

    whatsAppTargetElement.focus(); // Manter o foco no input para o usuário continuar digitando
}
// Função para coletar o histórico de mensagens
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

// Função para obter a última mensagem, incluindo as suas
function getQuotedMessage() {
    const messageElements = document.querySelectorAll('.quoted-mention');
    if (messageElements) {
        return messageElements[messageElements.length - 1].textContent;
    }
    return ""; // Retorna uma string vazia se não houver mensagens
}
// Função para observar a interface do WhatsApp e adicionar o item de menu Gemini
function observeMenuElement() {
    const observer = new MutationObserver(mutations => {
        // Encontra a ul dentro do menu
        const ulElement = document.querySelector('[data-icon="reply-refreshed"]').parentElement.parentElement.parentElement.parentElement.parentElement;
        if (ulElement) {
                setTimeout(() => {
                    chrome.storage.sync.get(["geminiEnabled"], async ({
                                    geminiEnabled
                    }) => {
                        if (geminiEnabled && !document.querySelector('.reply_by_gemini')) {

                                // Cria o elemento li para "Responder com Gemini"
                                const geminiLiElement = createGeminiMenuItem();

                                // Adiciona o item "Responder com Gemini" ao início da lista
                                ulElement.insertBefore(geminiLiElement, ulElement.firstChild);

                                // Adiciona um evento de clique para o item "Responder com Gemini"
                                geminiLiElement.addEventListener('click', async () => {
                                        chrome.storage.sync.get(["geminiEnabled"], async ({
                                            geminiEnabled
                                        }) => {
                                            if (geminiEnabled === false) {
                                                alert("O Gemini está desativado nas opções da extensão.");
                                                return;
                                            }
                                            document.querySelector('[data-icon="reply-refreshed"]').parentElement.click();
                                            const chatHistory = collectChatHistory();
                                            // Obter a resposta do Gemini
                                            getGeminiResponse(chatHistory);

                                        });
                                });
                        
                        }
                    });

            }, 125);
            observer.disconnect();
            observeMenuElement();
        }
    });

    // Configuração do observer: observar adições de nós (subtree para observar elementos dentro de elementos).
    const config = {
        childList: true,
        subtree: true
    };

    // Inicia a observação do documento (ou do elemento que contém o potencial 'menu').
    observer.observe(document.body, config);
}
function createGeminiMenuItem() {
    const geminiLiElement = document.createElement('li');
    geminiLiElement.setAttribute('tabindex', '0');
    geminiLiElement.className = 'reply_by_gemini';
    geminiLiElement.style.color = '#FFFFFF99';
    geminiLiElement.style.borderRadius = '10px';
    geminiLiElement.setAttribute('data-animate-dropdown-item', 'true');
    geminiLiElement.setAttribute('role', 'button');
    geminiLiElement.style.opacity = '1';

    // Add the hover style using JavaScript.  This is important as it dynamically adds the style.
    geminiLiElement.addEventListener('mouseover', function() {
        geminiLiElement.style.backgroundColor = '#ffffff1a';
    });

    geminiLiElement.addEventListener('mouseout', function() {
        geminiLiElement.style.backgroundColor = ''; // Or revert to the original background if it had one.
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
    spanText.textContent = 'Responder com Gemini';

    outerDiv.appendChild(spanText);
    geminiLiElement.appendChild(outerDiv);

    return geminiLiElement;
}


// Aguarda a interface carregar antes de iniciar (primeira vez)
const appObserver = new MutationObserver((mutations) => {
    // Usa o mesmo seletor genérico para o elemento inicial
    const appElement = document.querySelector(selectorWhatsAppInput);

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
