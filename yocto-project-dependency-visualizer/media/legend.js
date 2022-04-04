// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

/**
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * @param {{license: string;color: string;}[]} legendData
 */
function showLegend(legendData) {
  var legend = document.getElementById("legend");
  console.log(legend);

  legendData.forEach(element => {
    console.log(element);
    var licDiv = document.createElement('div');
    licDiv.style.color = element.color;
    licDiv.style.fontWeight = "bold";
    licDiv.replaceChildren(document.createTextNode(element.license));

    legend?.appendChild(licDiv);
  });
}

(function () {
  window.addEventListener('message', event => {
    const data = event.data; // The JSON data our extension sent
    console.log(data)
    switch (data.command) {
      case 'show-legend-s':
        showLegend(data.legend);
        console.log(data.legend);
        break;
    }
  });
}());