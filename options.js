document.addEventListener("DOMContentLoaded", () => {
  const fixedDataContainer = document.getElementById("fixedDataContainer");
  const customTrainingPrompt = document.getElementById("customTrainingPrompt");
  const saveCustomPromptButton = document.getElementById("saveCustomPrompt");
  const addFixedDataButton = document.getElementById("addFixedData");
  const saveFixedDataButton = document.getElementById("saveFixedData");

  // Load existing data on startup
  loadFixedData();
  loadcustomTrainingPrompt();


  // Function to create an input group (label, key, value, delete button)
  function createFixedDataInput() {
    const div = document.createElement("div");
    div.classList.add("input-group");

    const label = document.createElement("label");
    label.textContent = "Key:";
    div.appendChild(label);

    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.placeholder = "Enter key";
    div.appendChild(keyInput);

    const label2 = document.createElement("label");
    label2.textContent = "Value:";
    div.appendChild(label2);

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.placeholder = "Enter value";
    div.appendChild(valueInput);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      div.remove();
    });
    div.appendChild(deleteButton);

    return div;
  }

  // Add new data
  addFixedDataButton.addEventListener("click", () => {
    const newInputGroup = createFixedDataInput();
    fixedDataContainer.appendChild(newInputGroup);
  });

  // Save fixed data to storage
  saveFixedDataButton.addEventListener("click", () => {
    const fixedData = {};
    const inputGroups = document.querySelectorAll("#fixedDataContainer .input-group");

    inputGroups.forEach(group => {
      const keyInput = group.querySelector("input[type='text']:nth-of-type(1)");
      const valueInput = group.querySelector("input[type='text']:nth-of-type(2)");

      const key = keyInput.value.trim();
      const value = valueInput.value.trim();

      if (key !== "") {
        fixedData[key] = value;
      }
    });

    chrome.storage.local.set({ fixedData: fixedData }, () => {
      console.log("Fixed data saved:", fixedData);
      alert("Fixed data saved!");
    });
  });

  saveCustomPromptButton.addEventListener("click", () => {
    chrome.storage.local.set({ customTrainingPrompt: customTrainingPrompt.value }, () => {
      alert("Custom prompt saved!");
    });
  });

  // Load fixed data from storage
  function loadFixedData() {
    chrome.storage.local.get("fixedData", (data) => {
      const fixedData = data.fixedData || {};

      for (const key in fixedData) {
        if (fixedData.hasOwnProperty(key)) {
          const newInputGroup = createFixedDataInput();
          const keyInput = newInputGroup.querySelector("input[type='text']:nth-of-type(1)");
          const valueInput = newInputGroup.querySelector("input[type='text']:nth-of-type(2)");
          keyInput.value = key;
          valueInput.value = fixedData[key];
          fixedDataContainer.appendChild(newInputGroup);
        }
      }
    });
  }

  function loadcustomTrainingPrompt() {
    chrome.storage.local.get("customTrainingPrompt", (data) => {
      const userLanguage = navigator.language || navigator.userLanguage;
      const customTrainingPrompt = data.customTrainingPrompt || `You are an expert prompt engineer. Your task is to enhance, but *not replace*, an existing custom prompt for the Gemini model. Analyze the following conversation context, an "ideal" response provided by a user, and the current custom prompt.

      Conversation Context: [CONTEXT]
      Ideal Response (Quoted Message): [QUOTEDMESSAGE]
      Current Custom Prompt: [CURRENTPROMPT]

      Based on this information, generate a new and improved custom prompt in ${userLanguage} language. Critically, *preserve the existing functionality of the current prompt*. Only add to or subtly refine the current prompt to make it better align with the "ideal" response, given the conversation context. Do not remove or significantly alter existing instructions unless absolutely necessary for improved performance. Prioritize adding new relevant instructions, clarifying existing ones, or making them more specific. Consider if the current prompt is missing any crucial information or constraints that would guide the Gemini model to a better response.

      New and Enhanced Custom Prompt (Preserving Existing Functionality):`;

      document.querySelector("#customTrainingPrompt").textContent = customTrainingPrompt;
    });
  }
});

