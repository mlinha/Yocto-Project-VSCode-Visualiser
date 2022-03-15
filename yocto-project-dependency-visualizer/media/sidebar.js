// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

/**
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

function generate() {
  var select = document.getElementById("task_type");
  var task_type = "do_prepare_recipe_sysroot";
  if (select !== null) {
    // @ts-ignore
    task_type = select.value;
  }

  var input_distance = document.getElementById("distance");
  var distance = "";
  if (input_distance !== null) {
    // @ts-ignore
    distance = input_distance.value;
  }

  var input_iterations = document.getElementById("iterations");
  var iterations = "do_prepare_recipe_sysroot";
  if (input_iterations !== null) {
    // @ts-ignore
    iterations = input_iterations.value;
  }

  var input_strength = document.getElementById("strength");
  var strength = "do_prepare_recipe_sysroot";
  if (input_strength !== null) {
    // @ts-ignore
    strength = input_strength.value;
  }

  vscode.postMessage({
    command: "visualize-s",
    type: task_type,
    distance: distance,
    iterations: iterations,
    strength: strength
  });
}

/**
 * @param {string} name
 * @param {string} recipe
 */
function selectNode(name, recipe) {
  var selectedElement = document.getElementById("selected-name");
  selectedElement?.replaceChildren(document.createTextNode(name));

  selectedElement = document.getElementById("selected-recipe");
  selectedElement?.replaceChildren(document.createTextNode(recipe));
}

function clearSelectedNode() {
  var selectedElement = document.getElementById("selected-name");
  selectedElement?.replaceChildren(document.createTextNode("-none-"));

  selectedElement = document.getElementById("selected-recipe");
  selectedElement?.replaceChildren(document.createTextNode("-none-"));
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
        selectNode(data.name, data.recipe);
        break;
      case 'clear-selected-node-s':
        clearSelectedNode();
        break;
    }
  });
}());