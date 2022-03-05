import * as vscode from "vscode";
import { addNodeToTree, createVizualization, getNonce } from "../extension";
import { Node } from "../parser/Node";

export class Sidebar implements vscode.WebviewViewProvider {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    private readonly _extensionUri: vscode.Uri;
    private selectedNode: Node | null;


    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    constructor(_extensionUri: vscode.Uri) {
        this._extensionUri = _extensionUri;
        this.selectedNode = null;
    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case "visualize-s": {
                    createVizualization(this._extensionUri);
                    break;
                }
                case "remove-selected-s": {
                    if (this.selectedNode === null) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }

                    addNodeToTree(this.selectedNode.getName(), this.selectedNode.getId());
                    this.clearSelectedNode();

                    break;
                }
                case "open-selected-recipe-s": {
                    if (this.selectedNode === null) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }

                    var recipePath = this.selectedNode.getRecipe();

                    if (vscode.workspace.workspaceFolders !== undefined) {
                        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                        if (workspacePath.includes("wsl")) {
                            const pathData = workspacePath.replace("\\\\", "").split("\\");
                            console.log(pathData);
                            recipePath = "\\\\" + pathData[0] + "\\" + pathData[1] + "\\" + this.selectedNode.getRecipe().replace("/", "\\");
                            console.log(recipePath);
                        }
                    }

                    console.log(recipePath);

                    vscode.workspace.openTextDocument(recipePath).then(
                        document => vscode.window.showTextDocument(document));

                    break;
                }
            }
        });
    }

    public selectNode(node: Node) {
        this.selectedNode = node;
        this._view?.webview.postMessage({
            command: "select-node-s",
            name: node.getName()
        });
    }

    public clearSelectedNode() {
        this.selectedNode = null;

        this._view?.webview.postMessage({
            command: "clear-selected-node-s",
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.js")
        );

        // Local path to css styles

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "reset.css"
        ));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "vscode.css"
        ));
        //const cssUri = webview.asWebviewUri(
        //  vscode.Uri.joinPath(this._extensionUri, "out", "compiled/hello.css")
        //);
        //
        //// Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

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
                    <button type="button" id="generate">Visualize</button>
                    <hr>
                    <h4>Selected node:</h4>
                    <div id="selected-name" style="color:green">-none-</div>
                    <br>
                    <button type="button" id="remove-selected">Remove</button>
                    <button type="button" id="open-recipe">Open recipe</button>
                    <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                <div>
			</body>
			</html>`;
    }
}
