import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Sidebar } from './view/Sidebar';
import { existsSync, writeFileSync } from 'fs';
import { DotParser } from './parser/DotParser';
import { VisualizationPanel } from './view/VisualizationPanel';
import { RemovedTreeDataProvider } from "./RemovedTreeDataProvider"
import { Node } from './parser/Node';
import { default_distance, default_iterations, default_strength, default_type } from './constants';
import { getRecipePath } from './helpers';
import { NodeTreeItem } from './NodeTreeItem';
import { ConnectionsTreeDataProvider } from './ConnectionsTreeDataProvider';

var removedTreeDataProvider: RemovedTreeDataProvider;
var exportedTreeDataProvider: ConnectionsTreeDataProvider;
var requestedTreeDataProvider: ConnectionsTreeDataProvider;
var sidebar: Sidebar;

export function activate(context: vscode.ExtensionContext) {
	sidebar = new Sidebar(context.extensionUri);
	removedTreeDataProvider = new RemovedTreeDataProvider();
	exportedTreeDataProvider = new ConnectionsTreeDataProvider();
	requestedTreeDataProvider = new ConnectionsTreeDataProvider();
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
			createVizualization(context.extensionUri, default_type, default_distance, default_iterations, default_strength);
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
		vscode.window.registerTreeDataProvider(
			"removed-list",
			removedTreeDataProvider
		)
	);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"exported-list",
			exportedTreeDataProvider
		)
	);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"requested-list",
			requestedTreeDataProvider
		)
	);
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
		command: "select_node_from_list_v",
		name: name
	});
}

export function createVizualization(extensionUri: vscode.Uri, type: string, distance: number, iterations: number, strength: number) {
	if (vscode.workspace.workspaceFolders !== undefined) {
		const dotPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/task-depends.dot";
		if (!existsSync(dotPath)) {
			console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);
			callBitbake(vscode.workspace.workspaceFolders[0].uri.fsPath);
		}

		var dotParser = new DotParser(dotPath);
		var graphString = dotParser.parseDotFile(type);
		writeFileSync(vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/graph.json", graphString);
		VisualizationPanel.graphString = graphString;
	}

	VisualizationPanel.distance = distance;
	VisualizationPanel.iterations = iterations;
	VisualizationPanel.strength = strength;

	removedTreeDataProvider.clearAllNodes();
	removedTreeDataProvider.refresh();
	VisualizationPanel.kill();

	sidebar.clearSelectedNode();

	exportedTreeDataProvider.clearAllNodes();
	requestedTreeDataProvider.clearAllNodes();

	exportedTreeDataProvider.refresh();
	requestedTreeDataProvider.refresh();

	VisualizationPanel.createOrShow(extensionUri);
}

export function addNodeToRemoved(name: string, recipe: string, id: number) {
	removedTreeDataProvider.addNode(name, recipe);
	removedTreeDataProvider.refresh();
	VisualizationPanel.currentPanel?.getWebView().postMessage({
		command: "remove-node",
		id: id
	});

	exportedTreeDataProvider.clearAllNodes();
	requestedTreeDataProvider.clearAllNodes();

	exportedTreeDataProvider.refresh();
	requestedTreeDataProvider.refresh();
}

export function returnToVisualization(name: string) {
	removedTreeDataProvider.removeNode(name);
	removedTreeDataProvider.refresh();

	sidebar.clearSelectedNode();

	exportedTreeDataProvider.clearAllNodes();
	requestedTreeDataProvider.clearAllNodes();

	exportedTreeDataProvider.refresh();
	requestedTreeDataProvider.refresh();

	VisualizationPanel.currentPanel?.getWebView().postMessage({
		command: "return-node",
		name: "name"
	});
}

export function selectNode(node: Node, exported: { name: string; recipe: string; is_removed: number; }[], requested: { name: string; recipe: string; is_removed: number; }[]) {
	sidebar.selectNode(node);

	exportedTreeDataProvider.clearAllNodes();
	requestedTreeDataProvider.clearAllNodes();

	exportedTreeDataProvider.updateNodes(exported);
	requestedTreeDataProvider.updateNodes(requested);
	
	exportedTreeDataProvider.refresh();
	requestedTreeDataProvider.refresh();
}
