"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectNode = exports.setLegendData = exports.exportSVG = exports.returnToVisualization = exports.addNodeToRemoved = exports.createVizualization = exports.activate = void 0;
const vscode = require("vscode");
const Sidebar_1 = require("./view/Sidebar");
const fs_1 = require("fs");
const DotParser_1 = require("./parser/DotParser");
const VisualizationPanel_1 = require("./view/VisualizationPanel");
const RemovedTreeDataProvider_1 = require("./tree_providers/RemovedTreeDataProvider");
const constants_1 = require("./support/constants");
const helpers_1 = require("./support/helpers");
const ConnectionsTreeDataProvider_1 = require("./tree_providers/ConnectionsTreeDataProvider");
const Legend_1 = require("./view/Legend");
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
            var recipePath = (0, helpers_1.getRecipePath)(item.getRecipe());
            vscode.workspace.openTextDocument(recipePath).then(document => vscode.window.showTextDocument(document));
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
    visualizationPanel.createOrShow(extensionUri);
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
//# sourceMappingURL=extension.js.map