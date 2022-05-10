import * as vscode from 'vscode';
import { Sidebar } from './view/Sidebar';
import { existsSync, writeFileSync } from 'fs';
import { DotParser } from './parser/DotParser';
import { VisualizationPanel } from './view/VisualizationPanel';
import { RemovedTreeDataProvider } from "./tree_providers/RemovedTreeDataProvider"
import { Node } from './model/Node';
import { DEFAULT_DISTANCE, DEFAULT_ITERATIONS, DEFAULT_MODE, DEFAULT_STRENGTH, DEFAULT_TYPE } from './support/constants';
import { getRecipePath, openRecipe } from './support/helpers';
import { NodeTreeItem } from './tree_providers/NodeTreeItem';
import { ConnectionsTreeDataProvider } from './tree_providers/ConnectionsTreeDataProvider';
import { Legend } from './view/Legend';

/**
 * Tree data provider for removed nodes TreeView
 */
var removedTreeDataProvider: RemovedTreeDataProvider;

/**
 * Tree data provider for nodes that depend on the selected node TreeView
 */
var usedByTreeDataProvider: ConnectionsTreeDataProvider;

/**
 * Tree data provider for nodes that the selected node depends on TreeView
 */
var requestedTreeDataProvider: ConnectionsTreeDataProvider;

/**
 * Tree data provider for affected nodes TreeView
 */
var affectedTreeDataProvider: ConnectionsTreeDataProvider;

/**
 * Sidebar menu
 */
var sidebar: Sidebar;

/**
 * Legend in the sidebar
 */
var legend: Legend;

/**
 * Main visualization panel
 */
var visualizationPanel: VisualizationPanel;

/**
 * Activate the extension. Register commands and views.
 * @param context Extension context.
 */
export function activate(context: vscode.ExtensionContext) {
	sidebar = new Sidebar(context.extensionUri);
	legend = new Legend(context.extensionUri);
	visualizationPanel = new VisualizationPanel(context.extensionUri);

	removedTreeDataProvider = new RemovedTreeDataProvider();
	usedByTreeDataProvider = new ConnectionsTreeDataProvider();
	requestedTreeDataProvider = new ConnectionsTreeDataProvider();
	affectedTreeDataProvider = new ConnectionsTreeDataProvider();

	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
			createVizualization(context.extensionUri, DEFAULT_TYPE, DEFAULT_DISTANCE, DEFAULT_ITERATIONS, DEFAULT_STRENGTH, DEFAULT_MODE);
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.returnNode', (item: NodeTreeItem) => {
			if (item.label?.toString() !== undefined) {
				returnToVisualization(item.label.toString());
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.openRecipe', (item: NodeTreeItem) => {
			if (item.getRecipe()?.toString() !== undefined) {
				openRecipe(item.getRecipe())
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.selectNodeFromList', (item: NodeTreeItem) => {
			if (item.isRemoved() === 1) {
				vscode.window.showErrorMessage("Node is in the \"Removed nodes\" list so it cannot be selected!");
			}
			else if (item.label?.toString() !== undefined) {
				selectNodeFromList(item.label.toString());
			}
		})
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"visualization-sidebar",
			sidebar,
			{
				webviewOptions:
				{
					retainContextWhenHidden: true
				}
			}
		)
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"visualization-legend",
			legend,
			{
				webviewOptions:
				{
					retainContextWhenHidden: true
				}
			}
		)
	);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"removed-list",
			removedTreeDataProvider
		)
	);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"used-by-list",
			usedByTreeDataProvider
		)
	);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"requested-list",
			requestedTreeDataProvider
		)
	);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"affected-list",
			affectedTreeDataProvider
		)
	);

	vscode.commands.executeCommand('setContext', 'showAffected', false);
	vscode.commands.executeCommand('setContext', 'showLegend', false);
}

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
function selectNodeFromList(name: string) {
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
export function createVizualization(extensionUri: vscode.Uri, type: string, distance: number, iterations: number, strength: number, mode: string): void {
	var graphString = "";
	if (vscode.workspace.workspaceFolders !== undefined) {
		const dotPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/task-depends.dot";
		if (!existsSync(dotPath)) {
			//callBitbake(vscode.workspace.workspaceFolders[0].uri.fsPath);
			vscode.window.showErrorMessage(".dot file not found in first workspace folder! Make sure Yocto Project directory is in the first folder of the workspace!");

			return;
		}

		var dotParser = new DotParser(dotPath);
		graphString = dotParser.parseDotFile(type, mode);
		writeFileSync(vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/graph.json", graphString);
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

/**
 * Add node to the removed nodes TreeView.
 * @param name Name of the node to be removed.
 * @param recipe Path to the recipe of the node to be removed.
 * @param id ID of the node to be removed.
 */
export function addNodeToRemoved(name: string, recipe: string, id: number) {
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

/**
 * Return node from the TreeView of removed nodes back to visualization.
 * @param name Name of the node to be removed.
 */
export function returnToVisualization(name: string) {
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

/**
 * Export the visualization SVG.
 */
export function exportSVG() {
	visualizationPanel.callExportSVG();
}

/**
 * Find nodes in visualization with a given search string.
 * @param seach String which should be used to search for nodes.
 */
export function findNodes(seach: string) {
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

/**
 * Set data for the legend.
 * @param legendData Legend data to be set.
 */
export function setLegendData(legendData: { license: string; color: string; }[]) {
	legend.setLegendData(legendData);
	legend.showLegend();
}

/**
 * Select node from visualization.
 * @param node Node to be selected.
 * @param used_by List of nodes that request the selected node.
 * @param requested List of nodes that the selected node reauests.
 * @param affected List of node directly or inderectly depenedent on the selected node.
 */
export function selectNode(node: Node, used_by: { name: string; recipe: string; is_removed: number; }[],
	requested: { name: string; recipe: string; is_removed: number; }[], affected: { name: string; recipe: string; is_removed: number; }[]) {
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
