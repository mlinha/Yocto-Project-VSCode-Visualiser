// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

/**
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

function generate() {
  vscode.postMessage({
    command: "visualize-s",
  });
}

/**
 * @param {string} name
 */
function selectNode(name) {
  var selectedNameElement = document.getElementById("selected-name");
  selectedNameElement?.replaceChildren(document.createTextNode(name));
}

function clearSelectedNode() {
  var selectedNameElement = document.getElementById("selected-name");
  selectedNameElement?.replaceChildren(document.createTextNode("-none-"));
}

function removeSelected() {
  vscode.postMessage({
    command: "remove-selected-s",
  });
}

function openSelectedRecipe() {
  vscode.postMessage({
    command: "open-selected-recipe-s",
  });
}

(function () {
  var button = document.getElementById("generate");
  if (button !== null) {
    button.onclick = generate;
  }

  button = document.getElementById("remove-selected");
  if (button !== null) {
    button.onclick = removeSelected;
  }
  
  button = document.getElementById("open-recipe");
  if (button !== null) {
    button.onclick = openSelectedRecipe;
  }

  window.addEventListener('message', event => {

    const data = event.data; // The JSON data our extension sent
    console.log(data)
    switch (data.command) {
      case 'select-node-s':
        console.log(data.name);
        selectNode(data.name);
        break;
      case 'clear-selected-node-s':
        console.log(data.name);
        clearSelectedNode();
        break;
    }
  });
}());