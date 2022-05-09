import * as vscode from "vscode";
import { DEFAULT_DISTANCE, DEFAULT_ITERATIONS, DEFAULT_STRENGTH } from "../support/constants";
import { addNodeToRemoved, createVizualization, exportSVG, findNodes } from "../extension";
import { getNonce, getRecipePath } from "../support/helpers";
import { Node } from "../model/Node";
import { parseRecipe } from "../parser/recipe_parser";

/**
 * Class representing a sidebar menu.
 */
export class Sidebar implements vscode.WebviewViewProvider {

    /**
     * Current WebViewView.
     */
    private _view?: vscode.WebviewView;
    //_doc?: vscode.TextDocument;

    /**
     * Extension URI.
     */
    private readonly _extensionUri: vscode.Uri;

    /**
     * Selected node from visualization.
     */
    private selectedNode: Node | undefined;


    //public revive(panel: vscode.WebviewView) {
    //    this._view = panel;
    //}

    /**
     * Create an instance of the Sidebar.
     * @param _extensionUri Extension URI. 
     */
    public constructor(_extensionUri: vscode.Uri) {
        this._extensionUri = _extensionUri;
    }

    /**
     * Revolves a webview view.
     * resolveWebviewView is called when a view first becomes visible.
     * This may happen when the view is first loaded or when the user hides and then shows a view again.
     * @param webviewView Webview view to restore. The provider should take ownership of this view. 
     * The provider must set the webview's .html and hook up all webview events it is interested in.
     */
    public resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, "src", "js_scripts"),
                vscode.Uri.joinPath(this._extensionUri, "styles"),
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case "visualize-s": {
                    if (data.distance == "" || data.iterations == "" || data.strength == "") {
                        vscode.window.showErrorMessage("Invalid force settings!");
                        return;
                    }
                    createVizualization(this._extensionUri, data.type, data.distance, data.iterations, data.strength, data.mode);
                    break;
                }
                case "remove-selected-s": {
                    if (!this.selectedNode) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }

                    addNodeToRemoved(this.selectedNode.getName(), this.selectedNode.getRecipe(), this.selectedNode.getId());
                    this.clearSelectedNode();

                    break;
                }
                case "open-selected-recipe-s": {
                    if (!this.selectedNode) {
                        vscode.window.showInformationMessage("No node selected!");
                        return;
                    }

                    var recipePath = getRecipePath(this.selectedNode.getRecipe());

                    vscode.workspace.openTextDocument(recipePath).then(
                        document => vscode.window.showTextDocument(document));

                    break;
                }
                case "call-export-svg-s": {
                    exportSVG();
                    break;
                }
                case "find-nodes-s": {
                    findNodes(data.search);
                    this.clearSelectedNode();
                    break;
                }
            }
        });
    }

    /**
     * Select a node from visualization. Set information to the sidebar.js file.
     * @param node Selected node.
     */
    public selectNode(node: Node) {
        this.selectedNode = node;

        var recipePath = getRecipePath(this.selectedNode.getRecipe());
        var license = this.selectedNode.getLicense();

        if (license === "") {
            license = parseRecipe(recipePath).license;
        }

        this._view?.webview.postMessage({
            command: "select-node-s",
            name: node.getName(),
            recipe: node.getRecipe(),
            licence: license
        });
    }

    /**
     * Clear information about selected node. Send this information to the sidebar.js file.
     */
    public clearSelectedNode() {
        this.selectedNode = undefined;

        this._view?.webview.postMessage({
            command: "clear-selected-node-s",
        });
    }

    /**
     * Create HTML content of the WebView.
     * @param webview WebView instance.
     * @returns HTML content.
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "src", "js_scripts", "sidebar.js")
        );

        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this._extensionUri,
            "styles",
            "reset.css"
        ));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this._extensionUri,
            "styles",
            "vscode.css"
        ));
        
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			    <head>
			    	<meta charset="UTF-8">
			    	<!--
			    		Use a content security policy to only allow loading images from https or from our extension directory,
			    		and only allow scripts that have a specific nonce.
                    -->
                    <meta http-equiv="Content-Security-Policy" content="style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
			    	<meta name="viewport" content="width=device-width, initial-scale=1.0">
			    	<link href="${stylesMainUri}" rel="stylesheet">
			    	<link href="${stylesResetUri}" rel="stylesheet">
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
                        <h4>Mode:</h4>
                        <select id="mode_type">
                            <option value="default">DEFAULT</option>
                            <option value="licenses">Licenses</option>
                            <option value="affected_nodes">Affected nodes</option>
                        </select>
                        <br>
                        <br>
                        <h4>Force link distance:</h4>
                        <input id="distance" type="number" value="${DEFAULT_DISTANCE}"></input>
                        <h4>Force link iterations:</h4>
                        <input id="iterations" type="number" value="${DEFAULT_ITERATIONS}"></input>
                        <h4>Force node strength (repulsion):</h4>
                        <input id="strength" type="number" value="${DEFAULT_STRENGTH}"></input>
                        <br>
                        <br>
                        <button type="button" id="generate">Visualize</button>
                        <button type="button" id="export">Export SVG</button>
                        <br>
                        <br>
                        <input id="search-box" placeholder="search-string"></input>
                        <button type="button" id="find-nodes">Find nodes</button>
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
