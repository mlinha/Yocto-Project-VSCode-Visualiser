/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectNode = exports.showLegend = exports.exportSVG = exports.returnToVisualization = exports.addNodeToRemoved = exports.createVizualization = exports.getNonce = exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(1);
const cp = __webpack_require__(2);
const Sidebar_1 = __webpack_require__(3);
const fs_1 = __webpack_require__(6);
const DotParser_1 = __webpack_require__(8);
const VisualizationPanel_1 = __webpack_require__(12);
const RemovedTreeDataProvider_1 = __webpack_require__(13);
const constants_1 = __webpack_require__(4);
const helpers_1 = __webpack_require__(5);
const ConnectionsTreeDataProvider_1 = __webpack_require__(15);
const Legend_1 = __webpack_require__(16);
var removedTreeDataProvider;
var usedByTreeDataProvider;
var requestedTreeDataProvider;
var affectedTreeDataProvider;
var sidebar;
var legend;
function activate(context) {
    sidebar = new Sidebar_1.Sidebar(context.extensionUri);
    legend = new Legend_1.Legend(context.extensionUri);
    removedTreeDataProvider = new RemovedTreeDataProvider_1.RemovedTreeDataProvider();
    usedByTreeDataProvider = new ConnectionsTreeDataProvider_1.ConnectionsTreeDataProvider();
    requestedTreeDataProvider = new ConnectionsTreeDataProvider_1.ConnectionsTreeDataProvider();
    affectedTreeDataProvider = new ConnectionsTreeDataProvider_1.ConnectionsTreeDataProvider();
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
        createVizualization(context.extensionUri, constants_1.default_type, constants_1.default_distance, constants_1.default_iterations, constants_1.default_strength, constants_1.default_mode);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.returnNode', (item) => {
        var _a;
        if (((_a = item.label) === null || _a === void 0 ? void 0 : _a.toString()) !== undefined) {
            returnToVisualization(item.label.toString());
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.openRecipe', (item) => {
        var _a;
        if (((_a = item.recipe) === null || _a === void 0 ? void 0 : _a.toString()) !== undefined) {
            var recipePath = (0, helpers_1.getRecipePath)(item.recipe);
            vscode.workspace.openTextDocument(recipePath).then(document => vscode.window.showTextDocument(document));
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.selectNodeFromList', (item) => {
        var _a;
        if (item.is_removed === 1) {
            vscode.window.showErrorMessage("Node is in the \"Removed nodes\" list so it cannot be selected!");
        }
        else if (((_a = item.label) === null || _a === void 0 ? void 0 : _a.toString()) !== undefined) {
            selectNodeFromList(item.label.toString());
        }
    }));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("visualization-sidebar", sidebar));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("visualization-legend", legend));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("removed-list", removedTreeDataProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("used-by-list", usedByTreeDataProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("requested-list", requestedTreeDataProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider("affected-list", affectedTreeDataProvider));
    vscode.commands.executeCommand('setContext', 'showAffected', false);
    vscode.commands.executeCommand('setContext', 'showLegend', false);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;
function callBitbake(path) {
    // use linux cd
    cp.exec('pushd' + path + " && dir", (err, stdout, stderr) => {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (err) {
            console.log('error: ' + err);
        }
    });
}
function selectNodeFromList(name) {
    var _a;
    (_a = VisualizationPanel_1.VisualizationPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.getWebView().postMessage({
        command: "select-node-from-list-v",
        name: name
    });
}
function createVizualization(extensionUri, type, distance, iterations, strength, mode) {
    if (vscode.workspace.workspaceFolders !== undefined) {
        const dotPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/task-depends.dot";
        if (!(0, fs_1.existsSync)(dotPath)) {
            console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);
            callBitbake(vscode.workspace.workspaceFolders[0].uri.fsPath);
        }
        var dotParser = new DotParser_1.DotParser(dotPath);
        var graphString = dotParser.parseDotFile(type, mode);
        (0, fs_1.writeFileSync)(vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/graph.json", graphString);
        VisualizationPanel_1.VisualizationPanel.graphString = graphString;
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
    VisualizationPanel_1.VisualizationPanel.mode = mode;
    VisualizationPanel_1.VisualizationPanel.distance = distance;
    VisualizationPanel_1.VisualizationPanel.iterations = iterations;
    VisualizationPanel_1.VisualizationPanel.strength = strength;
    removedTreeDataProvider.clearAllNodes();
    removedTreeDataProvider.refresh();
    VisualizationPanel_1.VisualizationPanel.kill();
    sidebar.clearSelectedNode();
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
    VisualizationPanel_1.VisualizationPanel.createOrShow(extensionUri);
}
exports.createVizualization = createVizualization;
function addNodeToRemoved(name, recipe, id) {
    var _a;
    removedTreeDataProvider.addNode(name, recipe);
    removedTreeDataProvider.refresh();
    (_a = VisualizationPanel_1.VisualizationPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.getWebView().postMessage({
        command: "remove-node-v",
        id: id
    });
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
}
exports.addNodeToRemoved = addNodeToRemoved;
function returnToVisualization(name) {
    var _a;
    removedTreeDataProvider.removeNode(name);
    removedTreeDataProvider.refresh();
    sidebar.clearSelectedNode();
    usedByTreeDataProvider.clearAllNodes();
    requestedTreeDataProvider.clearAllNodes();
    affectedTreeDataProvider.clearAllNodes();
    usedByTreeDataProvider.refresh();
    requestedTreeDataProvider.refresh();
    affectedTreeDataProvider.refresh();
    (_a = VisualizationPanel_1.VisualizationPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.getWebView().postMessage({
        command: "return-node-v",
        name: "name"
    });
}
exports.returnToVisualization = returnToVisualization;
function exportSVG() {
    var _a;
    (_a = VisualizationPanel_1.VisualizationPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.getWebView().postMessage({
        command: "call-export-svg-v",
        name: "name"
    });
}
exports.exportSVG = exportSVG;
function showLegend(legendData) {
    legend.showLegend(legendData);
}
exports.showLegend = showLegend;
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
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 3 */
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
const constants_1 = __webpack_require__(4);
const extension_1 = __webpack_require__(0);
const helpers_1 = __webpack_require__(5);
const recipe_parser_1 = __webpack_require__(7);
class Sidebar {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.selectedNode = null;
    }
    revive(panel) {
        this._view = panel;
    }
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
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
                    if (this.selectedNode === null) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }
                    (0, extension_1.addNodeToRemoved)(this.selectedNode.getName(), this.selectedNode.getRecipe(), this.selectedNode.getId());
                    this.clearSelectedNode();
                    break;
                }
                case "open-selected-recipe-s": {
                    if (this.selectedNode === null) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }
                    var recipePath = (0, helpers_1.getRecipePath)(this.selectedNode.getRecipe());
                    vscode.workspace.openTextDocument(recipePath).then(document => vscode.window.showTextDocument(document));
                    break;
                }
                case "call-export-svg-s": {
                    (0, extension_1.exportSVG)();
                    break;
                }
            }
        }));
    }
    selectNode(node) {
        var _a;
        this.selectedNode = node;
        var recipePath = (0, helpers_1.getRecipePath)(this.selectedNode.getRecipe());
        var additionalInfo = (0, recipe_parser_1.parseRecipe)(recipePath);
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "select-node-s",
            name: node.getName(),
            recipe: node.getRecipe(),
            licence: additionalInfo.licence
        });
    }
    clearSelectedNode() {
        var _a;
        this.selectedNode = null;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "clear-selected-node-s",
        });
    }
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.js"));
        // Local path to css styles
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        //const cssUri = webview.asWebviewUri(
        //  vscode.Uri.joinPath(this._extensionUri, "out", "compiled/hello.css")
        //);
        //
        //// Use a nonce to only allow specific scripts to be run
        const nonce = (0, extension_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesMainUri}" rel="stylesheet">
				<link href="${stylesResetUri}" rel="stylesheet">
                <script nonce="${nonce}"> </script>
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
                    <input id="distance" type="number" value="${constants_1.default_distance}"></input>
                    <h4>Force link iterations:</h4>
                    <input id="iterations" type="number" value="${constants_1.default_iterations}"></input>
                    <h4>Force node strength (repulsion):</h4>
                    <input id="strength" type="number" value="${constants_1.default_strength}"></input>
                    <br>
                    <br>
                    <button type="button" id="generate">Visualize</button>
                    <button type="button" id="export">Export SVG</button>
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
/* 4 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.default_strength = exports.default_iterations = exports.default_distance = exports.default_mode = exports.default_type = void 0;
exports.default_type = "default";
exports.default_mode = "default";
exports.default_distance = 400;
exports.default_iterations = 1;
exports.default_strength = -3500;


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getRecipePath = exports.loadFile = void 0;
const fs_1 = __webpack_require__(6);
const vscode = __webpack_require__(1);
function loadFile(file) {
    var data;
    try {
        data = (0, fs_1.readFileSync)(file, "utf8");
    }
    catch (err) {
        console.error(err);
    }
    return data === null || data === void 0 ? void 0 : data.split("\n");
}
exports.loadFile = loadFile;
function getRecipePath(recipe) {
    var recipePath = recipe;
    if (vscode.workspace.workspaceFolders !== undefined) {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        if (workspacePath.includes("wsl")) {
            const pathData = workspacePath.replace("\\\\", "").split("\\");
            console.log(pathData);
            recipePath = "\\\\" + pathData[0] + "\\" + pathData[1] + "\\" + recipe.replace("/", "\\");
            console.log(recipePath);
        }
    }
    console.log(recipePath);
    return recipePath;
}
exports.getRecipePath = getRecipePath;


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseRecipe = void 0;
const helpers_1 = __webpack_require__(5);
function parseRecipe(recipe) {
    var additionalInfo = {};
    var data = (0, helpers_1.loadFile)(recipe);
    additionalInfo.licence = "none";
    if (data === undefined) {
        return additionalInfo;
    }
    for (var i = 0; i < data.length; i++) {
        console.log(data[i]);
        var line = data[i];
        if (line.includes("LICENSE")) {
            var lineData = line.split("=");
            if (lineData.length > 1) {
                additionalInfo.licence = lineData[1].replace('"', "").replace('"', "").trim();
                break;
            }
        }
    }
    return additionalInfo;
}
exports.parseRecipe = parseRecipe;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DotParser = void 0;
const typescript_map_1 = __webpack_require__(9);
const helpers_1 = __webpack_require__(5);
const Link_1 = __webpack_require__(10);
const Node_1 = __webpack_require__(11);
const recipe_parser_1 = __webpack_require__(7);
class DotParser {
    constructor(dotPath) {
        this.dotPath = dotPath;
    }
    parseDotFile(type, mode) {
        var graphString;
        console.log(mode);
        if (type === "default") {
            graphString = this.parseDotFileDefault(mode);
        }
        else {
            graphString = this.parseDotFileTaskType(type, mode);
        }
        return graphString;
    }
    parseDotFileDefault(mode) {
        var index = 1;
        var data = (0, helpers_1.loadFile)(this.dotPath);
        var nodes = [];
        var links = [];
        data === null || data === void 0 ? void 0 : data.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes("do_prepare_recipe_sysroot") && !lineData[0].includes("label") && !lineData[1].includes("do_fetch")) {
                const recipeName = lineData[0].replace(".do_prepare_recipe_sysroot", "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].replace(".do_populate_sysroot", "").replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
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
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");
                var recipeNameData = lineData[0].split(".");
                var recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();
                var label = lineData[2].replace("[", "").replace("]", "").replace("label=", "").replace('"', "").replace('"', "").trim();
                var labelData = label.split(/\\n|:/);
                var recipePath = labelData[labelData.length - 1];
                if (!nodes.some(rn => rn.getName() == recipeName)) {
                    const node = new Node_1.Node(index, recipeName);
                    node.setRecipe(recipePath);
                    if (mode === "licenses") {
                        node.setLicense((0, recipe_parser_1.parseRecipe)((0, helpers_1.getRecipePath)(recipePath)).licence);
                    }
                    nodes.push(node);
                    index++;
                }
                else {
                    nodes.find(rn => rn.getName() == recipeName).setRecipe(recipePath);
                }
            }
        });
        return this.generateGraphJSON(nodes, links);
    }
    parseDotFileTaskType(type, mode) {
        var index = 1;
        var data = (0, helpers_1.loadFile)(this.dotPath);
        var nodes = [];
        var links = [];
        data === null || data === void 0 ? void 0 : data.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes(type) && !lineData[0].includes("label")) {
                const recipeName = lineData[0].replace("." + type, "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].split(".")[0].replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
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
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");
                var recipeNameData = lineData[0].split(".");
                var recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();
                var label = lineData[2].replace("[", "").replace("]", "").replace("label=", "").replace('"', "").replace('"', "").trim();
                var labelData = label.split(/\\n|:/);
                var recipePath = labelData[labelData.length - 1];
                if (!nodes.some(rn => rn.getName() == recipeName)) {
                    const node = new Node_1.Node(index, recipeName);
                    node.setRecipe(recipePath);
                    if (mode === "licenses") {
                        node.setLicense((0, recipe_parser_1.parseRecipe)((0, helpers_1.getRecipePath)(recipePath)).licence);
                    }
                    nodes.push(node);
                    index++;
                }
                else {
                    nodes.find(rn => rn.getName() == recipeName).setRecipe(recipePath);
                }
            }
        });
        return this.generateGraphJSON(nodes, links);
    }
    generateGraphJSON(nodes, links) {
        var graph = new typescript_map_1.TSMap();
        graph.set("nodes", nodes);
        graph.set("links", links);
        return JSON.stringify(graph.toJSON());
    }
}
exports.DotParser = DotParser;


/***/ }),
/* 9 */
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
/* 10 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Link = void 0;
class Link {
    /**
     *
     */
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}
exports.Link = Link;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Node = void 0;
class Node {
    /**
     *
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.recipe = "";
        this.license = "";
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getRecipe() {
        return this.recipe;
    }
    setRecipe(recipe) {
        this.recipe = recipe;
    }
    getLicense() {
        return this.license;
    }
    setLicense(license) {
        this.license = license;
    }
}
exports.Node = Node;


/***/ }),
/* 12 */
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
const fs_1 = __webpack_require__(6);
const vscode = __webpack_require__(1);
const extension_1 = __webpack_require__(0);
const Node_1 = __webpack_require__(11);
class VisualizationPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (VisualizationPanel.currentPanel) {
            VisualizationPanel.currentPanel._panel.reveal(column);
            VisualizationPanel.currentPanel._update();
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(VisualizationPanel.viewType, "Visualization", column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            retainContextWhenHidden: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "media"),
                vscode.Uri.joinPath(extensionUri, "out/compiled"),
            ],
        });
        VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
    }
    static kill() {
        var _a;
        (_a = VisualizationPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.dispose();
        VisualizationPanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri) {
        VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
    }
    dispose() {
        VisualizationPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        return __awaiter(this, void 0, void 0, function* () {
            const webview = this._panel.webview;
            this._panel.webview.html = this._getHtmlForWebview(webview);
            webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
                switch (data.command) {
                    case "select-node-v": {
                        console.log("Name: " + data.name);
                        if (!data.name) {
                            return;
                        }
                        vscode.window.showInformationMessage(data.name);
                        var selectedNode = new Node_1.Node(data.id, data.name);
                        selectedNode.setRecipe(data.recipe);
                        console.log(data);
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
                        (0, extension_1.showLegend)(data.legend);
                        console.log(data.legend);
                        break;
                    }
                }
            }));
        });
    }
    getWebView() {
        return this._panel.webview;
    }
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "visualization.js"));
        // Local path to css styles
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        //const cssUri = webview.asWebviewUri(
        //  vscode.Uri.joinPath(this._extensionUri, "out", "compiled/hello.css")
        //);
        //
        //// Use a nonce to only allow specific scripts to be run
        const nonce = (0, extension_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesMainUri}" rel="stylesheet">
				<link href="${stylesResetUri}" rel="stylesheet">
                <script nonce="${nonce}"> </script>
			</head>
            <body>
                <div class="chart">
                    <div id="visualization"></div>
                    <input type="hidden" id="graph" name="graph" value='${VisualizationPanel.graphString}''>
                    <input type="hidden" id="mode" name="mode" value='${VisualizationPanel.mode}''>
                    <input type="hidden" id="distance" value="${VisualizationPanel.distance}">
                    <input type="hidden" id="iterations" value="${VisualizationPanel.iterations}">
                    <input type="hidden" id="strength" value="${VisualizationPanel.strength}">
                    <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                    <script nonce="${nonce}"></script>
                </div>
			</body>
			</html>`;
    }
}
exports.VisualizationPanel = VisualizationPanel;
VisualizationPanel.viewType = "visualization";


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemovedTreeDataProvider = void 0;
const vscode = __webpack_require__(1);
const NodeTreeItem_1 = __webpack_require__(14);
class RemovedTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
    addNode(label, recipe) {
        this.data.push(new NodeTreeItem_1.NodeTreeItem(label, recipe, 0));
        console.log(this.data);
    }
    removeNode(label) {
        var index = this.data.findIndex((node) => node.label === label);
        this.data.splice(index, 1);
    }
    clearAllNodes() {
        this.data = [];
    }
}
exports.RemovedTreeDataProvider = RemovedTreeDataProvider;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NodeTreeItem = void 0;
const vscode = __webpack_require__(1);
class NodeTreeItem extends vscode.TreeItem {
    constructor(label, recipe, is_removed, children) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.children = children;
        this.recipe = recipe;
        this.is_removed = is_removed;
        this.tooltip = this.recipe;
    }
}
exports.NodeTreeItem = NodeTreeItem;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConnectionsTreeDataProvider = void 0;
const vscode = __webpack_require__(1);
const NodeTreeItem_1 = __webpack_require__(14);
class ConnectionsTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
    updateNodes(nodeData) {
        nodeData.forEach(node => {
            this.data.push(new NodeTreeItem_1.NodeTreeItem(node.name, node.recipe, node.is_removed));
        });
    }
    clearAllNodes() {
        this.data = [];
    }
}
exports.ConnectionsTreeDataProvider = ConnectionsTreeDataProvider;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Legend = void 0;
const vscode = __webpack_require__(1);
const extension_1 = __webpack_require__(0);
class Legend {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.selectedNode = null;
    }
    revive(panel) {
        this._view = panel;
    }
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    showLegend(legendData) {
        var _a;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "show-legend-s",
            legend: legendData
        });
    }
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "legend.js"));
        // Local path to css styles
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        //// Use a nonce to only allow specific scripts to be run
        const nonce = (0, extension_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
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