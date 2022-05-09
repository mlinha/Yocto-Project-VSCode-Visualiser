// @ts-ignore
import * as d3 from "https://cdn.skypack.dev/d3@7";

/**
 * Instance of the WebView API.
 * @type {any}
 */
// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * JSON string with visualizaton data.
 * @type {any}
 */
var graph_data;

/**
 * Mode of analysis.
 * @type {string}
 */
var mode;

/**
 * List of nodes removed from the visualization.
 * @type {any[]}
 */
var removedNodes = [];

/**
 * List of links removed from the visualization.
 * @type {{ source: { id: any; }; target: { id: any; }; }[]}
 */
var removedLinks = [];

/**
 * Width of the panel.
 * @type {number}
 */
var width;

/**
 * Height of the panel.
 * @type {number}
 */
var height;

/**
 * SVG element with the visualization.
 * @type {d3.Selection<SVGGElement, any, HTMLElement, any>}
 */
var svg;

/**
 * List of rectangles representing nodes in the graph.
* @type {d3.Selection<SVGRectElement, any, SVGGElement, any>}
*/
var graph_nodes;

/**
 * List of text elements with node names.
 * @type {d3.Selection<SVGTextElement, any, SVGGElement, any>}
 */
var graph_package_names;

/**
 * List of lines representing links in the graph.
 * @type {d3.Selection<SVGLineElement, any, SVGGElement, any>}
 */
var graph_links;

/**
 * Instance of the simulation.
 * @type {any}
 */
var simulation;

/**
 * Dictionary storing which node is connected to which node.
 * @type {{}}
 */
var linkMatrix = {};

/**
 * Colors for 10 most used licenses.
 */
const LICENSE_COLORS = ["red", "green", "blue", "yellow", "orange", "purple", "lime", "wheat", "violet", "olive"];

/**
 * Base color of nodes.
 * @type {string}
 */
const BASE_NODE_COLOR = "cyan";

/**
 * Base color of links.
 * @type {string}
 */
const BASE_LINK_COLOR = "white";

/**
* Base color of affected nodes.
* @type {string}
*/
const BASE_AFFECTED_NODE_COLOR = "red";

/**
* Base color of selected nodes.
* @type {string}
*/
const BASE_SELECTED_NODE_COLOR = "yellow";

/**
* Base color of requested nodes.
* @type {string}
*/
const BASE_REQUESTED_NODE_COLOR = "red";

/**
* Base color of requested nodes.
* @type {string}
*/
const BASE_FOUND_NODE_COLOR = "lime";

/**
* Base color of used-by nodes.
* @type {string}
*/
const BASE_USED_BY_COLOR = "blue";

/**
* Base node name color.
* @type {string}
*/
const BASE_NODE_NAME_COLOR = "red";

/**
 * List of all used licenses.
 * @type {{ name: string; count: number}[]}
 */
var used_licenses = [];

/**
 * Height of the node.
 * @type {number}
 */
const node_height = 30;

/**
 * Width of the node.
 * @type {number}
 */
var node_width;

/**
 * Set dimensions of the graph.
 */
function setDimensions() {
  width = screen.width;
  height = screen.height;
}

/**
 * Load data from HTML elements. If license analysis mode is used get all used licenses and send legend to WebView.
 */
function initData() {
  var graphElement = document.getElementById("graph");
  var modeElement = document.getElementById("mode");

  var graphJson;

  // load JSON with graph data
  if (graphElement !== null) {
    // @ts-ignore
    graphJson = graphElement.value;
    graph_data = JSON.parse(graphJson);
  }
  else {
    graphJson = null;
    graph_data = null;
  }

  // load selected mode
  mode = "default";
  if (modeElement !== null) {
    // @ts-ignore
    mode = modeElement.value;
  }

  // load used licenses
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

    var count = Math.min(LICENSE_COLORS.length, used_licenses.length);
    for (var i = 0; i < count; i++) {
      legend.push({ license: used_licenses[i].name, color: LICENSE_COLORS[i] });
    }

    vscode.postMessage({
      command: "show-legend-v",
      legend: legend
    });
  }
}

/**
 * Update nodes in the visualization.
 */
function nodesUpdate() {
  graph_nodes = svg
    .selectAll("rect")
    .data(graph_data.nodes)
    .enter()
    .append("rect")
    .attr('width', 70)
    .attr('height', 30)
    .attr('stroke-width', 3)
    .style("stroke", BASE_NODE_COLOR)
    .on('click', function (/** @type {any} */ event, /** @type {any} */ node) {
      selectNode(node);
    });

  if (mode === "licenses") {
    setLicensesColors();
  }

  labelsUpdate();

  // get length of the visualized text and use it as the with of the node rectangle
  var maxTextWidth = d3.max(graph_package_names.nodes(), (/** @type {{ getComputedTextLength: () => any; }} */ n) => n.getComputedTextLength());
  if (maxTextWidth === undefined) {
    maxTextWidth = 20;
  }

  maxTextWidth = maxTextWidth + 10;
  graph_nodes.attr('width', maxTextWidth);

  node_width = maxTextWidth;
}

/**
 * Update node names in the visualization.
 */
function labelsUpdate() {
  graph_package_names = svg.selectAll("text")
    .data(graph_data.nodes)
    .enter()
    .append("text");

  graph_package_names.style("fill", BASE_NODE_NAME_COLOR)
    .attr("width", "70")
    .attr("height", "30")
    .style("font-size", "8px")
    .text(function (/** @type {{ name: any; }} */ d) { return d.name; });
}

/**
 * Update links in the visualization.
 */
function linksUpdate() {
  graph_links = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph_data.links)
    .enter().append("line")
    .attr("stroke", BASE_LINK_COLOR)
    .attr("marker-end", "url(#arrow)");
}

/**
 * Create arrows for lines.
 */
function arrowInit() {
  svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 50)
    .attr("refY", 0)
    .attr("markerWidth", 13)
    .attr("markerHeight", 13)
    .attr("fill", BASE_LINK_COLOR)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");
}

/**
 * Select node in the visualization if default or licenses analysis is used.
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
  else {
    setLicensesColors();
  }

  // get requested nodes and nodes that request the selected node from the nodes in the visualization
  graph_data.nodes.forEach(function (/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 0 });
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1) {
      usedByNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 0 });
    }
  });

  // get requested nodes and nodes that request the selected node from the removed nodes
  removedNodes.forEach(function (/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 1 });
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1) {
      usedByNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 1 });
    }
  });

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

  // get requested nodes and nodes that request the selected node from the nodes in the visualization
  // get all nodes that directly or indirectly depend on the selected node
  graph_data.nodes.forEach(function (/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 0 });
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1 && d.id !== node.id) {
      usedByNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 0 });
      addAffectedNodes(affected_nodes, d, node);
    }
  });

  // get requested nodes and nodes that request the selected node from the removed nodes
  // get all nodes that directly or indirectly depend on the selected node
  removedNodes.forEach(function (/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[node.id + "," + d.id] === 1) {
      requestedNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 1 });
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + node.id] === 1 && d.id !== node.id) {
      usedByNodes.push({ "name": d.name, "recipe": d.recipe, "is_removed": 1 });
      addAffectedNodes(affected_nodes, d, node);
    }
  });

  setAffectedColors(node.id, affected_nodes);

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
 * Store all nodes that depend on the specified node (called recursively).
 * @param {{name: string;recipe: string;is_removed: number;}[]} affected_nodes List of nodes
 * that directly or indirectly depend on the starting node.
 * @param {any} node Current node.
 * @param {any} starting_node Starting node.
 */
function addAffectedNodes(affected_nodes, node, starting_node) {
  if (affected_nodes.find((n) => n.name === node.name)) {
    return;
  }
  affected_nodes.push({ "name": node.name, "recipe": node.recipe, "is_removed": 1 });

  // get affected nodes from the JSON with graph data
  graph_data.nodes.forEach(function (/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[d.id + "," + node.id] === 1 && d.id !== starting_node.id) {
      if (affected_nodes.find((n) => n.name === d.name)) {
        return;
      }

      addAffectedNodes(affected_nodes, d, starting_node);
    }
  });

  // get affected nodes from the list of removed nodes
  removedNodes.forEach(function (/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[d.id + "," + node.id] === 1) {
      if (affected_nodes.find((n) => n.name === d.name) && d.id !== starting_node.id) {
        return;
      }
      addAffectedNodes(affected_nodes, d, starting_node);
    }
  });
}

/**
 * Select node from the graph.
 * @param {any} node Selected node.
 */
function selectNode(node) {
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
 * Set colors of all nodes.
 * If the node is requested by the node with a given ID set the color to BASE_REQUESTED_NODE_COLOR.
 * If the node is depends on the node with a given ID set the color to BASE_USED_BY_COLOR.
 * If the node equals the node with a given ID set color to BASE_SELECTED_NODE_COLOR.
 * @param {number} id ID of the selected node.
 */
function setSelectedColors(id) {
  graph_nodes.style("stroke", BASE_NODE_COLOR);

  graph_nodes.style("stroke", function (/** @type {any} */ d) {
    // @ts-ignore
    if (linkMatrix[id + "," + d.id] === 1) {
      return BASE_REQUESTED_NODE_COLOR;
    }
    // @ts-ignore
    else if (linkMatrix[d.id + "," + id] === 1) {
      return BASE_USED_BY_COLOR;
    }
    else if (d.id === id) {
      return BASE_SELECTED_NODE_COLOR;
    }

    return BASE_NODE_COLOR;
  });
}

/**
 * Set BASE_AFFECTED_NODE_COLOR color to nodes directly or indirectly dependent on the selected node.
 * Set color to BASE_SELECTED_NODE_COLOR if node equals the selected node with given ID.
 * @param {number} id ID of the selected node.
 * @param {{name: string;recipe: string;is_removed: number;}[]} affected_nodes List of nodes
 * that directly or indirectly depend on the starting node.
 */
function setAffectedColors(id, affected_nodes) {
  graph_nodes.style("stroke", BASE_NODE_COLOR);

  graph_nodes.style("stroke", function (/** @type {any} */ d) {
    // @ts-ignore
    if (affected_nodes.find((node) => node.name == d.name)) {
      return BASE_AFFECTED_NODE_COLOR;
    }
    else if (d.id === id) {
      return BASE_SELECTED_NODE_COLOR;
    }

    return BASE_NODE_COLOR;
  });
}

/**
 * Set colors to nodes based on 10 most used licenses.
 */
function setLicensesColors() {
  graph_nodes.style("stroke", function (/** @type {any} */ d) {

    var count = Math.min(LICENSE_COLORS.length, used_licenses.length);
    for (var i = 0; i < count; i++) {
      if (used_licenses[i].name === d.license) {
        return LICENSE_COLORS[i];
      }
    }

    return BASE_NODE_COLOR;
  });
}

/**
 * Find nodes in visualization.
 * @param {string} search Name or pattern of the node that should be found.
 */
function findNodes(search) {
  graph_nodes.style("stroke", function (/** @type {any} */ d) {
    if (d.name.match(search)) {
      return BASE_FOUND_NODE_COLOR;
    }

    return BASE_NODE_COLOR;
  });
}

/**
 * Remove node from visualization.
 * @param {number} id ID of the node that will be removed.
 */
function removeNode(id) {
  svg.selectAll("line").remove();
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();
  var list_id = graph_data.nodes.findIndex((/** @type {{ id: number; }} */ node) => node.id === id);

  // remove node from the JSON with graph data and store it in the list of removed nodes
  var removedNode = graph_data.nodes.splice(list_id, 1)[0];
  removedNodes.push(removedNode);

  // remove affected links from the JSON with graph data and store them in the list of removed links
  graph_data.links = graph_data.links.filter(function (/** @type {{ source: { id: any; }; target: { id: any; }; }} */ l) {
    if (l.source.id === id || l.target.id === id) {
      removedLinks.push(l);
    }
    return l.source.id !== id && l.target.id !== id;
  });

  linksUpdate();
  nodesUpdate();

  simulation.restart();
}

/**
 * Return node to visualization.
 * @param {string} name Name of the node that should be returned.
 */
function returnNode(name) {
  svg.selectAll("line").remove();
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();

  // remove node from list of removed nodes and return it to the JSON with graph data
  var list_id = removedNodes.findIndex((node) => node.name === name);
  var returnedNode = removedNodes.splice(list_id, 1)[0];
  graph_data.nodes.push(returnedNode);

  // remove affected links from list of removed links and return them to the JSON with graph data
  removedLinks = removedLinks.filter(function (/** @type {{ source: { id: any; }; target: { id: any; }; }} */ l) {
    if (
      (l.source.id === returnedNode.id && !removedNodes.find((node) => node.id == l.target.id))
      ||
      (l.target.id === returnedNode.id && !removedNodes.find((node) => node.id == l.source.id))
    ) {
      graph_data.links.push(l);
    }
    return l.source.id !== returnedNode.id && l.target.id !== returnedNode.id;
  });

  linksUpdate();
  nodesUpdate();

  simulation.restart();
}

/**
 * Update positions of nodes, node names and links.
 */
function simulationTicked() {
  graph_links
    .attr("x1", function (/** @type {{ source: { x: number; }; }} */ d) { return d.source.x; })
    .attr("y1", function (/** @type {{ source: { y: number; }; }} */ d) { return d.source.y; })
    .attr("x2", function (/** @type {{ target: { x: number; }; }} */ d) { return d.target.x; })
    .attr("y2", function (/** @type {{ target: { y: number; }; }} */ d) { return d.target.y; });
  graph_nodes
    .attr("x", function (/** @type {{ x: number; }} */ d) { return d.x - node_width / 2; })
    .attr("y", function (/** @type {{ y: number; }} */ d) { return d.y - node_height / 2; });
  graph_package_names
    .attr("x", function (/** @type {{ x: number; }} */ d) { return d.x + 3 - node_width / 2; })
    .attr("y", function (/** @type {{ y: number; }} */ d) { return d.y + 10 - node_height / 2; });
}

/**
 * Initialize the SVG element that will contain the visualization.
 */
function initSVG() {
  svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "svg")
    .style("background-color", "#161623")
    // @ts-ignore
    .call(d3.zoom().scaleExtent([0.01, 10]).on("zoom", function () { svg.attr("transform", d3.zoomTransform(this)) }))
    .append("g");
  //.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
}

/**
 * Init dictionary storing which node is connected to which node.
 */
function initMatrix() {
  graph_data.links.forEach(function (/** @type {any} */ link) {
    // @ts-ignore
    linkMatrix[link.source.id + "," + link.target.id] = 1;
  });
}

/**
 * Init the simulation with parameters from the HTML elements.
 */
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

  simulation = d3.forceSimulation(graph_data.nodes)
    .force("link", d3.forceLink()
      .distance(distance) // distance of links
      .iterations(iterations) // number of iterations of the link force
      .id(function (/** @type {{ id: any; }} */ d) { return d.id; })
      .links(graph_data.links)
    )
    .force("charge", d3.forceManyBody().strength(strength)) // add force between nodes
    .force("center", d3.forceCenter(width / 2, height / 2)) // make nodes centered
    .on("end", simulationTicked);
}

/**
 * Export the SVG element with visualization.
 */
function exportSVG() {
  var svg = document.getElementById("svg");

  // store current width and height
  var curr_width = svg?.getAttribute("width")
  var curr_height = svg?.getAttribute("height")
  // @ts-ignore
  var g = svg.querySelector('g')

  // store current transform
  // @ts-ignore
  var curr_transform = g?.getAttribute("transform")

  // center transform
  // @ts-ignore
  g.setAttribute("transform", "translate(" + g.getBBox().width / 2 + "," + g.getBBox().height / 2 + ")");

  // set width and height od the SVG to the width and height of the entire graph
  // @ts-ignore
  svg.setAttribute('width', g.getBBox().width)
  // @ts-ignore
  svg.setAttribute('height', g.getBBox().height)

  // serialize the SVG
  var serializer = new XMLSerializer();
  // @ts-ignore
  var source = serializer.serializeToString(svg);

  vscode.postMessage({
    command: "export-svg-v",
    svg: source
  });

  // return to original values
  // @ts-ignore
  g.setAttribute("transform", curr_transform); // clean transform
  // @ts-ignore
  svg.setAttribute('width', curr_width) // set svg to be the g dimensions
  // @ts-ignore
  svg.setAttribute('height', curr_height)
}

(
  /**
   * Main function of the script. Accept messages. Initialize visualization.
   */
  function () {
    setDimensions();
    initData();

    if (graph_data !== null) {
      // append the svg object to the body of the page
      initSVG();
      arrowInit();
      // Initialize the links
      linksUpdate();
      // Initialize the nodes
      nodesUpdate();

      initSimulation();

      initMatrix();
    }

    window.addEventListener('message', event => {
      const data = event.data;

      switch (data.command) {
        case "return-node-v":
          returnNode(data.name);
          break;
        case "remove-node-v":
          removeNode(data.id)
          break;
        case "select-node-from-list-v":
          var selected_node = graph_data.nodes.find((/** @type {{ name: string; }} */ node) => node.name === data.name);
          selectNode(selected_node);
          break;
        case "call-export-svg-v":
          exportSVG();
          break;
        case "find-nodes-v":
          findNodes(data.search);
          break;
      }
    });
  }()
);