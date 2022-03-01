import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Sidebar } from './view/Sidebar';
import { existsSync, writeFileSync } from 'fs';
import { DotParser } from './parser/DotParser';
import { VisualizationPanel } from './view/VisualizationPanel';

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

export function createVizualization(extensionUri: vscode.Uri) {
    if (vscode.workspace.workspaceFolders !== undefined) {
        const dotPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/task-depends.dot";
        if (!existsSync(dotPath)) {
            console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);
            callBitbake(vscode.workspace.workspaceFolders[0].uri.fsPath);
        }

        var dotParser = new DotParser(dotPath);
        var graphString = dotParser.parseDotFile();
        writeFileSync(vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/graph.json", graphString);
        VisualizationPanel.graphString = graphString;
    }
    
    VisualizationPanel.createOrShow(extensionUri);
}

export function activate(context: vscode.ExtensionContext) {
	const sidebar = new Sidebar(context.extensionUri); 
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
			createVizualization(context.extensionUri);
		})
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
		  "vizualization-sidebar",
		  sidebar
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
