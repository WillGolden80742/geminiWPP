document.addEventListener("DOMContentLoaded", () => {
    const apiKeyInput = document.getElementById("geminiApiKey");
    const modelSelect = document.getElementById("geminiModel");
    const enableGemini = document.getElementById("enableGemini");
    const saveButton = document.getElementById("saveSettings");
    const customPromptTextarea = document.getElementById("customPrompt");

    // Carrega configurações do Chrome Storage
    chrome.storage.sync.get(["geminiApiKey", "geminiModel", "geminiEnabled", "customPrompt"], (data) => {
        apiKeyInput.value = data.geminiApiKey || "";
        enableGemini.checked = data.geminiEnabled !== false;
        customPromptTextarea.value = data.customPrompt || "";


        // Carrega os modelos disponíveis assim que a chave for preenchida
        if (data.geminiApiKey) {
            fetchModels(data.geminiApiKey, data.geminiModel);
        }
    });

    // Atualiza a lista de modelos quando a API Key muda
    apiKeyInput.addEventListener("change", () => {
        const apiKey = apiKeyInput.value;
        if (apiKey) {
            fetchModels(apiKey);
        }
    });

    // Salva configurações
    saveButton.addEventListener("click", () => {
        const apiKey = apiKeyInput.value;
        const model = modelSelect.value;
        const isEnabled = enableGemini.checked;
        const customPrompt = customPromptTextarea.value;


        chrome.storage.sync.set({
            geminiApiKey: apiKey,
            geminiModel: model,
            geminiEnabled: isEnabled,
            customPrompt: customPrompt  // save custom prompt
        }, () => {
            console.log("Settings saved.");
            alert("Settings saved!");
        });
    });

    // Busca modelos da API Gemini e preenche o select
    async function fetchModels(apiKey, selectedModel) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao buscar modelos");

            const data = await response.json();
            if (!data.models || !Array.isArray(data.models)) return;

            modelSelect.innerHTML = ""; // Limpa o select

            data.models.forEach(model => {
                const option = document.createElement("option");
                option.value = model.name.split("/")[1];
                option.textContent = model.name.split("/")[1];
                modelSelect.appendChild(option);
            });

            // Seleciona o modelo salvo anteriormente, se existir
            if (selectedModel) {
                modelSelect.value = selectedModel;
            }
        } catch (error) {
            console.error("Erro ao buscar modelos Gemini:", error);
            alert("Erro ao carregar modelos. Verifique sua API Key.");
        }
    }
});