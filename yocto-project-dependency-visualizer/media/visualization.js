// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

// @ts-ignore
import * as d3 from "https://cdn.skypack.dev/d3@7";

/**
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * @type {any}
 */
var graph_data;

/**
 * @type {string}
 */
var mode;

/**
 * @type {any[]}
 */
var removedNodes = [];

/**
 * @type {{ source: { id: any; }; target: { id: any; }; }[]}
 */
var removedLinks = [];

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

/**
 * @type {{}}
 */
var linkMatrix = {}

const license_colors = ["red", "green", "blue", "yellow", "orange", "purple", "lime", "wheat", "violet", "olive"];

/**
 * @type {{ name: string; count: number}[]}
 */
 var used_licenses = []

function setDimensions() {
  // set the dimensions and margins of the graph
  width = screen.width;
  height = screen.height;
}

function initData() {
  var graphElement = document.getElementById("graph");
  var modeElement = document.getElementById("mode");

  var graphJson;

  if (graphElement !== null) {
    // @ts-ignore
    graphJson = graphElement.value;
    graph_data = JSON.parse(graphJson);
  }
  else {
    graphJson = null;
    graph_data = null;
  }

  mode = "default";
  if (modeElement !== null) {
    // @ts-ignore
    mode = modeElement.value;
  }

  if (mode === "licenses") {
    graph_data.nodes.forEach((/** @type {any} */ d) => {
        var lic = used_licenses.find((lic) => lic.name == d.license);
        if (lic !== undefined) {
          // @ts-ignore
          lic.count = lic.count + 1;
        }
        else {
          used_licenses.push({ name: d.license, count: 1 });
        }
      });

    used_licenses = used_licenses.filter((lic) => lic.name != "" && lic.name != "none");

    used_licenses.sort((a, b) => (a.count < b.count) ? 1 : -1);

   /**
   * @type {{ license: string; color: string;}[]}
   */
    var legend = [];

    var count = Math.min(license_colors.length, used_licenses.length);
    for (var i = 0; i < count; i++) {
      legend.push({license: used_licenses[i].name, color: license_colors[i]});
    }

    vscode.postMessage({
      command: "show-legend-v",
      legend: legend
    });
  }
}

function nodesUpdate() {
  console.log(graph_data.nodes);
  graph_nodes = svg
    .selectAll("rect")
    .data(graph_data.nodes)
    .enter()
    .append("rect")
    .attr('width', 70)
    .attr('height', 30)
    .attr('stroke-width', 3)
    .style("stroke", "cyan")
    .on('click', function (/** @type {any} */ event, /** @type {any} */ node) {
      selectNode(node);
    });

  if (mode === "licenses") {
    setLicensesColors();
  }

  labelsUpdate();

  var maxTextWidth = d3.max(graph_package_names.nodes(), (/** @type {{ getComputedTextLength: () => any; }} */ n) => n.getComputedTextLength());
  if (maxTextWidth === undefined) {
    maxTextWidth = 20;
  }
  graph_nodes.attr('width', maxTextWidth);
}

function labelsUpdate() {
  graph_package_names = svg.selectAll("text")
    .data(graph_data.nodes)
    .enter()
    .append("text");

  graph_package_names.style("fill", "red")
    .attr("width", "70")
    .attr("height", "30")
    .style("font-size", "8px")
    .text(function (/** @type {{ name: any; }} */ d) { return d.name; });
}

function linksUpdate() {
  graph_links = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph_data.links)
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
 * @param {any} node
 * @param {boolean} licenses
 */
 function selectNodeNormalConnections(node, licenses) {
  /**
   * @type {{ name: string; recipe: string; is_removed: number; }[]}
   */
  var usedByNodes = [];

  /**
   * @type {{ name: string; recipe: string; is_removed: number; }[]}
   */
  var requestedNodes = [];

  if (!licenses) {
    setSelectedColors(node.id);
  }

  graph_data.nodes.forEach(function(/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 0});
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1) {
      usedByNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 0});
    }
  });

  removedNodes.forEach(function(/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 1});
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1) {
      usedByNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 1});
    }
  });

  console.log(usedByNodes);
  console.log(requestedNodes);

  console.log(node);
  console.log(node);
  vscode.postMessage({
    command: "select-node-v",
    name: node.name,
    id: node.id,
    recipe: node.recipe,
    used_by: usedByNodes,
    requested: requestedNodes,
    affected: []
  });
}

/**
 * @param {any} node
 */
 function selectNodeAffectedConnections(node) {
  /**
   * @type {{ name: string; recipe: string; is_removed: number; }[]}
   */
  var usedByNodes = [];

  /**
   * @type {{ name: string; recipe: string; is_removed: number; }[]}
   */
  var requestedNodes = [];

  /**
   * @type {{ name: string; recipe: string; is_removed: number; }[]}
   */
  var affected_nodes = [];

  graph_data.nodes.forEach(function(/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 0});
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1) {
      usedByNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 0});
      addAffectedNodes(affected_nodes, d);
    }
  });

  removedNodes.forEach(function(/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 1});
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1) {
      usedByNodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 1});
      addAffectedNodes(affected_nodes, d);
    }
  });

  setAffectedColors(node.id, affected_nodes);

  console.log(usedByNodes);
  console.log(requestedNodes);

  console.log(node);
  console.log(node);
  vscode.postMessage({
    command: "select-node-v",
    name: node.name,
    id: node.id,
    recipe: node.recipe,
    used_by: usedByNodes,
    requested: requestedNodes,
    affected: affected_nodes
  });
}

/**
 * @param {{name: string;recipe: string;is_removed: number;}[]} affected_nodes
 * @param {any} node
 */
function addAffectedNodes(affected_nodes, node) {
  affected_nodes.push({"name": node.name, "recipe": node.recipe, "is_removed": 1});
  graph_data.nodes.forEach(function(/** @type {any} */ d) {
    // @ts-ignore
  if (linkMatrix[d.id + "," + node.id] === 1) {
    //affected_nodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 0});
    if (affected_nodes.find((n) => n.name === d.name) !== undefined) {
      return;
    }
    addAffectedNodes(affected_nodes, d);
    }
  });

  removedNodes.forEach(function(/** @type {any} */ d) {
    // @ts-ignore
  if (linkMatrix[d.id + "," + node.id] === 1) {
    //affected_nodes.push({"name": d.name, "recipe": d.recipe, "is_removed": 1});
    if (affected_nodes.find((n) => n.name === d.name) !== undefined) {
      return;
    }
    addAffectedNodes(affected_nodes, d);
    }
  });
}

/**
 * @param {any} node
 */
function selectNode(node){
  console.log("mode");
  console.log(mode);
  if (mode === "affected_nodes") {
    selectNodeAffectedConnections(node);
  }
  else if (mode === "licenses") {
    selectNodeNormalConnections(node, true);
  }
  else {
    selectNodeNormalConnections(node, false);
  }
}

/**
 * @param {number} id
 */
function setSelectedColors(id) {
  graph_nodes.style("stroke", "cyan");

  graph_nodes.style("stroke", function(/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[id + "," + d.id] === 1) {
      return "red";
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + id] === 1) {
      return "blue";
    }
    else if (d.id === id) {
      return "yellow";
    }

    return "cyan";
  });
}

 /**
 * @param {number} id
 * @param {{name: string;recipe: string;is_removed: number;}[]} affected_nodes
 */
 function setAffectedColors(id, affected_nodes) {
  graph_nodes.style("stroke", "cyan");

  graph_nodes.style("stroke", function(/** @type {any} */ d) {
    // @ts-ignore
    if (affected_nodes.find((node) => node.name == d.name) !== undefined) {
      return "red";
    }
    else if (d.id === id) {
      return "yellow";
    }

    return "cyan";
  });
}

function setLicensesColors() {
  graph_nodes.style("stroke", function(/** @type {any} */ d) {
  
    var count = Math.min(license_colors.length, used_licenses.length);
    for (var i = 0; i < count; i++) {
      if (used_licenses[i].name === d.license) {
        return license_colors[i];
      }
    }

    return "cyan";
  });
}

/**
* @param {number} id
*/
function deleteNode(id) {
  console.log(id);
  svg.selectAll("line").remove();
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();
  var list_id = graph_data.nodes.findIndex((/** @type {{ id: number; }} */ node) => node.id === id);
  //var id = data.nodes[list_id].id;
  console.log(graph_data.nodes[list_id]);

  var removedNode = graph_data.nodes.splice(list_id, 1)[0];
  console.log(removedNode);

  removedNodes.push(removedNode);

  graph_data.links = graph_data.links.filter(function (/** @type {{ source: { id: any; }; target: { id: any; }; }} */ l) {
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

  var list_id = removedNodes.findIndex((node) => node.name === name);
  var returnedNode = removedNodes.splice(list_id, 1)[0];
  graph_data.nodes.push(returnedNode);

  removedLinks = removedLinks.filter(function (/** @type {{ source: { id: any; }; target: { id: any; }; }} */ l) {
    if (l.source.id === returnedNode.id || l.target.id === returnedNode.id) {
      graph_data.links.push(l);
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
    .attr("x1", function (/** @type {{ source: { x: any; }; }} */ d) { return d.source.x; })
    .attr("y1", function (/** @type {{ source: { y: any; }; }} */ d) { return d.source.y; })
    .attr("x2", function (/** @type {{ target: { x: any; }; }} */ d) { return d.target.x; })
    .attr("y2", function (/** @type {{ target: { y: any; }; }} */ d) { return d.target.y; });
  graph_nodes
    .attr("x", function (/** @type {{ x: number; }} */ d) { return d.x - 35; })
    .attr("y", function (/** @type {{ y: number; }} */ d) { return d.y - 15; });
  graph_package_names
    .attr("x", function (/** @type {{ x: number; }} */ d) { return d.x + 3 - 35; })
    .attr("y", function (/** @type {{ y: number; }} */ d) { return d.y + 10 - 15; });
}

function initSvg() {
  svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "svg")
    .style("background-color", "#161623")
    // @ts-ignore
    .call(d3.zoom().scaleExtent([0.01, 10]).on("zoom", function () { svg.attr("transform", d3.zoomTransform(this)) }))
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
}

function initMatrix() {
  graph_data.links.forEach(function(/** @type {any} */ link) {
    // @ts-ignore
    linkMatrix[link.source.id + "," + link.target.id] = 1;
  });
}

function initSimulation() {
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

  // Let's list the force we wanna apply on the network
  simulation = d3.forceSimulation(graph_data.nodes)                 // Force algorithm is applied to data.nodes
    .force("link", d3.forceLink()
      .distance(distance)
      .iterations(iterations)                              // This force provides links between nodes
      .id(function (/** @type {{ id: any; }} */ d) { return d.id; })                     // This provide  the id of a node
      .links(graph_data.links)                                    // and this the list of links
    )
    .force("charge", d3.forceManyBody().strength(strength))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
    //.force("linkf", d3.forceLink(data.links).distance(400))    
    .on("end", simulationTicked);
}

function exportSVG() {  
  var svg = document.getElementById("svg");
  var curr_width = svg?.getAttribute("width")
  var curr_height = svg?.getAttribute("height")
  console.log(curr_width);
  console.log(curr_height);
  // @ts-ignore
  var g = svg.querySelector('g') // select the parent g
  // @ts-ignore
  var curr_transform = g?.getAttribute("transform")
  // @ts-ignore
  g.setAttribute("transform", "translate(" + g.getBBox().width / 2 + "," + g.getBBox().height / 2 + ")"); // clean transform
  // @ts-ignore
  svg.setAttribute('width', g.getBBox().width) // set svg to be the g dimensions
  // @ts-ignore
  svg.setAttribute('height', g.getBBox().height)
  var serializer = new XMLSerializer();
  // @ts-ignore
  var source = serializer.serializeToString(svg);
  vscode.postMessage({
    command: "export-svg-v",
    svg: source
  });

  console.log(curr_width);
  console.log(curr_height);
  console.log(curr_transform);


  // @ts-ignore
  g.setAttribute("transform", curr_transform); // clean transform
  // @ts-ignore
  svg.setAttribute('width', curr_width) // set svg to be the g dimensions
  // @ts-ignore
  svg.setAttribute('height', curr_height)
}

(function () {
  setDimensions();
  initData();

  if (graph_data !== null) {
    // append the svg object to the body of the page
    initSvg();
    arrowInit();
    // Initialize the links
    linksUpdate();
    // Initialize the nodes
    nodesUpdate();

    initSimulation();

    initMatrix();
  }

  window.addEventListener('message', event => {

    const data = event.data; // The JSON data our extension sent

    switch (data.command) {
      case "return-node-v":
        returnNode(data.name);
        break;
      case "remove-node-v":
        deleteNode(data.id)
        break;
      case "select-node-from-list-v":
        var selected_node = graph_data.nodes.find((/** @type {{ name: string; }} */ node) => node.name === data.name);
        selectNode(selected_node);
        break;
      case "call-export-svg-v":
        exportSVG();
        break;
    }
  });
}());