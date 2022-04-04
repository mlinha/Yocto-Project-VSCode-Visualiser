import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Sidebar } from './view/Sidebar';
import { existsSync, writeFileSync } from 'fs';
import { DotParser } from './parser/DotParser';
import { VisualizationPanel } from './view/VisualizationPanel';
import { RemovedTreeDataProvider } from "./RemovedTreeDataProvider"
import { Node } from './parser/Node';
import { default_distance, default_iterations, default_mode, default_strength, default_type } from './constants';
import { getRecipePath } from './helpers';
import { NodeTreeItem } from './NodeTreeItem';
import { ConnectionsTreeDataProvider } from './ConnectionsTreeDataProvider';
import { Legend } from './view/Legend';

var removedTreeDataProvider: RemovedTreeDataProvider;
var usedByTreeDataProvider: ConnectionsTreeDataProvider;
var requestedTreeDataProvider: ConnectionsTreeDataProvider;
var affectedTreeDataProvider: ConnectionsTreeDataProvider;
var sidebar: Sidebar;
var legend: Legend;



export function activate(context: vscode.ExtensionContext) {
	sidebar = new Sidebar(context.extensionUri);
	legend = new Legend(context.extensionUri);

	removedTreeDataProvider = new RemovedTreeDataProvider();
	usedByTreeDataProvider = new ConnectionsTreeDataProvider();
	requestedTreeDataProvider = new ConnectionsTreeDataProvider();
	affectedTreeDataProvider = new ConnectionsTreeDataProvider();

	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
			createVizualization(context.extensionUri, default_type, default_distance, default_iterations, default_strength, default_mode);
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
			if (item.recipe?.toString() !== undefined) {
				var recipePath = getRecipePath(item.recipe);

				vscode.workspace.openTextDocument(recipePath).then(
					document => vscode.window.showTextDocument(document));
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.selectNodeFromList', (item: NodeTreeItem) => {
			if (item.is_removed === 1) {
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
			sidebar
		)
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"visualization-legend",
			legend
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

export function deactivate() { }

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function callBitbake(path: string) {
	// use linux cd
	cp.exec('pushd' + path + " && dir", (err: any, stdout: any, stderr: any) => {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		if (err) {
			console.log('error: ' + err);
		}
	});
}

function selectNodeFromList(name: string) {
	VisualizationPanel.currentPanel?.getWebView().postMessage({
		command: "select-node-from-list-v",
		name: name
	});
}

export function createVizualization(extensionUri: vscode.Uri, type: string, distance: number, iterations: number, strength: number, mode: string) {
	if (vscode.workspace.workspaceFolders !== undefined) {
		const dotPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/task-depends.dot";
		if (!existsSync(dotPath)) {
			console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);
			callBitbake(vscode.workspace.workspaceFolders[0].uri.fsPath);
		}

		var dotParser = new DotParser(dotPath);
		var graphString = dotParser.parseDotFile(type, mode);
		writeFileSync(vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/graph.json", graphString);
		VisualizationPanel.graphString = graphString;
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

	VisualizationPanel.mode = mode;

	VisualizationPanel.distance = distance;
	VisualizationPanel.iterations = iterations;
	VisualizationPanel.strength = strength;

	removedTreeDataProvider.clearAllNodes();
	removedTreeDataProvider.refresh();
	VisualizationPanel.kill();

	sidebar.clearSelectedNode();

	usedByTreeDataProvider.clearAllNodes();
	requestedTreeDataProvider.clearAllNodes();
	affectedTreeDataProvider.clearAllNodes();

	usedByTreeDataProvider.refresh();
	requestedTreeDataProvider.refresh();
	affectedTreeDataProvider.refresh();

	VisualizationPanel.createOrShow(extensionUri);
}

export function addNodeToRemoved(name: string, recipe: string, id: number) {
	removedTreeDataProvider.addNode(name, recipe);
	removedTreeDataProvider.refresh();
	VisualizationPanel.currentPanel?.getWebView().postMessage({
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

	VisualizationPanel.currentPanel?.getWebView().postMessage({
		command: "return-node-v",
		name: "name"
	});
}

export function exportSVG() {
	VisualizationPanel.currentPanel?.getWebView().postMessage({
		command: "call-export-svg-v",
		name: "name"
	});
}

export function showLegend(legendData: { license: string;color: string; }[]) {
	legend.showLegend(legendData);
}

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
