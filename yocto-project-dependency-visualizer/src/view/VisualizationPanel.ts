import { writeFileSync } from "fs";
import * as vscode from "vscode";
import { selectNode, setLegendData } from "../extension";
import { getNonce } from "../support/helpers";
import { Node } from "../model/Node";

/**
 * Class representing a panel (tab) with visualization
 */
export class VisualizationPanel {

    /**
     * Identifies the type of the WebView panel.
     */
    public readonly viewType = "visualization";

    /**
     * WebViewPanel instance.
     */
    private _panel: vscode.WebviewPanel | undefined;

    /**
     * Extension URI.
     */
    private readonly _extensionUri: vscode.Uri;

    /**
     * List of disposables, which should be disposed when the panel is disposed.
     */
    private _disposables: vscode.Disposable[] = [];

    /**
     * JSON string with graph data.
     */
    private graphString: string | undefined;

    /**
     * Mode of analysis.
     */
    private mode: string | undefined;

    /**
     * Distance between the nodes (for the force directed algorithm).
     */
    private distance: number | undefined;

    /**
     * Number of iterations (for the force directed algorithm).
     */
    private iterations: number | undefined;

    /**
     * Strength of the force between nodes (for the force directed algorithm).
     */
    private strength: number | undefined;

    /**
     * Stores if window is shown.
     */
    private isShown: boolean = false;

    /**
     * Creates and show a panel or just show if already exists.
     * @param extensionUri Extension URI.
     * @returns void
     */
    public createAndShow(extensionUri: vscode.Uri): void {
        this.dispose();
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        const panel = vscode.window.createWebviewPanel(
            this.viewType,
            "Visualization",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [ // only scripts and css file from these folders can be used
                    vscode.Uri.joinPath(extensionUri, "src", "js_scripts"),
                    vscode.Uri.joinPath(extensionUri, "styles"),
                ],
            }
        );

        panel.webview.html = this._getHtmlForWebview(panel.webview)
        this.initMessageReciever(panel);

        panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel = panel;
        this.isShown = true;
    }

    //public static kill() {
    //    VisualizationPanel.currentPanel?.dispose();
    //    VisualizationPanel.currentPanel = undefined;
    //}
    //
    //public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    //    VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
    //}

    /**
     * Initialize panel class.
     * @param extensionUri Extension URI.
     */
    public constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    /**
     * Update visualization data of  the panel.
     * @param graphString JSON string with graph data.
     * @param mode Mode of analysis.
     * @param distance Distance between the nodes (for the force directed algorithm).
     * @param iterations Number of iterations (for the force directed algorithm).
     * @param strength Strength of the force between nodes (for the force directed algorithm).
     */
    public updateData(graphString: string, mode: string, distance: number, iterations: number, strength: number) {
        this.graphString = graphString;
        this.mode = mode;
        this.distance = distance;
        this.iterations = iterations;
        this.strength = strength;
    }

    /**
     * Initialize actions for different messages.
     * @param panel WebView panel.
     */
    private initMessageReciever(panel: vscode.WebviewPanel) {
        panel.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case "select-node-v": {
                    if (!data.name) {
                        return;
                    }

                    var selectedNode = new Node(data.id, data.name);
                    selectedNode.setRecipe(data.recipe);

                    selectNode(selectedNode, data.used_by, data.requested, data.affected);

                    break;
                }
                case "export-svg-v": {
                    if (!data.svg) {
                        return;
                    }
                    vscode.window.showSaveDialog({ filters: { "Images": ["svg"] } }).then(file => {
                        if (file !== undefined) {
                            writeFileSync(file.fsPath, '<?xml version="1.0" standalone="no"?>\r\n' + data.svg);
                        }
                    });

                    break;
                }
                case "show-legend-v": {
                    setLegendData(data.legend);

                    break;
                }
            }
        });
    }

    /**
     * Close the panel and clear resources.
     */
    private dispose() {
        this._panel?.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }

        this.isShown = false;
    }

    /**
     * Send message to the visualization.js file that the node with given ID should be removed.
     * @param id ID of the node which should be removed.
     */
    public removeNode(id: number) {
        this._panel?.webview.postMessage({
            command: "remove-node-v",
            id: id
        });
    }

    /**
     * Send message to the visualization.js file that the node with given ID should be returned
     * to visualization.
     * @param name Name of the node which should be returned to visualization.
     */
    public returnNode(name: string) {
        this._panel?.webview.postMessage({
            command: "return-node-v",
            name: name
        });
    }

    /**
     * Send message to the visualization.js file that the SVG should be exported.
     */
    public callExportSVG() {
        this._panel?.webview.postMessage({
            command: "call-export-svg-v"
        });
    }

    /**
     * Send message to the visualization.js file that nodes with search string in names should be highlighted.
     * @param search String which should be used to search for nodes.
     */
    public findNodes(search: string) {
        this._panel?.webview.postMessage({
            command: "find-nodes-v",
            search: search
        });
    }

    /**
     * Send message to the visualization.js file that the node from the TreeView should be selected.
     * @param name Name of the node which should be selected.
     */
    public selectNodeFromList(name: string) {
        this._panel?.webview.postMessage({
            command: "select-node-from-list-v",
            name: name
        });
    }

    /**
     * Gets if window is shown.
     * @returns false if window in not shown else true.
     */
    public isWindowShown() {
        return this.isShown;
    }

    /**
     * Create HTML content of the WebView.
     * @param webview WebView instance.
     * @returns HTML content.
     */
    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "src", "js_scripts", "visualization.js")
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
                    <div class="chart">
                        <div id="visualization"></div>
                        <input type="hidden" id="graph" name="graph" value='${this.graphString}''>
                        <input type="hidden" id="mode" name="mode" value='${this.mode}''>
                        <input type="hidden" id="distance" value="${this.distance}">
                        <input type="hidden" id="iterations" value="${this.iterations}">
                        <input type="hidden" id="strength" value="${this.strength}">
                        <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                    </div>
			    </body>
			</html>`;
    }
}
