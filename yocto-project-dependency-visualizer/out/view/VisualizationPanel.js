"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualizationPanel = void 0;
const fs_1 = require("fs");
const vscode = require("vscode");
const extension_1 = require("../extension");
const helpers_1 = require("../support/helpers");
const Node_1 = require("../parser/Node");
/**
 * Class representing a panel (tab) with visualization
 */
class VisualizationPanel {
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
    constructor(extensionUri) {
        /**
         * Identifies the type of the WebView panel.
         */
        this.viewType = "visualization";
        /**
         * List of disposables, which should be disposed when the panel is disposed.
         */
        this._disposables = [];
        this._extensionUri = extensionUri;
    }
    /**
     * Creates and show a panel or just show if already exists.
     * @param extensionUri Extension URI.
     * @returns void
     */
    createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (this._panel) {
            this._panel.reveal(column);
            this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
            return;
        }
        const panel = vscode.window.createWebviewPanel(this.viewType, "Visualization", column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "src", "js_scripts"),
                vscode.Uri.joinPath(extensionUri, "styles"),
            ],
        });
        panel.webview.html = this._getHtmlForWebview(panel.webview);
        this.initMessageReciever(panel);
        panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel = panel;
    }
    /**
     * Update visualization data of  the panel.
     * @param graphString JSON string with graph data.
     * @param mode Mode of analysis.
     * @param distance Distance between the nodes (for the force directed algorithm).
     * @param iterations Number of iterations (for the force directed algorithm).
     * @param strength Strength of the force between nodes (for the force directed algorithm).
     */
    updateData(graphString, mode, distance, iterations, strength) {
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
    initMessageReciever(panel) {
        panel.webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
            switch (data.command) {
                case "select-node-v": {
                    if (!data.name) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.name);
                    var selectedNode = new Node_1.Node(data.id, data.name);
                    selectedNode.setRecipe(data.recipe);
                    (0, extension_1.selectNode)(selectedNode, data.used_by, data.requested, data.affected);
                    break;
                }
                case "export-svg-v": {
                    if (!data.svg) {
                        return;
                    }
                    vscode.window.showSaveDialog({ filters: { "Images": ["svg"] } }).then(file => {
                        if (file !== undefined) {
                            (0, fs_1.writeFileSync)(file.fsPath, '<?xml version="1.0" standalone="no"?>\r\n' + data.svg);
                        }
                    });
                    break;
                }
                case "show-legend-v": {
                    (0, extension_1.setLegendData)(data.legend);
                    break;
                }
            }
        }));
    }
    /**
     * Close the panel and clear resources.
     */
    dispose() {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    /**
     * Send message to the visualization.js file that the node with given ID should be removed.
     * @param id ID of the node which should be removed.
     */
    removeNode(id) {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "remove-node-v",
            id: id
        });
    }
    /**
     * Send message to the visualization.js file that the node with given ID should be returned
     * to visualization.
     * @param name Name of the node which should be returned to visualization.
     */
    returnNode(name) {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "return-node-v",
            name: name
        });
    }
    /**
     * Send message to the visualization.js file that the SVG should be exported.
     */
    callExportSVG() {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "call-export-svg-v"
        });
    }
    /**
     * Send message to the visualization.js file that the node from the TreeView should be selected.
     * @param name Name of the node which should be selected.
     */
    selectNodeFromList(name) {
        var _a;
        (_a = this._panel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "select-node-from-list-v",
            name: name
        });
    }
    /**
     * Create HTML content of the WebView.
     * @param webview WebView instance.
     * @returns HTML content.
     */
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "js_scripts", "visualization.js"));
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "styles", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "styles", "vscode.css"));
        const nonce = (0, helpers_1.getNonce)();
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
exports.VisualizationPanel = VisualizationPanel;
//# sourceMappingURL=VisualizationPanel.js.map