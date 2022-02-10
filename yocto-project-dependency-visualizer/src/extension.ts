import * as vscode from 'vscode';
import * as cp from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { DotParser } from './parser/DotParser';
import { VisualizationPanel } from './panel/VisualizationPanel';

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

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
			
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
			
			VisualizationPanel.createOrShow(context.extensionUri);
		})
	);
}

export function deactivate() {}

//function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
//	return {
//		// Enable javascript in the webview
//		enableScripts: true,
//
//		// And restrict the webview to only loading content from our extension's `media` directory.
//		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
//	};
//}

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
