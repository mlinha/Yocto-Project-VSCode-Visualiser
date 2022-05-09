/**
 * Instance of the WebView API.
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * Get input values and send message to the Sidebar class instance to generate the visualization.
 */
function generate() {
  var select = document.getElementById("task_type");
  var task_type = "";
  if (select !== null) {
    // @ts-ignore
    task_type = select.value;
  }

  var input_mode = document.getElementById("mode_type");
  var mode = "";
  if (input_mode !== null) {
    // @ts-ignore
    mode = input_mode.value;
  }

  var input_distance = document.getElementById("distance");
  var distance = "";
  if (input_distance !== null) {
    // @ts-ignore
    distance = input_distance.value;
  }

  var input_iterations = document.getElementById("iterations");
  var iterations = "";
  if (input_iterations !== null) {
    // @ts-ignore
    iterations = input_iterations.value;
  }

  var input_strength = document.getElementById("strength");
  var strength = "";
  if (input_strength !== null) {
    // @ts-ignore
    strength = input_strength.value;
  }

  vscode.postMessage({
    command: "visualize-s",
    type: task_type,
    mode: mode,
    distance: distance,
    iterations: iterations,
    strength: strength
  });
}

/**
 * Get input value and send message to the Sidebar class instance to find a node.
 */
function findNodes() {
  var input_search = document.getElementById("search-box");
  var search = "";
  if (input_search !== null) {
    // @ts-ignore
    search = input_search.value;
  }

  vscode.postMessage({
    command: "find-nodes-s",
    search: search
  });
}

/**
 * Send message to the Sidebar class instance to export to the SVG file.
 */
function callExportSVG() {
  vscode.postMessage({
    command: "call-export-svg-s"
  });
}

/**
 * Set name, recipe and license of the selected node to information elements.
 * @param {string} name Name of the selected node.
 * @param {string} recipe Path to the recipe of the selected node.
 * @param {string} licence Used license of the selected node.
 */
function selectNode(name, recipe, licence) {
  var selectedElement = document.getElementById("selected-name");
  selectedElement?.replaceChildren(document.createTextNode(name));

  selectedElement = document.getElementById("selected-recipe");
  selectedElement?.replaceChildren(document.createTextNode(recipe));

  selectedElement = document.getElementById("selected-licence");
  selectedElement?.replaceChildren(document.createTextNode(licence));
}

/**
 * Clear information elements of selected node.
 */
function clearSelectedNode() {
  var selectedElement = document.getElementById("selected-name");
  selectedElement?.replaceChildren(document.createTextNode("-none-"));

  selectedElement = document.getElementById("selected-recipe");
  selectedElement?.replaceChildren(document.createTextNode("-none-"));

  selectedElement = document.getElementById("selected-licence");
  selectedElement?.replaceChildren(document.createTextNode("-none-"));
}

/**
 * Send message to the Sidebar class instance that selected node needs to be removed from
 * the visualization.
 */
function removeSelected() {
  vscode.postMessage({
    command: "remove-selected-s",
  });
}

/**
 * Send message to the Sidebar class instance that selected node's recipe needs to be opened.
 */
function openSelectedRecipe() {
  vscode.postMessage({
    command: "open-selected-recipe-s",
  });
}

(
  /**
  * Main function of the script. Accept messages. Initialize button on click events.
  */
  function () {
    var button = document.getElementById("generate");
    if (button !== null) {
      button.onclick = generate;
    }

    button = document.getElementById("export");
    if (button !== null) {
      button.onclick = callExportSVG;
    }

    button = document.getElementById("remove-selected");
    if (button !== null) {
      button.onclick = removeSelected;
    }

    button = document.getElementById("open-recipe");
    if (button !== null) {
      button.onclick = openSelectedRecipe;
    }

    button = document.getElementById("find-nodes");
    if (button !== null) {
      button.onclick = findNodes;
    }

    window.addEventListener('message', event => {
      const data = event.data;
      switch (data.command) {
        case 'select-node-s':
          selectNode(data.name, data.recipe, data.licence);
          break;
        case 'clear-selected-node-s':
          clearSelectedNode();
          break;
      }
    });
  }()
);