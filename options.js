document.addEventListener("DOMContentLoaded", () => {
  const fixedDataContainer = document.getElementById("fixedDataContainer");
  const customTrainingPrompt = document.getElementById("customTrainingPrompt");
  const saveCustomPromptButton = document.getElementById("saveCustomPrompt");
  const addFixedDataButton = document.getElementById("addFixedData");
  const saveFixedDataButton = document.getElementById("saveFixedData");
  const tabButtons = document.querySelectorAll(".tablinks"); // Get all tab buttons
  const tabContents = document.querySelectorAll(".tabcontent"); // Get all tab contents

    // Load existing data on startup
  loadFixedData();
  loadcustomTrainingPrompt();

  // Function to open a tab
  function openTab(evt, tabName) {
    tabContents.forEach(tabContent => {
      tabContent.style.display = "none";
    });

    tabButtons.forEach(tabButton => {
      tabButton.classList.remove("active");
    });

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
  }

  // Add click listeners to tab buttons
  tabButtons.forEach(button => {
    button.addEventListener("click", (event) => {
      const tabName = event.currentTarget.dataset.tab;
      openTab(event, tabName);
      if (tabName === "CustomTraining") {
        loadcustomTrainingPrompt();
      } else if (tabName === "FixedData") {
        loadFixedData();
      }
    });
  });

  // Open Custom Training tab by default
  openTab({ currentTarget: tabButtons[0] }, "CustomTraining"); // Simulate a click

  function listenerFixedData() {
      const inputGroups = document.querySelectorAll("#fixedDataContainer .input-group");

      inputGroups.forEach(group => {
        const keyInput = group.querySelector("input[type='text']:nth-of-type(1)");
        const valueInput = group.querySelector("input[type='text']:nth-of-type(2)");

        keyInput.addEventListener("input", () => {
            saveFixedDataButton.style.display = "initial"; // Show the button
        });

        valueInput.addEventListener("input", () => {
          saveFixedDataButton.style.display = "initial"; // Show the button
        });

      });
  }



  // Function to create an input group (label, key, value, delete button)
  function createFixedDataInput() {
    const noFixedDataMessage = document.querySelector("#fixedDataContainer h3");
    if (noFixedDataMessage) {
      noFixedDataMessage.remove();
    }
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

    // Create the Delete button with DOM methods
    const deleteButton = document.createElement("button");
    const icon = document.createElement("i");
    icon.classList.add("mdi", "mdi-delete"); // Add Material Design Icon classes
    deleteButton.appendChild(icon);

    const textNode = document.createTextNode(" Delete"); // Add text node for "Delete"
    deleteButton.appendChild(textNode);

    deleteButton.addEventListener("click", () => {
      div.remove();
      saveFixedData();
    });
    div.appendChild(deleteButton);

    return div;
  }

  // Add new data
  addFixedDataButton.addEventListener("click", () => {
    const newInputGroup = createFixedDataInput();
    fixedDataContainer.appendChild(newInputGroup);
    saveFixedData();
    saveFixedDataButton.style.display = "initial"; 
    listenerFixedData();
  });

  saveFixedDataButton.addEventListener("click", () => {
    saveFixedData();
    alert("Fixed data saved!");
    saveFixedDataButton.style.display = "none";
  });

  function createNoFixedDataMessage() {
      const noFixedDataMessage = document.createElement("h3");
      noFixedDataMessage.textContent = "No fixed data registered yet";
      fixedDataContainer.appendChild(noFixedDataMessage);
  }

  // Save fixed data to storage
  function saveFixedData() {
    const fixedData = {};
    const inputGroups = document.querySelectorAll("#fixedDataContainer .input-group");

    if (inputGroups.length === 0) {
      createNoFixedDataMessage();
    }

    inputGroups.forEach(group => {
      const keyInput = group.querySelector("input[type='text']:nth-of-type(1)");
      const valueInput = group.querySelector("input[type='text']:nth-of-type(2)");

      const key = keyInput.value.trim();
      const value = valueInput.value.trim();

      if (key !== "" && value !== "") {
        fixedData[key] = value;
      }
    });

    chrome.storage.local.set({ fixedData: fixedData }, () => {
      console.log("Fixed data saved:", fixedData);
    });
  }

  saveCustomPromptButton.addEventListener("click", () => {
    chrome.storage.local.set({ customTrainingPrompt: customTrainingPrompt.value }, () => {
      alert("Custom prompt saved!");
    });
  });

  // Load fixed data from storage
  function loadFixedData() {
    
    fixedDataContainer.innerHTML = "";
    chrome.storage.local.get("fixedData", (data) => {
      const fixedData = data.fixedData || {};

      for (const key in fixedData) {
        const noFixedDataMessage = document.querySelector("#fixedDataContainer h3");
        if (noFixedDataMessage) {
          noFixedDataMessage.remove();
        }
        if (fixedData.hasOwnProperty(key)) {
          const newInputGroup = createFixedDataInput();
          const keyInput = newInputGroup.querySelector("input[type='text']:nth-of-type(1)");
          const valueInput = newInputGroup.querySelector("input[type='text']:nth-of-type(2)");
          keyInput.value = key;
          valueInput.value = fixedData[key];
          fixedDataContainer.appendChild(newInputGroup);
        }
      }
      if (Object.keys(fixedData).length === 0) {
        createNoFixedDataMessage();
        return;
      } 
      listenerFixedData();
    });
  }

  function loadcustomTrainingPrompt() {
    chrome.storage.local.get("customTrainingPrompt", (data) => {
      const customTrainingPromptValue = data.customTrainingPrompt || `You are an expert prompt engineer. Your task is to enhance, but *not replace*, an existing custom prompt for the Gemini model. Analyze the following conversation context, an "ideal" response provided by a user, and the current custom prompt.

      Conversation Context: [CONTEXT]
      Ideal Response (Quoted Message): [QUOTEDMESSAGE]
      Current Custom Prompt: [CURRENTPROMPT]

      Based on this information, generate a new and improved custom prompt in [CURRENTLANGUAGE] language. Critically, *preserve the existing functionality of the current prompt*. Only add to or subtly refine the current prompt to make it better align with the "ideal" response, given the conversation context. Do not remove or significantly alter existing instructions unless absolutely necessary for improved performance. Prioritize adding new relevant instructions, clarifying existing ones, or making them more specific. Consider if the current prompt is missing any crucial information or constraints that would guide the Gemini model to a better response.

      New and Enhanced Custom Prompt (Preserving Existing Functionality):`;

      customTrainingPrompt.value = customTrainingPromptValue;
    });
  }
});