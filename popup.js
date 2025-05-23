document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("geminiApiKey");
  const modelSelect = document.getElementById("geminiModel");
  const enableGemini = document.getElementById("enableGemini");
  const saveButton = document.getElementById("saveSettings");
  const customPromptTextarea = document.getElementById("customPrompt");
  const openOptionsButton = document.getElementById("openOptions"); // Novo botão

  // Carrega configurações do Chrome Storage
  chrome.storage.sync.get(["geminiApiKey", "geminiModel", "geminiEnabled"], (syncData) => {
    apiKeyInput.value = syncData.geminiApiKey || "";
    enableGemini.checked = syncData.geminiEnabled !== false;

    // Carrega os modelos disponíveis assim que a chave for preenchida
    if (syncData.geminiApiKey) {
      fetchModels(syncData.geminiApiKey, syncData.geminiModel);
    }
  });

  chrome.storage.local.get(["customPrompt"], (localData) => { // Load custom prompt from local storage
    customPromptTextarea.value = localData.customPrompt || "";
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

    // Save API key, model, and enabled settings to sync storage
    chrome.storage.sync.set({
      geminiApiKey: apiKey,
      geminiModel: model,
      geminiEnabled: isEnabled,
    }, () => {
      console.log("Sync settings saved.");
    });

    // Save custom prompt to local storage
    chrome.storage.local.set({
      customPrompt: customPrompt
    }, () => {
      console.log("Local settings saved.");
      alert("Settings saved!");
    });
  });

  // Abre a página de opções
  openOptionsButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
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