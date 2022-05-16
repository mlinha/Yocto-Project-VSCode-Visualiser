/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectNode = exports.setLegendData = exports.findNodes = exports.exportSVG = exports.returnToVisualization = exports.addNodeToRemoved = exports.createVizualization = exports.activate = void 0;
const vscode = __webpack_require__(1);
const Sidebar_1 = __webpack_require__(2);
const fs_1 = __webpack_require__(5);
const DotParser_1 = __webpack_require__(7);
const VisualizationPanel_1 = __webpack_require__(11);
const RemovedTreeDataProvider_1 = __webpack_require__(12);
const constants_1 = __webpack_require__(3);
const helpers_1 = __webpack_require__(4);
const ConnectionsTreeDataProvider_1 = __webpack_require__(14);
const Legend_1 = __webpack_require__(15);
/**
 * Tree data provider for removed nodes TreeView
 */
var removedTreeDataProvider;
/**
 * Tree data provider for nodes that depend on the selected node TreeView
 */
var usedByTreeDataProvider;
/**
 * Tree data provider for nodes that the selected node depends on TreeView
 */
var requestedTreeDataProvider;
/**
 * Tree data provider for affected nodes TreeView
 */
var affectedTreeDataProvider;
/**
 * Sidebar menu
 */
var sidebar;
/**
 * Legend in the sidebar
 */
var legend;
/**
 * Main visualization panel
 */
var visualizationPanel;
/**
 * Activate the extension. Register commands and views.
 * @param context Extension context.
 */
function activate(context) {
    sidebar = new Sidebar_1.Sidebar(context.extensionUri);
    legend = new Legend_1.Legend(context.extensionUri);
    visualizationPanel = new VisualizationPanel_1.VisualizationPanel(context.extensionUri);
    removedTreeDataProvider = new RemovedTreeDataProvider_1.RemovedTreeDataProvider();
    usedByTreeDataProvider = new ConnectionsTreeDataProvider_1.ConnectionsTreeDataProvider();
    requestedTreeDataProvider = new ConnectionsTreeDataProvider_1.ConnectionsTreeDataProvider();
    affectedTreeDataProvider = new ConnectionsTreeDataProvider_1.ConnectionsTreeDataProvider();
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
        createVizualization(context.extensionUri, constants_1.DEFAULT_TYPE, constants_1.DEFAULT_DISTANCE, constants_1.DEFAULT_ITERATIONS, constants_1.DEFAULT_STRENGTH, constants_1.DEFAULT_MODE);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.returnNode', (item) => {
        var _a;
        if (((_a = item.label) === null || _a === void 0 ? void 0 : _a.toString()) !== undefined) {
            returnToVisualization(item.label.toString());
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.openRecipe', (item) => {
        var _a;
        if (((_a = item.getRecipe()) === null || _a === void 0 ? void 0 : _a.toString()) !== undefined) {
            (0, helpers_1.openRecipe)(item.getRecipe());
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.selectNodeFromList', (item) => {
        var _a;
        if (item.isRemoved() === 1) {
            vscode.window.showErrorMessage("Node is in the \"Removed nodes\" list so it cannot be selected!");
        }
        else if (((_a = item.label) === null || _a === void 0 ? void 0 : _a.toString()) !== undefined) {
            selectNodeFromList(item.label.toString());
        }
    }));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("visualization-sidebar", sidebar, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("visualization-legend", legend, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("removed-list", removedTreeDataProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("used-by-list", usedByTreeDataProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("requested-list", requestedTreeDataProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("affected-list", affectedTreeDataProvider));
    vscode.commands.executeCommand('setContext', 'showAffected', false);
    vscode.commands.executeCommand('setContext', 'showLegend', false);
}
exports.activate = activate;
// Example how BitBake could be called
//function callBitbake(path: string) {
//	// use linux cd
//	cp.exec('pushd' + path + " && dir", (err: any, stdout: any, stderr: any) => {
//		console.log('stdout: ' + stdout);
//		console.log('stderr: ' + stderr);
//		if (err) {
//			console.log('error: ' + err);
//		}
//	});
//}
/**
 * Select node from the list of requested or used by nodes.
 * @param name Name of the node that will be selected.
 */
function selectNodeFromList(name) {
    visualizationPanel.selectNodeFromList(name);
}
/**
 * Create and show visualization.
 * @param extensionUri Extension URI.
 * @param type Type of the BitBake task.
 * @param distance Distance between the nodes (for the force directed algorithm).
 * @param iterations Number of iterations (for the force directed algorithm).
 * @param strength Strength of the force between nodes (for the force directed algorithm).
 * @param mode Mode of analysis.
 * @returns void
 */
function createVizualization(extensionUri, type, distance, iterations, strength, mode) {
    var graphString = "";
    if (vscode.workspace.workspaceFolders !== undefined) {
        const dotPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/task-depends.dot";
        if (!(0, fs_1.existsSync)(dotPath)) {
            //callBitbake(vscode.workspace.workspaceFolders[0].uri.fsPath);
            vscode.window.showErrorMessage(".dot file not found in first workspace folder! Make sure Yocto Project directory is in the first folder of the workspace!");
            return;
        }
        var dotParser = new DotParser_1.DotParser(dotPath);
        graphString = dotParser.parseDotFile(type, mode);
        (0, fs_1.writeFileSync)(vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/graph.json", graphString);
    }
    if (graphString === "") {
        vscode.window.showErrorMessage("No graph data loaded!");
        return;
    }
    if (mode === "affected_nodes") {
        vscode.commands.executeCommand('setContext', 'showAffected', true);
    }
    else {
        vscode.commands.executeCommand('setContext', 'showAffected', false);
    }
    if (mode === "licenses") {
        vscode.commands.executeCommand('setContext', 'showLegend', true);
    }
    else {
        vscode.commands.executeCommand('setContext', 'showLegend', false);
    }
    visualizationPanel.updateData(graphString, mode, distance, iterations, strength);
    removedTreeDataProvider.clearAllNodes();
    removedTreeDataProvider.refresh();
    sidebar.clearSelectedNode();
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
    visualizationPanel.createAndShow(extensionUri);
}
exports.createVizualization = createVizualization;
/**
 * Add node to the removed nodes TreeView.
 * @param name Name of the node to be removed.
 * @param recipe Path to the recipe of the node to be removed.
 * @param id ID of the node to be removed.
 */
function addNodeToRemoved(name, recipe, id) {
    removedTreeDataProvider.addNode(name, recipe);
    removedTreeDataProvider.refresh();
    visualizationPanel.removeNode(id);
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
}
exports.addNodeToRemoved = addNodeToRemoved;
/**
 * Return node from the TreeView of removed nodes back to visualization.
 * @param name Name of the node to be removed.
 */
function returnToVisualization(name) {
    removedTreeDataProvider.removeNode(name);
    removedTreeDataProvider.refresh();
    sidebar.clearSelectedNode();
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
    visualizationPanel.returnNode(name);
}
exports.returnToVisualization = returnToVisualization;
/**
 * Export the visualization SVG.
 */
function exportSVG() {
    visualizationPanel.callExportSVG();
}
exports.exportSVG = exportSVG;
/**
 * Find nodes in visualization with a given search string.
 * @param seach String which should be used to search for nodes.
 */
function findNodes(seach) {
    if (seach == "") {
        vscode.window.showErrorMessage("Empty string cannot be used for search of nodes!");
        return;
    }
    if (!visualizationPanel.isWindowShown()) {
        vscode.window.showErrorMessage("No visualization available!");
        return;
    }
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
    visualizationPanel.findNodes(seach);
}
exports.findNodes = findNodes;
/**
 * Set data for the legend.
 * @param legendData Legend data to be set.
 */
function setLegendData(legendData) {
    legend.setLegendData(legendData);
    legend.showLegend();
}
exports.setLegendData = setLegendData;
/**
 * Select node from visualization.
 * @param node Node to be selected.
 * @param used_by List of nodes that request the selected node.
 * @param requested List of nodes that the selected node reauests.
 * @param affected List of node directly or inderectly depenedent on the selected node.
 */
function selectNode(node, used_by, requested, affected) {
    sidebar.selectNode(node);
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.updateNodes(used_by);
    requestedTreeDataProvider.updateNodes(requested);
    affectedTreeDataProvider.updateNodes(affected);
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
}
exports.selectNode = selectNode;


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sidebar = void 0;
const vscode = __webpack_require__(1);
const constants_1 = __webpack_require__(3);
const extension_1 = __webpack_require__(0);
const helpers_1 = __webpack_require__(4);
const recipe_parser_1 = __webpack_require__(6);
/**
 * Class representing a sidebar menu.
 */
class Sidebar {
    //public revive(panel: vscode.WebviewView) {
    //    this._view = panel;
    //}
    /**
     * Create an instance of the Sidebar.
     * @param _extensionUri Extension URI.
     */
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    /**
     * Revolves a webview view.
     * resolveWebviewView is called when a view first becomes visible.
     * This may happen when the view is first loaded or when the user hides and then shows a view again.
     * @param webviewView Webview view to restore. The provider should take ownership of this view.
     * The provider must set the webview's .html and hook up all webview events it is interested in.
     */
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, "media")
            ],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
            switch (data.command) {
                case "visualize-s": {
                    if (data.distance == "" || data.iterations == "" || data.strength == "") {
                        vscode.window.showErrorMessage("Invalid force settings!");
                        return;
                    }
                    (0, extension_1.createVizualization)(this._extensionUri, data.type, data.distance, data.iterations, data.strength, data.mode);
                    break;
                }
                case "remove-selected-s": {
                    if (!this.selectedNode) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }
                    (0, extension_1.addNodeToRemoved)(this.selectedNode.getName(), this.selectedNode.getRecipe(), this.selectedNode.getId());
                    this.clearSelectedNode();
                    break;
                }
                case "open-selected-recipe-s": {
                    if (!this.selectedNode) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }
                    (0, helpers_1.openRecipe)(this.selectedNode.getRecipe());
                    break;
                }
                case "call-export-svg-s": {
                    (0, extension_1.exportSVG)();
                    break;
                }
                case "find-nodes-s": {
                    (0, extension_1.findNodes)(data.search);
                    this.clearSelectedNode();
                    break;
                }
            }
        }));
    }
    /**
     * Select a node from visualization. Set information to the sidebar.js file.
     * @param node Selected node.
     */
    selectNode(node) {
        var _a;
        this.selectedNode = node;
        var recipePath = (0, helpers_1.getRecipePath)(this.selectedNode.getRecipe());
        var license = this.selectedNode.getLicense();
        if (license === "") {
            license = (0, recipe_parser_1.parseRecipe)(recipePath).license;
        }
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "select-node-s",
            name: node.getName(),
            recipe: node.getRecipe(),
            licence: license
        });
    }
    /**
     * Clear information about selected node. Send this information to the sidebar.js file.
     */
    clearSelectedNode() {
        var _a;
        this.selectedNode = undefined;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "clear-selected-node-s",
        });
    }
    /**
     * Create HTML content of the WebView.
     * @param webview WebView instance.
     * @returns HTML content.
     */
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.js"));
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const nonce = (0, helpers_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			    <head>
			    	<meta charset="UTF-8">
			    	<!--
			    		Use a content security policy to only allow loading images from https or from our extension directory,
			    		and only allow scripts that have a specific nonce.
                    -->
                    <meta http-equiv="Content-Security-Policy" content="style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
			    	<meta name="viewport" content="width=device-width, initial-scale=1.0">
			    	<link href="${stylesMainUri}" rel="stylesheet">
			    	<link href="${stylesResetUri}" rel="stylesheet">
			    </head>
                <body>
                    <div class="menu">
                        <h4>Task type:</h4>
                        <select id="task_type">
                            <option value="default">DEFAULT</option>
                            <option value="do_build">do_build</option>
                            <option value="do_compile">do_compile</option>
                            <option value="do_compile_ptest_base">do_compile_ptest_base</option>
                            <option value="do_configure">do_configure</option>
                            <option value="do_configure_ptest_base">do_configure_ptest_base</option>
                            <option value="do_deploy_source_date_epoch">do_deploy_source_date_epoch</option>
                            <option value="do_fetch">do_fetch</option>
                            <option value="do_install">do_install</option>
                            <option value="do_install_ptest_base">do_install_ptest_base</option>
                            <option value="do_package">do_package</option>
                            <option value="do_package_qa">do_package_qa</option>
                            <option value="do_package_write_rpm">do_package_write_rpm</option>
                            <option value="do_packagedata">do_packagedata</option>
                            <option value="do_patch">do_patch</option>
                            <option value="do_populate_lic">do_populate_lic</option>
                            <option value="do_populate_sysroot">do_populate_sysroot</option>
                            <option value="do_prepare_recipe_sysroot">do_prepare_recipe_sysroot</option>
                            <option value="do_unpack">do_unpack</option>
                            <option value="do_populate_sysroot">do_populate_sysroot</option>
                        </select>
                        <h4>Mode:</h4>
                        <select id="mode_type">
                            <option value="default">DEFAULT</option>
                            <option value="licenses">Licenses</option>
                            <option value="affected_nodes">Affected nodes</option>
                        </select>
                        <br>
                        <br>
                        <h4>Force link distance:</h4>
                        <input id="distance" type="number" value="${constants_1.DEFAULT_DISTANCE}"></input>
                        <h4>Force link iterations:</h4>
                        <input id="iterations" type="number" value="${constants_1.DEFAULT_ITERATIONS}"></input>
                        <h4>Force node strength (repulsion):</h4>
                        <input id="strength" type="number" value="${constants_1.DEFAULT_STRENGTH}"></input>
                        <br>
                        <br>
                        <button type="button" id="generate">Visualize</button>
                        <button type="button" id="export">Export SVG</button>
                        <br>
                        <br>
                        <input id="search-box" placeholder="search-string"></input>
                        <button type="button" id="find-nodes">Find nodes</button>
                        <hr>
                        <h3>Selected node:</h3>
                        <h4>Name:</h4>
                        <div id="selected-name" style="color:green">-none-</div>
                        <h4>License:</h4>
                        <div id="selected-licence" style="color:green">-none-</div>
                        <h4>Recipe:</h4>
                        <div id="selected-recipe" style="color:green">-none-</div>
                        <br>
                        <button type="button" id="remove-selected">Remove</button>
                        <button type="button" id="open-recipe">Open recipe</button>
                        <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                    <div>
			    </body>
			</html>`;
    }
}
exports.Sidebar = Sidebar;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_STRENGTH = exports.DEFAULT_ITERATIONS = exports.DEFAULT_DISTANCE = exports.DEFAULT_MODE = exports.DEFAULT_TYPE = void 0;
/**
 * Default value for the selected BitBake task.
 */
exports.DEFAULT_TYPE = "default";
/**
 * Default mode of analysis.
 */
exports.DEFAULT_MODE = "default";
/**
 * Default distance for the simulation algorithm.
 */
exports.DEFAULT_DISTANCE = 400;
/**
 * Default number of iterations for the simulation algorithm.
 */
exports.DEFAULT_ITERATIONS = 1;
/**
 * Default strength for the simulation algorithm.
 */
exports.DEFAULT_STRENGTH = -3500;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.openRecipe = exports.getNonce = exports.getRecipePath = exports.loadFile = void 0;
const fs_1 = __webpack_require__(5);
const vscode = __webpack_require__(1);
/**
 * Load data from a specified file and return them as a list of lines.
 * @param file File to be opened.
 * @returns List of lines (strings).
 */
function loadFile(file) {
    var data;
    try {
        data = (0, fs_1.readFileSync)(file, "utf8");
    }
    catch (err) {
        data = undefined;
    }
    return data === null || data === void 0 ? void 0 : data.split("\n");
}
exports.loadFile = loadFile;
/**
 * Get correct path to the recipe file (used for WSLv2 functionality).
 * @param recipe Path to recipe.
 * @returns Correct path to recipe.
 */
function getRecipePath(recipe) {
    var recipePath = recipe;
    if (vscode.workspace.workspaceFolders !== undefined) {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        if (workspacePath.includes("wsl")) {
            const pathData = workspacePath.replace("\\\\", "").split("\\");
            recipePath = "\\\\" + pathData[0] + "\\" + pathData[1] + "\\" + recipe.replace("/", "\\");
        }
    }
    return recipePath;
}
exports.getRecipePath = getRecipePath;
/**
 * Generated nonce to be used for loading JS file in HTML.
 * @returns Nonce string.
 */
function getNonce() {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;
/**
 * Opens a recipe file.
 * @param recipe Path to recipe.
 */
function openRecipe(recipe) {
    var recipePath = getRecipePath(recipe);
    vscode.workspace.openTextDocument(recipePath).then(document => vscode.window.showTextDocument(document), () => vscode.window.showErrorMessage("Recipe file cannot be opened!"));
}
exports.openRecipe = openRecipe;


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseRecipe = void 0;
const helpers_1 = __webpack_require__(4);
/**
 * Parse a recipe file and return a dictionary with license information.
 * @param recipe Path to the recipe file.
 * @returns Dictionary with license information.
 */
function parseRecipe(recipe) {
    var additionalInfo = {};
    var data = (0, helpers_1.loadFile)(recipe);
    additionalInfo.license = "none";
    if (!data) {
        return additionalInfo;
    }
    for (var i = 0; i < data.length; i++) {
        var line = data[i];
        var lineData = line.split("=");
        if (lineData.length > 1) {
            if (lineData[0].trim() === "LICENSE") {
                additionalInfo.license = lineData[1].replace('"', "").replace('"', "").trim();
                break;
            }
        }
    }
    return additionalInfo;
}
exports.parseRecipe = parseRecipe;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DotParser = void 0;
const typescript_map_1 = __webpack_require__(8);
const constants_1 = __webpack_require__(3);
const helpers_1 = __webpack_require__(4);
const Link_1 = __webpack_require__(9);
const Node_1 = __webpack_require__(10);
const recipe_parser_1 = __webpack_require__(6);
/**
 * Class used for parsing BitBake generated .dot files.
 */
class DotParser {
    /**
     * Initialize DotParser class instance.
     * @param dotPath Path to the .dot file.
     */
    constructor(dotPath) {
        this.dotPath = dotPath;
    }
    /**
     * Parse a .dot file based on given parameters.
     * @param type Type of the BitBake task that will be parsed.
     * @param mode Mode of graph analysis.
     * @returns JSON string with data for visualization.
     */
    parseDotFile(type, mode) {
        var graphString;
        if (type === constants_1.DEFAULT_TYPE) {
            graphString = this.parseDotFileDefault(mode);
        }
        else {
            graphString = this.parseDotFileTaskType(type, mode);
        }
        return graphString;
    }
    /**
     * Parse .dot file if "default" BitBake task type was selected (uses ".do_prepare_recipe_sysroot" on the left side and ".do_populate_sysroot" on the right side).
     * @param mode Mode of graph analysis.
     * @returns JSON string with data for visualization.
     */
    parseDotFileDefault(mode) {
        var index = 1;
        var data = (0, helpers_1.loadFile)(this.dotPath);
        var nodes = [];
        var links = [];
        data === null || data === void 0 ? void 0 : data.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes("do_prepare_recipe_sysroot") && !lineData[0].includes("label=") && lineData[1].includes("do_populate_sysroot")) {
                const recipeName = lineData[0].replace(".do_prepare_recipe_sysroot", "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].replace(".do_populate_sysroot", "").replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
                    index = this.addGraphData(nodes, links, recipeName, dependentRecipeName, index);
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");
                const recipeNameData = lineData[0].split(".");
                const recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();
                index = this.setNodeRecipe(nodes, lineData[2], recipeName, index, mode);
            }
        });
        return this.generateGraphJSON(nodes, links);
    }
    /**
     * Parse BitBake .dot file. Uses only lines that have the specified type on the left side.
     * @param type Type of the BitBake task that will be parsed.
     * @param mode Mode of graph analysis.
     * @returns JSON string with data for visualization.
     */
    parseDotFileTaskType(type, mode) {
        var index = 1;
        var data = (0, helpers_1.loadFile)(this.dotPath);
        var nodes = [];
        var links = [];
        data === null || data === void 0 ? void 0 : data.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes(type) && !lineData[0].includes("label=")) {
                const recipeName = lineData[0].replace("." + type, "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].split(".")[0].replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
                    index = this.addGraphData(nodes, links, recipeName, dependentRecipeName, index);
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");
                const recipeNameData = lineData[0].split(".");
                const recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();
                index = this.setNodeRecipe(nodes, lineData[2], recipeName, index, mode);
            }
        });
        return this.generateGraphJSON(nodes, links);
    }
    /**
     * Add new nodes and links to the list of nodes and links.
     * @param nodes List of nodes.
     * @param links List of links.
     * @param recipeName Name of the first recipe.
     * @param dependentRecipeName Name of the second recipe.
     * @param index Index of the node in the list of nodes.
     * @returns New index.
     */
    addGraphData(nodes, links, recipeName, dependentRecipeName, index) {
        var source;
        var target;
        if (!nodes.some(rn => rn.getName() == recipeName)) {
            nodes.push(new Node_1.Node(index, recipeName));
            source = index;
            index++;
        }
        else {
            source = nodes.find(rn => rn.getName() == recipeName).getId();
        }
        if (!nodes.some(rn => rn.getName() == dependentRecipeName)) {
            nodes.push(new Node_1.Node(index, dependentRecipeName));
            target = index;
            index++;
        }
        else {
            target = nodes.find(rn => rn.getName() == dependentRecipeName).getId();
        }
        const link = new Link_1.Link(source, target);
        links.push(link);
        return index;
    }
    /**
     * Assing a path to the recipe file for a specified node or for a newly created one.
     * @param nodes List of nodes.
     * @param labelSource Label string.
     * @param recipeName Name of the recipe.
     * @param index Index of the node in the list of nodes.
     * @param mode Mode of graph analysis.
     * @returns New index.
     */
    setNodeRecipe(nodes, labelSource, recipeName, index, mode) {
        var label = labelSource.replace("[", "").replace("]", "").replace("label=", "").replace('"', "").replace('"', "").trim();
        var labelData = label.split(/\\n|:/);
        var recipePath = labelData[labelData.length - 1];
        if (!nodes.some(rn => rn.getName() == recipeName)) {
            const node = new Node_1.Node(index, recipeName);
            node.setRecipe(recipePath);
            if (mode === "licenses") {
                node.setLicense((0, recipe_parser_1.parseRecipe)((0, helpers_1.getRecipePath)(recipePath)).license);
            }
            nodes.push(node);
            index++;
        }
        else {
            const node = nodes.find(rn => rn.getName() == recipeName);
            node.setRecipe(recipePath);
            if (mode === "licenses") {
                node.setLicense((0, recipe_parser_1.parseRecipe)((0, helpers_1.getRecipePath)(recipePath)).license);
            }
        }
        return index;
    }
    /**
     * Generate a JSON string containing list of nodes and list of links.
     * @param nodes List of nodes.
     * @param links List of links.
     * @returns JSON string with data for visualization.
     */
    generateGraphJSON(nodes, links) {
        var graph = new typescript_map_1.TSMap();
        graph.set("nodes", nodes);
        graph.set("links", links);
        return JSON.stringify(graph.toJSON());
    }
}
exports.DotParser = DotParser;


/***/ }),
/* 8 */
/***/ (function(__unused_webpack_module, exports) {


var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TSMap = void 0;
var TSMap = /** @class */ (function () {
    function TSMap(inputMap) {
        var t = this;
        t._keys = [];
        t._values = [];
        t.length = 0;
        if (inputMap) {
            inputMap.forEach(function (v, k) {
                t.set(v[0], v[1]);
            });
        }
    }
    /**
     * Convert a JSON object to a map.
     *
     * @param {*} jsonObject JSON object to convert
     * @param {boolean} [convertObjs] convert nested objects to maps
     * @returns {TSMap<K, V>}
     * @memberof TSMap
     */
    TSMap.prototype.fromJSON = function (jsonObject, convertObjs) {
        var t = this;
        var setProperty = function (value) {
            if (value !== null && typeof value === 'object' && convertObjs)
                return new TSMap().fromJSON(value, true);
            if (Array.isArray(value) && convertObjs)
                return value.map(function (v) { return setProperty(v); });
            return value;
        };
        Object.keys(jsonObject).forEach(function (property) {
            if (jsonObject.hasOwnProperty(property)) {
                t.set(property, setProperty(jsonObject[property]));
            }
        });
        return t;
    };
    /**
     * Outputs the contents of the map to a JSON object
     *
     * @returns {{[key: string]: V}}
     * @memberof TSMap
     */
    TSMap.prototype.toJSON = function () {
        var obj = {};
        var t = this;
        var getValue = function (value) {
            if (value instanceof TSMap) {
                return value.toJSON();
            }
            else if (Array.isArray(value)) {
                return value.map(function (v) { return getValue(v); });
            }
            else {
                return value;
            }
        };
        t.keys().forEach(function (k) {
            obj[String(k)] = getValue(t.get(k));
        });
        return obj;
    };
    /**
     * Get an array of arrays respresenting the map, kind of like an export function.
     *
     * @returns {(Array<Array<K|V>>)}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.entries = function () {
        var _this = this;
        return [].slice.call(this.keys().map(function (k) { return [k, _this.get(k)]; }));
    };
    /**
     * Get an array of keys in the map.
     *
     * @returns {Array<K>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.keys = function () {
        return [].slice.call(this._keys);
    };
    /**
     * Get an array of the values in the map.
     *
     * @returns {Array<V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.values = function () {
        return [].slice.call(this._values);
    };
    /**
     * Check to see if an item in the map exists given it's key.
     *
     * @param {K} key
     * @returns {Boolean}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.has = function (key) {
        return this._keys.indexOf(key) > -1;
    };
    /**
     * Get a specific item from the map given it's key.
     *
     * @param {K} key
     * @returns {V}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.get = function (key) {
        var i = this._keys.indexOf(key);
        return i > -1 ? this._values[i] : undefined;
    };
    /**
     * Safely retrieve a deeply nested property.
     *
     * @param {K[]} path
     * @returns {V}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.deepGet = function (path) {
        if (!path || !path.length)
            return null;
        var recursiveGet = function (obj, path) {
            if (obj === undefined || obj === null)
                return null;
            if (!path.length)
                return obj;
            return recursiveGet(obj instanceof TSMap ? obj.get(path[0]) : obj[path[0]], path.slice(1));
        };
        return recursiveGet(this.get(path[0]), path.slice(1));
    };
    /**
     * Set a specific item in the map given it's key, automatically adds new items as needed.
     * Ovewrrites existing items
     *
     * @param {K} key
     * @param {V} value
     *
     * @memberOf TSMap
     */
    TSMap.prototype.set = function (key, value) {
        var t = this;
        // check if key exists and overwrite
        var i = this._keys.indexOf(key);
        if (i > -1) {
            t._values[i] = value;
        }
        else {
            t._keys.push(key);
            t._values.push(value);
            t.length = t._values.length;
        }
        return this;
    };
    /**
     * Enters a value into the map forcing the keys to always be sorted.
     * Stolen from https://machinesaredigging.com/2014/04/27/binary-insert-how-to-keep-an-array-sorted-as-you-insert-data-in-it/
     * Best case speed is O(1), worse case is O(N).
     *
     * @param {K} key
     * @param {V} value
     * @param {number} [startVal]
     * @param {number} [endVal]
     * @returns {this}
     * @memberof TSMap
     */
    TSMap.prototype.sortedSet = function (key, value, startVal, endVal) {
        var t = this;
        var length = this._keys.length;
        var start = startVal || 0;
        var end = endVal !== undefined ? endVal : length - 1;
        if (length == 0) {
            t._keys.push(key);
            t._values.push(value);
            return t;
        }
        if (key == this._keys[start]) {
            this._values[start] = value;
            return this;
        }
        if (key == this._keys[end]) {
            this._values[end] = value;
            return this;
        }
        if (key > this._keys[end]) {
            this._keys.splice(end + 1, 0, key);
            this._values.splice(end + 1, 0, value);
            return this;
        }
        if (key < this._keys[start]) {
            this._values.splice(start, 0, value);
            this._keys.splice(start, 0, key);
            return this;
        }
        if (start >= end) {
            return this;
        }
        var m = start + Math.floor((end - start) / 2);
        if (key < this._keys[m]) {
            return this.sortedSet(key, value, start, m - 1);
        }
        if (key > this._keys[m]) {
            return this.sortedSet(key, value, m + 1, end);
        }
        return this;
    };
    /**
     * Provide a number representing the number of items in the map
     *
     * @returns {number}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.size = function () {
        return this.length;
    };
    /**
     * Clear all the contents of the map
     *
     * @returns {TSMap<K,V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.clear = function () {
        var t = this;
        t._keys.length = t.length = t._values.length = 0;
        return this;
    };
    /**
     * Delete an item from the map given it's key
     *
     * @param {K} key
     * @returns {Boolean}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.delete = function (key) {
        var t = this;
        var i = t._keys.indexOf(key);
        if (i > -1) {
            t._keys.splice(i, 1);
            t._values.splice(i, 1);
            t.length = t._keys.length;
            return true;
        }
        return false;
    };
    /**
     * Used to loop through the map.
     *
     * @param {(value:V,key?:K,index?:number) => void} callbackfn
     *
     * @memberOf TSMap
     */
    TSMap.prototype.forEach = function (callbackfn) {
        var _this = this;
        this._keys.forEach(function (v, i) {
            callbackfn(_this.get(v), v, i);
        });
    };
    /**
     * Returns an array containing the returned value of each item in the map.
     *
     * @param {(value:V,key?:K,index?:number) => any} callbackfn
     * @returns {Array<any>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.map = function (callbackfn) {
        var _this = this;
        return this.keys().map(function (itemKey, i) {
            return callbackfn(_this.get(itemKey), itemKey, i);
        });
    };
    /**
     * Removes items based on a conditional function passed to filter.
     * Mutates the map in place.
     *
     * @param {(value:V,key?:K,index?:number) => Boolean} callbackfn
     * @returns {TSMap<K,V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.filter = function (callbackfn) {
        var t = this;
        __spreadArrays(t._keys).forEach(function (v, i) {
            if (callbackfn(t.get(v), v, i) === false)
                t.delete(v);
        });
        return this;
    };
    /**
     * Creates a deep copy of the map, breaking all references to the old map and it's children.
     * Uses JSON.parse so any functions will be stringified and lose their original purpose.
     *
     * @returns {TSMap<K,V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.clone = function () {
        return new TSMap(this.entries());
    };
    return TSMap;
}());
exports.TSMap = TSMap;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Link = void 0;
/**
 * Class representing a link in the graph.
 */
class Link {
    /**
     * Create an instance representing a connection.
     * @param source ID of the source recipe node.
     * @param target ID of the target recipe node.
     */
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}
exports.Link = Link;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Node = void 0;
/**
 * Class representing a recipe (node) in the graph.
 */
class Node {
    /**
     * Create an instance representing a recipe (node) in the graph.
     * @param id ID of the node.
     * @param name Name of the node.
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.recipe = "";
        this.license = "";
    }
    /**
     * Return an ID of the node.
     * @returns ID of the node.
     */
    getId() {
        return this.id;
    }
    /**
     * Return a name of the node.
     * @returns Name of the node.
     */
    getName() {
        return this.name;
    }
    /**
     * Return a recipe of the node.
     * @returns Recipe of the node.
     */
    getRecipe() {
        return this.recipe;
    }
    /**
     * Set path to the recipe.
     * @param recipe Path to the recipe.
     */
    setRecipe(recipe) {
        this.recipe = recipe;
    }
    /**
     * Return a license used by the node.
     * @returns Used license of the node.
     */
    getLicense() {
        return this.license;
    }
    /**
    * Set used license.
    * @param license Used license.
    */
    setLicense(license) {
        this.license = license;
    }
}
exports.Node = Node;


/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VisualizationPanel = void 0;
const fs_1 = __webpack_require__(5);
const vscode = __webpack_require__(1);
const extension_1 = __webpack_require__(0);
const helpers_1 = __webpack_require__(4);
const Node_1 = __webpack_require__(10);
/**
 * Class representing a panel (tab) with visualization
 */
class VisualizationPanel {
    //public static kill() {
    //    VisualizationPanel.currentPanel?.dispose();
    //    VisualizationPanel.currentPanel = undefined;
    //}
    //
    //public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    //    VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
    //}
    /**
     * Initialize panel class.
     * @param extensionUri Extension URI.
     */
    constructor(extensionUri) {
        /**
         * Identifies the type of the WebView panel.
         */
        this.viewType = "visualization";
        /**
         * List of disposables, which should be disposed when the panel is disposed.
         */
        this._disposables = [];
        /**
         * Stores if window is shown.
         */
        this.isShown = false;
        this._extensionUri = extensionUri;
    }
    /**
     * Creates and show a panel or just show if already exists.
     * @param extensionUri Extension URI.
     * @returns void
     */
    createAndShow(extensionUri) {
        this.dispose();
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        const panel = vscode.window.createWebviewPanel(this.viewType, "Visualization", column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "media")
            ],
        });
        panel.webview.html = this._getHtmlForWebview(panel.webview);
        this.initMessageReciever(panel);
        panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel = panel;
        this.isShown = true;
    }
    /**
     * Update visualization data of  the panel.
     * @param graphString JSON string with graph data.
     * @param mode Mode of analysis.
     * @param distance Distance between the nodes (for the force directed algorithm).
     * @param iterations Number of iterations (for the force directed algorithm).
     * @param strength Strength of the force between nodes (for the force directed algorithm).
     */
    updateData(graphString, mode, distance, iterations, strength) {
        this.graphString = graphString;
        this.mode = mode;
        this.distance = distance;
        this.iterations = iterations;
        this.strength = strength;
    }
    /**
     * Initialize actions for different messages.
     * @param panel WebView panel.
     */
    initMessageReciever(panel) {
        panel.webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
            switch (data.command) {
                case "select-node-v": {
                    if (!data.name) {
                        return;
                    }
                    var selectedNode = new Node_1.Node(data.id, data.name);
                    selectedNode.setRecipe(data.recipe);
                    (0, extension_1.selectNode)(selectedNode, data.used_by, data.requested, data.affected);
                    break;
                }
                case "export-svg-v": {
                    if (!data.svg) {
                        return;
                    }
                    vscode.window.showSaveDialog({ filters: { "Images": ["svg"] } }).then(file => {
                        if (file !== undefined) {
                            (0, fs_1.writeFileSync)(file.fsPath, '<?xml version="1.0" standalone="no"?>\r\n' + data.svg);
                        }
                    });
                    break;
                }
                case "show-legend-v": {
                    (0, extension_1.setLegendData)(data.legend);
                    break;
                }
                case "node-not-found-v": {
                    vscode.window.showInformationMessage("No nodes found!");
                    break;
                }
            }
        }));
    }
    /**
     * Close the panel and clear resources.
     */
    dispose() {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        this.isShown = false;
    }
    /**
     * Send message to the visualization.js file that the node with given ID should be removed.
     * @param id ID of the node which should be removed.
     */
    removeNode(id) {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "remove-node-v",
            id: id
        });
    }
    /**
     * Send message to the visualization.js file that the node with given ID should be returned
     * to visualization.
     * @param name Name of the node which should be returned to visualization.
     */
    returnNode(name) {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "return-node-v",
            name: name
        });
    }
    /**
     * Send message to the visualization.js file that the SVG should be exported.
     */
    callExportSVG() {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "call-export-svg-v"
        });
    }
    /**
     * Send message to the visualization.js file that nodes with search string in names should be highlighted.
     * @param search String which should be used to search for nodes.
     */
    findNodes(search) {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "find-nodes-v",
            search: search
        });
    }
    /**
     * Send message to the visualization.js file that the node from the TreeView should be selected.
     * @param name Name of the node which should be selected.
     */
    selectNodeFromList(name) {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "select-node-from-list-v",
            name: name
        });
    }
    /**
     * Gets if window is shown.
     * @returns false if window in not shown else true.
     */
    isWindowShown() {
        return this.isShown;
    }
    /**
     * Create HTML content of the WebView.
     * @param webview WebView instance.
     * @returns HTML content.
     */
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "visualization.js"));
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const nonce = (0, helpers_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			    <head>
			    	<meta charset="UTF-8">
			    	<!--
			    		Use a content security policy to only allow loading images from https or from our extension directory,
			    		and only allow scripts that have a specific nonce.
                    -->
                    <meta http-equiv="Content-Security-Policy" content="style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
			    	<meta name="viewport" content="width=device-width, initial-scale=1.0">
			    	<link href="${stylesMainUri}" rel="stylesheet">
			    	<link href="${stylesResetUri}" rel="stylesheet">
			    </head>
                <body>
                    <div class="chart">
                        <div id="visualization"></div>
                        <input type="hidden" id="graph" name="graph" value='${this.graphString}''>
                        <input type="hidden" id="mode" name="mode" value='${this.mode}''>
                        <input type="hidden" id="distance" value="${this.distance}">
                        <input type="hidden" id="iterations" value="${this.iterations}">
                        <input type="hidden" id="strength" value="${this.strength}">
                        <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                    </div>
			    </body>
			</html>`;
    }
}
exports.VisualizationPanel = VisualizationPanel;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemovedTreeDataProvider = void 0;
const vscode = __webpack_require__(1);
const NodeTreeItem_1 = __webpack_require__(13);
/**
 * TreeProvider class for a TreeView of nodes removed from visualization.
 */
class RemovedTreeDataProvider {
    /**
     * Inititalizes the provider.
     */
    constructor() {
        /**
         * Action executed when TreeView data changed.
         */
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
    }
    /**
     * Refresh the TreeViev.
     */
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    /**
     * Get the tree item (implemented because it is required by the interface).
     * @param element Element that is also returned.
     * @returns
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Get a list of childer of the element.
     * @returns All data elements as there is only one layer in the tree.
     */
    getChildren(element) {
        //if (element === undefined) {
        //    return this.data;
        //}
        //return element.children;
        return this.data;
    }
    /**
     * Adds a new node to the list of removed nodes.
     * @param label Name of the recipe.
     * @param recipe Path to the recipe file.
     */
    addNode(label, recipe) {
        this.data.push(new NodeTreeItem_1.NodeTreeItem(label, recipe, 0));
    }
    /**
     * Remove node from the list of removed nodes.
     * @param label Name of the node to be removed.
     */
    removeNode(label) {
        var index = this.data.findIndex((node) => node.label === label);
        this.data.splice(index, 1);
    }
    /**
     * Clear the list of nodes.
     */
    clearAllNodes() {
        this.data = [];
    }
}
exports.RemovedTreeDataProvider = RemovedTreeDataProvider;


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NodeTreeItem = void 0;
const vscode = __webpack_require__(1);
/**
 * Class representing an recipe (node) in the TreeView.
 */
class NodeTreeItem extends vscode.TreeItem {
    /**
     * Create an instance representing an recipe (node) in the TreeView.
     * @param label Name of the item in the TreeView.
     * @param recipe Path to the recipe.
     * @param is_removed Stores of recipe (node) is removed from the visualization.
     */
    constructor(label, recipe, is_removed) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.recipe = recipe;
        this.is_removed = is_removed;
        this.tooltip = this.recipe;
    }
    /**
     * Return if node is removed from the visualization.
     * @returns 1 if node is removed from the visualization.
     */
    isRemoved() {
        return this.is_removed;
    }
    /**
     * Get the path to the recipe.
     * @returns Path to the recipe.
     */
    getRecipe() {
        return this.recipe;
    }
}
exports.NodeTreeItem = NodeTreeItem;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConnectionsTreeDataProvider = void 0;
const vscode = __webpack_require__(1);
const NodeTreeItem_1 = __webpack_require__(13);
/**
 * TreeProvider class for a TreeView of requested and used-by nodes from visualization.
 */
class ConnectionsTreeDataProvider {
    /**
     * Inititalizes the provider.
     */
    constructor() {
        /**
         * Action executed when TreeView data changed.
         */
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
    }
    /**
     * Refresh the TreeViev.
     */
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    /**
     * Get the tree item (implemented because it is required by the interface).
     * @param element Element that is also returned.
     * @returns
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Get a list of childer of the element.
     * @returns All data elements as there is only one layer in the tree.
     */
    getChildren(element) {
        //if (element === undefined) {
        //    return this.data;
        //}
        //return element.children;
        return this.data;
    }
    /**
     * Adds new nodes to the TreeView.
     * @param nodeData List of nodes to be added.
     */
    updateNodes(nodeData) {
        nodeData.forEach(node => {
            this.data.push(new NodeTreeItem_1.NodeTreeItem(node.name, node.recipe, node.is_removed));
        });
    }
    /**
     * Clear the list of nodes.
     */
    clearAllNodes() {
        this.data = [];
    }
}
exports.ConnectionsTreeDataProvider = ConnectionsTreeDataProvider;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Legend = void 0;
const vscode = __webpack_require__(1);
const helpers_1 = __webpack_require__(4);
/**
 * Class representing a legend in the sidebar.
 */
class Legend {
    //public revive(panel: vscode.WebviewView) {
    //    this._view = panel;
    //}
    /**
     * Create an instance of the Legend.
     * @param _extensionUri Extension URI.
     */
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.legendData = [];
    }
    /**
     * Revolves a webview view.
     * resolveWebviewView is called when a view first becomes visible.
     * This may happen when the view is first loaded or when the user hides and then shows a view again.
     * @param webviewView Webview view to restore. The provider should take ownership of this view.
     * The provider must set the webview's .html and hook up all webview events it is interested in.
     */
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, "media")
            ],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        this.showLegend();
    }
    /**
     * Set list of legend elements.
     * @param legendData List of legend elements.
     */
    setLegendData(legendData) {
        this.legendData = legendData;
    }
    /**
     * Send message with list of legend elements to the legend.js file.
     */
    showLegend() {
        var _a;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "show-legend-s",
            legend: this.legendData
        });
    }
    /**
     * Create HTML content of the WebView.
     * @param webview WebView instance.
     * @returns HTML content.
     */
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "legend.js"));
        // Local path to css styles
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        //// Use a nonce to only allow specific scripts to be run
        const nonce = (0, helpers_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			    <head>
			    	<meta charset="UTF-8">
			    	<!--
			    		Use a content security policy to only allow loading images from https or from our extension directory,
			    		and only allow scripts that have a specific nonce.
                    -->
                    <meta http-equiv="Content-Security-Policy" content="style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
			    	<meta name="viewport" content="width=device-width, initial-scale=1.0">
			    	<link href="${stylesMainUri}" rel="stylesheet">
			    	<link href="${stylesResetUri}" rel="stylesheet">
			    </head>
                <body>
                    <div id="legend">
                        <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                    <div>
			    </body>
			</html>`;
    }
}
exports.Legend = Legend;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map