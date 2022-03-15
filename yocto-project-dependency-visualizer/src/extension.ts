import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Sidebar } from './view/Sidebar';
import { existsSync, writeFileSync } from 'fs';
import { DotParser } from './parser/DotParser';
import { VisualizationPanel } from './view/VisualizationPanel';
import { NodeTreeItem, TreeDataProvider } from "./view/RecipeTreeDataProvider" 
import { Node } from './parser/Node';
import { default_distance, default_iterations, default_strength, default_type } from './constants';

var treeDataProvider: TreeDataProvider;
var sidebar: Sidebar;

export function activate(context: vscode.ExtensionContext) {
	sidebar = new Sidebar(context.extensionUri);
	treeDataProvider = new TreeDataProvider();
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
			createVizualization(context.extensionUri, default_type, default_distance, default_iterations, default_strength);
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.returnNode', (item: NodeTreeItem) => {
			if (item.label?.toString() !== undefined) {
				removeNodeFromTree(item.label?.toString());
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.openRecipe', (item: NodeTreeItem) => {
			if (item.recipe?.toString() !== undefined) {
				var recipePath = item.recipe;

                    if (vscode.workspace.workspaceFolders !== undefined) {
                        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                        if (workspacePath.includes("wsl")) {
                            const pathData = workspacePath.replace("\\\\", "").split("\\");
                            console.log(pathData);
                            recipePath = "\\\\" + pathData[0] + "\\" + pathData[1] + "\\" + item.recipe.replace("/", "\\");
                            console.log(recipePath);
                        }
                    }

                    console.log(recipePath);

                    vscode.workspace.openTextDocument(recipePath).then(
                        document => vscode.window.showTextDocument(document));
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
			"visualization-list",
			treeDataProvider
		  )
	);
}

export function deactivate() {}

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
    
	treeDataProvider.clearAllNodes();
	treeDataProvider.refresh();
	VisualizationPanel.kill();

	sidebar.clearSelectedNode();

    VisualizationPanel.createOrShow(extensionUri);
}

export function addNodeToTree(name: string, recipe: string, id: number) {
	treeDataProvider.addNode(name, recipe);
	treeDataProvider.refresh();
	VisualizationPanel.currentPanel?.getWebView().postMessage({
		command: "remove-node",
		id: id 
	});
}

export function removeNodeFromTree(name: string) {
	treeDataProvider.removeNode(name);
	treeDataProvider.refresh();
	VisualizationPanel.currentPanel?.getWebView().postMessage({
		command: "return-node",
		name: "name"
	});
}

export function selectNode(node: Node) {
	sidebar.selectNode(node);
}
