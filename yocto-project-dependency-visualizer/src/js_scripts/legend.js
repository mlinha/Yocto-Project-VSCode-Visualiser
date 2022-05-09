/**
 * Instance of the WebView API.
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * Loads each legend element and adds it to the "legend" div.
 * @param {{license: string; color: string;}[]} legendData List of legend elements with name of the license
 * and a color which should be used for the legend. 
 */
function showLegend(legendData) {
  var legend = document.getElementById("legend");
  legend?.replaceChildren();

  legendData.forEach(element => {
    var licDiv = document.createElement('div');
    licDiv.style.color = element.color;
    licDiv.style.fontWeight = "bold";
    licDiv.replaceChildren(document.createTextNode(element.license));

    legend?.appendChild(licDiv);
  });
}

(
  /**
  * Main function of the script. Accept messages.
  */
  function () {
    window.addEventListener('message', event => {
      const data = event.data;
      switch (data.command) {
        case 'show-legend-s':
          showLegend(data.legend);
          break;
      }
    });
  }()
);