import * as vscode from "vscode";
import { createVizualization, getNonce } from "../extension";

export class Sidebar implements vscode.WebviewViewProvider {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
     _view?: vscode.WebviewView;
     _doc?: vscode.TextDocument;
     private readonly _extensionUri: vscode.Uri;


     public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    constructor(_extensionUri: vscode.Uri) {
        this._extensionUri = _extensionUri;
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
                case "visualize": {
                    createVizualization(this._extensionUri);
            }
        }});
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
                    <button type="button" id="generate">Click Me!</button>
                    <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                <div>
			</body>
			</html>`;
    }
}
