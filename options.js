document.addEventListener("DOMContentLoaded", () => {
  const fixedDataContainer = document.getElementById("fixedDataContainer");
  const addFixedDataButton = document.getElementById("addFixedData");
  const saveFixedDataButton = document.getElementById("saveFixedData");

  // Load existing data on startup
  loadFixedData();

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
});