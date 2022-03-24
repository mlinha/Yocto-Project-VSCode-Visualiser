import * as vscode from "vscode";
import { default_distance, default_iterations, default_strength } from "../constants";
import { addNodeToRemoved, createVizualization, getNonce } from "../extension";
import { getRecipePath } from "../helpers";
import { Node } from "../parser/Node";
import { parseRecipe } from "../parser/recipe_parser";

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
                    if (data.distance == "" || data.iterations == "" || data.strength == "") {
                        vscode.window.showErrorMessage("Invalid force settings!");
                        return;
                    }
                    createVizualization(this._extensionUri, data.type, data.distance, data.iterations, data.strength);
                    break;
                }
                case "remove-selected-s": {
                    if (this.selectedNode === null) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }

                    addNodeToRemoved(this.selectedNode.getName(), this.selectedNode.getRecipe(), this.selectedNode.getId());
                    this.clearSelectedNode();

                    break;
                }
                case "open-selected-recipe-s": {
                    if (this.selectedNode === null) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }

                    var recipePath = getRecipePath(this.selectedNode.getRecipe());

                    vscode.workspace.openTextDocument(recipePath).then(
                        document => vscode.window.showTextDocument(document));

                    break;
                }
            }
        });
    }

    public selectNode(node: Node) {
        this.selectedNode = node;

        var recipePath = getRecipePath(this.selectedNode.getRecipe());
        var additionalInfo = parseRecipe(recipePath);

        this._view?.webview.postMessage({
            command: "select-node-s",
            name: node.getName(),
            recipe: node.getRecipe(),
            licence: additionalInfo.licence
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
                    <br>
                    <br>
                    <h4>Force link distance:</h4>
                    <input id="distance" type="number" value="${default_distance}"></input>
                    <h4>Force link iterations:</h4>
                    <input id="iterations" type="number" value="${default_iterations}"></input>
                    <h4>Force node strength (repulsion):</h4>
                    <input id="strength" type="number" value="${default_strength}"></input>
                    <br>
                    <br>
                    <button type="button" id="generate">Visualize</button>
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
