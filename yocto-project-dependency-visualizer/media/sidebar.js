// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

/**
 * @type {any}
 */
const vscode = acquireVsCodeApi();

function generate() {
  vscode.postMessage({
    command: "visualize",
  });
  console.log("bsdfsd")
}

(function () {
  var button = document.getElementById("generate");
  if (button !== null) {
    button.onclick = generate;
  }
}());