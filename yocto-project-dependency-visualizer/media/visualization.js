// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

/**
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * @type {any}
 */
var data;

/**
 * @type {any[]}
 */
var removedNodes = [];

/**
 * @type {{ source: { id: any; }; target: { id: any; }; }[]}
 */
var removedLinks = [];

/**
 * @type {{ left: number; right: number; top: number; bottom: number; }}
 */
var margin;

/**
 * @type {number}
 */
var width;

/**
 * @type {number}
 */
var height;

/**
* @type {d3.Selection<SVGGElement, any, HTMLElement, any>}
*/
var svg;

/**
* @type {d3.Selection<SVGRectElement, any, SVGGElement, any>}
*/
var graph_nodes;
/**
* @type {d3.Selection<SVGTextElement, any, SVGGElement, any>}
*/
var graph_package_names;

/**
* @type {d3.Selection<SVGLineElement, any, SVGGElement, any>}
*/
var graph_links;

/**
* @type {{ restart: () => void; }}
*/
var simulation;

function setDimensions() {
  // set the dimensions and margins of the graph
  margin = { top: 10, right: 30, bottom: 30, left: 40 };
  width = screen.width - margin.left - margin.right;
  height = screen.height - margin.top - margin.bottom;
}

function initData() {
  var graphElement = document.getElementById("graph");

  var graphJson;

  if (graphElement !== null) {
    // @ts-ignore
    graphJson = graphElement.value;
    data = JSON.parse(graphJson);
  }
  else {
    graphJson = null;
    data = null;
  }
}

function nodesUpdate() {
  graph_nodes = svg
    .selectAll("rect")
    .data(data.nodes)
    .enter()
    .append("rect")
    .attr('width', 70)
    .attr('height', 30)
    .style("stroke", "cyan")
    .on('click', function (d, i) {
      //deleteNode(i);
      selectNode(i);
    });

  labelsUpdate();

  var maxTextWidth = d3.max(graph_package_names.nodes(), n => n.getComputedTextLength());
  if (maxTextWidth === undefined) {
    maxTextWidth = 20;
  }
  graph_nodes.attr('width', maxTextWidth);
}

function labelsUpdate() {
  graph_package_names = svg.selectAll("text")
    .data(data.nodes)
    .enter()
    .append("text")
    .on('click', function (d, i) {
      vscode.postMessage({
        command: "open-recipe-file",
        filename: d.recipe
      });
    });

  graph_package_names.style("fill", "red")
    .attr("width", "70")
    .attr("height", "30")
    .style("font-size", "8px")
    .text(function (d) { return d.name; });
}

function linksUpdate() {
  graph_links = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
    .attr("stroke", "white")
    .attr("marker-end", "url(#arrow)");
}

function arrowInit() {
  svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 50)
    .attr("refY", 0)
    .attr("markerWidth", 13)
    .attr("markerHeight", 13)
    .attr("fill", "white")
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");
}

/**
* @param {number} i
*/
function selectNode(i) {
  //var selectedNameElement = document.getElementById("selected-name");
  //console.log(selectedNameElement);
  //selectedNameElement?.replaceChildren(document.createTextNode(data.nodes[i].name));
  //selectedNameElement?.appendChild(document.createTextNode(data.nodes[i].name));
  vscode.postMessage({
    command: "select-node-v",
    name: data.nodes[i].name,
    list_id: i,
    recipe: data.nodes[i].recipe
  });
}

/**
* @param {number} i
*/
function deleteNode(i) {
  svg.selectAll("line").remove();
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();
  var id = data.nodes[i].id;

  var removedNode = data.nodes.splice(i, 1)[0];
  console.log(removedNode);
  vscode.postMessage({
    command: "remove-node",
    name: removedNode.name
  });

  removedNodes.push(removedNode);

  data.links = data.links.filter(function (/** @type {{ source: { id: any; }; target: { id: any; }; }} */ l) {
    if (l.source.id === id || l.target.id === id) {
      removedLinks.push(l);
    }
    return l.source.id !== id && l.target.id !== id;
  });

  console.log(removedNodes);
  console.log(removedLinks);

  linksUpdate();
  nodesUpdate();

  simulation.restart();
}

/**
 * @param {string} name
 */
function returnNode(name) {
  svg.selectAll("line").remove();
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();

  var index = removedNodes.findIndex((node) => node.name === name);
  var returnedNode = removedNodes.splice(index, 1)[0];
  data.nodes.push(returnedNode);

  removedLinks = removedLinks.filter(function (/** @type {{ source: { id: any; }; target: { id: any; }; }} */ l) {
    if (l.source.id === returnedNode.id || l.target.id === returnedNode.id) {
      data.links.push(l);
    }
    return l.source.id !== returnedNode.id && l.target.id !== returnedNode.id;
  });

  linksUpdate();
  nodesUpdate();

  simulation.restart();
}

// This function is run at each iteration of the force algorithm, updating the nodes position.
function simulationTicked() {
  graph_links
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; });
  graph_nodes
    .attr("x", function (d) { return d.x - 35; })
    .attr("y", function (d) { return d.y - 15; });
  graph_package_names
    .attr("x", function (d) { return d.x + 3 - 35; })
    .attr("y", function (d) { return d.y + 10 - 15; });
}

function initSvg() {
  svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    // @ts-ignore
    .call(d3.zoom().scaleExtent([0.01, 10]).on("zoom", function () { svg.attr("transform", d3.event.transform) }))
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

function initSimulation() {
  // Let's list the force we wanna apply on the network
  simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
    .force("link", d3.forceLink()
      .distance(400)
      .iterations(1)                              // This force provides links between nodes
      // @ts-ignore
      .id(function (d) { return d.id; })                     // This provide  the id of a node
      .links(data.links)                                    // and this the list of links
    )
    .force("charge", d3.forceManyBody().strength(-3500))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
    //.force("linkf", d3.forceLink(data.links).distance(400))    
    .on("end", simulationTicked);
}

(function () {
  setDimensions();
  initData();

  if (data !== null) {
    // append the svg object to the body of the page
    initSvg();
    arrowInit();
    // Initialize the links
    linksUpdate();
    // Initialize the nodes
    nodesUpdate();
    initSimulation();
  }

  window.addEventListener('message', event => {

    const data = event.data; // The JSON data our extension sent

    switch (data.command) {
      case "return-node":
        returnNode(data.name);
        break;
      case "remove-node":
        deleteNode(data.list_id)
    }
  });
}());