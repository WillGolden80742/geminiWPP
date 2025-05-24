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
        } = await chrome.storage.sync.get(["geminiApiKey", "geminiModel"]);

        const {
          customPrompt
        } = await chrome.storage.local.get(["customPrompt"]);

        const {
          fixedData
        } = await chrome.storage.local.get(["fixedData"]);

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
        const prompt = await createGeminiPrompt(context, quotedMessage, customPrompt, fixedData);

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
        const errorMessage = "Error fetching Gemini response:" + error;
        console.error(errorMessage);
        injectGeminiResponse(whatsAppInputElement, errorMessage);
        resolve("Error fetching Gemini response. Check the console for details.");
      }
    }, 1000);
  });
}

/**
 * "Treina" o Gemini para melhorar o prompt customizado.
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

        const model = geminiModel || 'gemini-1.5-flash';
        const apiKey = geminiApiKey;

        if (!apiKey) {
          injectGeminiResponse(whatsAppInputElement, "Gemini API key not set. Please configure in the extension options.");
          reject("Gemini API key not set.");
          return;
        }

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const quotedMessage = getQuotedMessage();
        const context = collectChatHistory();
        const trainingPrompt = await createTrainingPrompt(context, quotedMessage, customPrompt);
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
        injectGeminiResponse(whatsAppInputElement, "Error training Gemini. Check console.");
        reject(error);
      }
    }, 1000);
  });
}
/**
 * Cria um prompt para treinar o Gemini para gerar um novo prompt customizado.
 * @param {string} context Histórico da conversa.
 * @param {string} quotedMessage Resposta ideal (mensagem citada).
 * @param {string} currentPrompt Prompt customizado atual.
 * @returns {string} Prompt formatado para treinamento.
 */
async function createTrainingPrompt(context, quotedMessage, currentPrompt) {
  const userLanguage = navigator.language || navigator.userLanguage;
  let prompt = `You are an expert prompt engineer. Your task is to enhance, but *not replace*, an existing custom prompt for the Gemini model. Analyze the following conversation context, an "ideal" response provided by a user, and the current custom prompt.

  Conversation Context: ${context}
  Ideal Response (Quoted Message): ${quotedMessage}
  Current Custom Prompt: ${currentPrompt}

  Based on this information, generate a new and improved custom prompt in ${userLanguage} language. Critically, *preserve the existing functionality of the current prompt*. Only add to or subtly refine the current prompt to make it better align with the "ideal" response, given the conversation context. Do not remove or significantly alter existing instructions unless absolutely necessary for improved performance. Prioritize adding new relevant instructions, clarifying existing ones, or making them more specific.  Consider if the current prompt is missing any crucial information or constraints that would guide the Gemini model to a better response.

  New and Enhanced Custom Prompt (Preserving Existing Functionality):`;

  return prompt;
}

/**
 * Cria o prompt para a API Gemini.
 * @param {string} context Histórico da conversa.
 * @param {string} quotedMessage Mensagem citada.
 * @param {string} customPrompt Prompt customizado.
 * @param {object} fixedData Dados fixos.
 * @returns {string} Prompt formatado.
 */
async function createGeminiPrompt(context, quotedMessage, customPrompt, fixedData) {
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

  // Adiciona os dados fixos ao prompt
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

  return JSON.stringify(messages); // Retorna uma string JSON formatada
}


/**
 * Obtém a última mensagem citada.
 * @returns {string} Conteúdo da mensagem citada.
 */
function getQuotedMessage() {
  const messageElements = document.querySelectorAll('.quoted-mention');
  if (messageElements && messageElements.length > 0) {
    return messageElements[messageElements.length - 1].parentElement.parentElement.textContent;
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
    ulElement.parentElement.parentElement.style.height = '325px';
    ulElement.parentElement.parentElement.style.overflowY = 'auto';
    if (ulElement) {
      // Pequeno atraso para garantir que o elemento esteja totalmente carregado
      setTimeout(async () => {
        const {
          geminiEnabled
        } = await chrome.storage.sync.get(["geminiEnabled"]);

        // Verifica se o Gemini está habilitado e o item de menu ainda não existe
        if (geminiEnabled && !document.querySelector('.reply_by_gemini')) {
          // Cria o item de menu "Responder com Gemini"
          const geminiLiElement = replyWithGeminiMenuItem();
          const trainingLiMenuItem = trainingGeminiMenuItem();

          // Adiciona o item ao início da lista
          ulElement.insertBefore(trainingLiMenuItem, ulElement.firstChild);
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

          // Adiciona o evento de clique para o item "Training Gemini"
          trainingLiMenuItem.addEventListener('click', async () => {
            const {
              geminiEnabled
            } = await chrome.storage.sync.get(["geminiEnabled"]);

            if (!geminiEnabled) {
              alert("Gemini is disabled in the extension options.");
              return;
            }

            // Simula o clique no botão de resposta (necessário para citar a mensagem)
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

  // Adiciona o estilo de hover usando JavaScript
  geminiLiElement.addEventListener('mouseover', function () {
    geminiLiElement.style.backgroundColor = '#343636';
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