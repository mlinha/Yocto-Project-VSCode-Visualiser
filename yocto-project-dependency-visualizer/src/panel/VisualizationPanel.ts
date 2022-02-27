import { readFileSync } from "fs";
import * as vscode from "vscode";
import { getNonce } from "../extension";

export class VisualizationPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: VisualizationPanel | undefined;

  public static readonly viewType = "visualization";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static graphString: string;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (VisualizationPanel.currentPanel) {
      VisualizationPanel.currentPanel._panel.reveal(column);
      VisualizationPanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      VisualizationPanel.viewType,
      "Visualization",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );

    VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
  }

  public static kill() {
    VisualizationPanel.currentPanel?.dispose();
    VisualizationPanel.currentPanel = undefined;
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    VisualizationPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);

    webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case "open-file": {
          console.log("Message: " + data.filename)
          if (!data.filename) {
            return;
          }
          vscode.window.showInformationMessage(data.filename);
          //vscode.window.showTextDocument(data.filename);

          vscode.workspace.openTextDocument(data.filename).then(
            document => vscode.window.showTextDocument(document));
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
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
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource
      }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesMainUri}" rel="stylesheet">
				<link href="${stylesResetUri}" rel="stylesheet">
        <link href="" rel="stylesheet">
        <script nonce="${nonce}">
        </script>
			</head>
      <body>
      <h1>hello</h1>
      <div class="chart"></div>
      <svg id="Viz_area" height=200 width=450></svg>
      <input type="hidden" id="graph" name="graph" value='${VisualizationPanel.graphString}''>
      <script src="https://d3js.org/d3.v4.min.js" nonce="${nonce}"></script>
      <script src="http://viz-js.com/bower_components/viz.js/viz-lite.js" nonce="${nonce}"></script>
      <div id="my_dataviz"></div>
      <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
      <script nonce="${nonce}">
        
      </script>
			</body>
			</html>`;
  }
}
