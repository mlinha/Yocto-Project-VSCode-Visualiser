"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Legend = void 0;
const vscode = require("vscode");
const helpers_1 = require("../support/helpers");
/**
 * Class representing a legend in the sidebar.
 */
class Legend {
    //public revive(panel: vscode.WebviewView) {
    //    this._view = panel;
    //}
    /**
     * Create an instance of the Legend.
     * @param _extensionUri Extension URI.
     */
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.legendData = [];
    }
    /**
     * Revolves a webview view.
     * resolveWebviewView is called when a view first becomes visible.
     * This may happen when the view is first loaded or when the user hides and then shows a view again.
     * @param webviewView Webview view to restore. The provider should take ownership of this view.
     * The provider must set the webview's .html and hook up all webview events it is interested in.
     */
    resolveWebviewView(webviewView) {
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
        this.showLegend();
    }
    /**
     * Set list of legend elements.
     * @param legendData List of legend elements.
     */
    setLegendData(legendData) {
        this.legendData = legendData;
    }
    /**
     * Send message with list of legend elements to the legend.js file.
     */
    showLegend() {
        var _a;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            command: "show-legend-s",
            legend: this.legendData
        });
    }
    /**
     * Create HTML content of the WebView.
     * @param webview WebView instance.
     * @returns HTML content.
     */
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "js_scripts", "legend.js"));
        // Local path to css styles
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "styles", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "styles", "vscode.css"));
        //// Use a nonce to only allow specific scripts to be run
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
                    <div id="legend">
                        <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                    <div>
			    </body>
			</html>`;
    }
}
exports.Legend = Legend;
//# sourceMappingURL=Legend.js.map