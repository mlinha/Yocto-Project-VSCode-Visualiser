/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNonce = exports.deactivate = exports.activate = exports.createVizualization = void 0;
const vscode = __webpack_require__(1);
const cp = __webpack_require__(2);
const Sidebar_1 = __webpack_require__(9);
const fs_1 = __webpack_require__(3);
const DotParser_1 = __webpack_require__(4);
const VisualizationPanel_1 = __webpack_require__(8);
function callBitbake(path) {
    // use linux cd
    cp.exec('pushd' + path + " && dir", (err, stdout, stderr) => {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (err) {
            console.log('error: ' + err);
        }
    });
}
function createVizualization(extensionUri) {
    if (vscode.workspace.workspaceFolders !== undefined) {
        const dotPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/task-depends.dot";
        if (!(0, fs_1.existsSync)(dotPath)) {
            console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);
            callBitbake(vscode.workspace.workspaceFolders[0].uri.fsPath);
        }
        var dotParser = new DotParser_1.DotParser(dotPath);
        var graphString = dotParser.parseDotFile();
        (0, fs_1.writeFileSync)(vscode.workspace.workspaceFolders[0].uri.fsPath + "/build/graph.json", graphString);
        VisualizationPanel_1.VisualizationPanel.graphString = graphString;
    }
    VisualizationPanel_1.VisualizationPanel.createOrShow(extensionUri);
}
exports.createVizualization = createVizualization;
function activate(context) {
    const sidebar = new Sidebar_1.Sidebar(context.extensionUri);
    context.subscriptions.push(vscode.commands.registerCommand('yocto-project-dependency-visualizer.generateVisualization', () => {
        createVizualization(context.extensionUri);
    }));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("vizualization-sidebar", sidebar));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DotParser = void 0;
const fs_1 = __webpack_require__(3);
const typescript_map_1 = __webpack_require__(5);
const Link_1 = __webpack_require__(6);
const Node_1 = __webpack_require__(7);
class DotParser {
    constructor(dotPath) {
        this.dotPath = dotPath;
    }
    loadDotFile() {
        var data;
        try {
            data = (0, fs_1.readFileSync)(this.dotPath, "utf8");
        }
        catch (err) {
            console.error(err);
        }
        return data === null || data === void 0 ? void 0 : data.split("\n");
    }
    parseDotFile() {
        var index = 1;
        var data = this.loadDotFile();
        var nodes = [];
        var links = [];
        data === null || data === void 0 ? void 0 : data.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes("do_prepare_recipe_sysroot") && !lineData[0].includes("label") && !lineData[1].includes("do_fetch")) {
                const recipeName = lineData[0].replace(".do_prepare_recipe_sysroot", "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].replace(".do_populate_sysroot", "").replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
                    var source;
                    var target;
                    if (!nodes.some(rn => rn.getName() == recipeName)) {
                        nodes.push(new Node_1.Node(index, recipeName));
                        source = index;
                        index++;
                    }
                    else {
                        source = nodes.find(rn => rn.getName() == recipeName).getId();
                    }
                    if (!nodes.some(rn => rn.getName() == dependentRecipeName)) {
                        nodes.push(new Node_1.Node(index, dependentRecipeName));
                        target = index;
                        index++;
                    }
                    else {
                        target = nodes.find(rn => rn.getName() == dependentRecipeName).getId();
                    }
                    const link = new Link_1.Link(source, target);
                    links.push(link);
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");
                var recipeNameData = lineData[0].split(".");
                var recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();
                var label = lineData[2].replace("[", "").replace("]", "").replace("label=", "").replace('"', "").replace('"', "").trim();
                var labelData = label.split(/\\n|:/);
                var recipePath = labelData[labelData.length - 1];
                if (!nodes.some(rn => rn.getName() == recipeName)) {
                    const node = new Node_1.Node(index, recipeName);
                    node.setRecipe(recipePath);
                    nodes.push(node);
                    index++;
                }
                else {
                    nodes.find(rn => rn.getName() == recipeName).setRecipe(recipePath);
                }
            }
        });
        var graph = new typescript_map_1.TSMap();
        graph.set("nodes", nodes);
        graph.set("links", links);
        return JSON.stringify(graph.toJSON());
    }
}
exports.DotParser = DotParser;


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports) {


var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TSMap = void 0;
var TSMap = /** @class */ (function () {
    function TSMap(inputMap) {
        var t = this;
        t._keys = [];
        t._values = [];
        t.length = 0;
        if (inputMap) {
            inputMap.forEach(function (v, k) {
                t.set(v[0], v[1]);
            });
        }
    }
    /**
     * Convert a JSON object to a map.
     *
     * @param {*} jsonObject JSON object to convert
     * @param {boolean} [convertObjs] convert nested objects to maps
     * @returns {TSMap<K, V>}
     * @memberof TSMap
     */
    TSMap.prototype.fromJSON = function (jsonObject, convertObjs) {
        var t = this;
        var setProperty = function (value) {
            if (value !== null && typeof value === 'object' && convertObjs)
                return new TSMap().fromJSON(value, true);
            if (Array.isArray(value) && convertObjs)
                return value.map(function (v) { return setProperty(v); });
            return value;
        };
        Object.keys(jsonObject).forEach(function (property) {
            if (jsonObject.hasOwnProperty(property)) {
                t.set(property, setProperty(jsonObject[property]));
            }
        });
        return t;
    };
    /**
     * Outputs the contents of the map to a JSON object
     *
     * @returns {{[key: string]: V}}
     * @memberof TSMap
     */
    TSMap.prototype.toJSON = function () {
        var obj = {};
        var t = this;
        var getValue = function (value) {
            if (value instanceof TSMap) {
                return value.toJSON();
            }
            else if (Array.isArray(value)) {
                return value.map(function (v) { return getValue(v); });
            }
            else {
                return value;
            }
        };
        t.keys().forEach(function (k) {
            obj[String(k)] = getValue(t.get(k));
        });
        return obj;
    };
    /**
     * Get an array of arrays respresenting the map, kind of like an export function.
     *
     * @returns {(Array<Array<K|V>>)}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.entries = function () {
        var _this = this;
        return [].slice.call(this.keys().map(function (k) { return [k, _this.get(k)]; }));
    };
    /**
     * Get an array of keys in the map.
     *
     * @returns {Array<K>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.keys = function () {
        return [].slice.call(this._keys);
    };
    /**
     * Get an array of the values in the map.
     *
     * @returns {Array<V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.values = function () {
        return [].slice.call(this._values);
    };
    /**
     * Check to see if an item in the map exists given it's key.
     *
     * @param {K} key
     * @returns {Boolean}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.has = function (key) {
        return this._keys.indexOf(key) > -1;
    };
    /**
     * Get a specific item from the map given it's key.
     *
     * @param {K} key
     * @returns {V}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.get = function (key) {
        var i = this._keys.indexOf(key);
        return i > -1 ? this._values[i] : undefined;
    };
    /**
     * Safely retrieve a deeply nested property.
     *
     * @param {K[]} path
     * @returns {V}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.deepGet = function (path) {
        if (!path || !path.length)
            return null;
        var recursiveGet = function (obj, path) {
            if (obj === undefined || obj === null)
                return null;
            if (!path.length)
                return obj;
            return recursiveGet(obj instanceof TSMap ? obj.get(path[0]) : obj[path[0]], path.slice(1));
        };
        return recursiveGet(this.get(path[0]), path.slice(1));
    };
    /**
     * Set a specific item in the map given it's key, automatically adds new items as needed.
     * Ovewrrites existing items
     *
     * @param {K} key
     * @param {V} value
     *
     * @memberOf TSMap
     */
    TSMap.prototype.set = function (key, value) {
        var t = this;
        // check if key exists and overwrite
        var i = this._keys.indexOf(key);
        if (i > -1) {
            t._values[i] = value;
        }
        else {
            t._keys.push(key);
            t._values.push(value);
            t.length = t._values.length;
        }
        return this;
    };
    /**
     * Enters a value into the map forcing the keys to always be sorted.
     * Stolen from https://machinesaredigging.com/2014/04/27/binary-insert-how-to-keep-an-array-sorted-as-you-insert-data-in-it/
     * Best case speed is O(1), worse case is O(N).
     *
     * @param {K} key
     * @param {V} value
     * @param {number} [startVal]
     * @param {number} [endVal]
     * @returns {this}
     * @memberof TSMap
     */
    TSMap.prototype.sortedSet = function (key, value, startVal, endVal) {
        var t = this;
        var length = this._keys.length;
        var start = startVal || 0;
        var end = endVal !== undefined ? endVal : length - 1;
        if (length == 0) {
            t._keys.push(key);
            t._values.push(value);
            return t;
        }
        if (key == this._keys[start]) {
            this._values[start] = value;
            return this;
        }
        if (key == this._keys[end]) {
            this._values[end] = value;
            return this;
        }
        if (key > this._keys[end]) {
            this._keys.splice(end + 1, 0, key);
            this._values.splice(end + 1, 0, value);
            return this;
        }
        if (key < this._keys[start]) {
            this._values.splice(start, 0, value);
            this._keys.splice(start, 0, key);
            return this;
        }
        if (start >= end) {
            return this;
        }
        var m = start + Math.floor((end - start) / 2);
        if (key < this._keys[m]) {
            return this.sortedSet(key, value, start, m - 1);
        }
        if (key > this._keys[m]) {
            return this.sortedSet(key, value, m + 1, end);
        }
        return this;
    };
    /**
     * Provide a number representing the number of items in the map
     *
     * @returns {number}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.size = function () {
        return this.length;
    };
    /**
     * Clear all the contents of the map
     *
     * @returns {TSMap<K,V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.clear = function () {
        var t = this;
        t._keys.length = t.length = t._values.length = 0;
        return this;
    };
    /**
     * Delete an item from the map given it's key
     *
     * @param {K} key
     * @returns {Boolean}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.delete = function (key) {
        var t = this;
        var i = t._keys.indexOf(key);
        if (i > -1) {
            t._keys.splice(i, 1);
            t._values.splice(i, 1);
            t.length = t._keys.length;
            return true;
        }
        return false;
    };
    /**
     * Used to loop through the map.
     *
     * @param {(value:V,key?:K,index?:number) => void} callbackfn
     *
     * @memberOf TSMap
     */
    TSMap.prototype.forEach = function (callbackfn) {
        var _this = this;
        this._keys.forEach(function (v, i) {
            callbackfn(_this.get(v), v, i);
        });
    };
    /**
     * Returns an array containing the returned value of each item in the map.
     *
     * @param {(value:V,key?:K,index?:number) => any} callbackfn
     * @returns {Array<any>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.map = function (callbackfn) {
        var _this = this;
        return this.keys().map(function (itemKey, i) {
            return callbackfn(_this.get(itemKey), itemKey, i);
        });
    };
    /**
     * Removes items based on a conditional function passed to filter.
     * Mutates the map in place.
     *
     * @param {(value:V,key?:K,index?:number) => Boolean} callbackfn
     * @returns {TSMap<K,V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.filter = function (callbackfn) {
        var t = this;
        __spreadArrays(t._keys).forEach(function (v, i) {
            if (callbackfn(t.get(v), v, i) === false)
                t.delete(v);
        });
        return this;
    };
    /**
     * Creates a deep copy of the map, breaking all references to the old map and it's children.
     * Uses JSON.parse so any functions will be stringified and lose their original purpose.
     *
     * @returns {TSMap<K,V>}
     *
     * @memberOf TSMap
     */
    TSMap.prototype.clone = function () {
        return new TSMap(this.entries());
    };
    return TSMap;
}());
exports.TSMap = TSMap;


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Link = void 0;
class Link {
    /**
     *
     */
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}
exports.Link = Link;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Node = void 0;
class Node {
    /**
     *
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.recipe = "";
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getRecipe() {
        return this.recipe;
    }
    setRecipe(recipe) {
        this.recipe = recipe;
    }
}
exports.Node = Node;


/***/ }),
/* 8 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VisualizationPanel = void 0;
const vscode = __webpack_require__(1);
const extension_1 = __webpack_require__(0);
class VisualizationPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    static createOrShow(extensionUri) {
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
        const panel = vscode.window.createWebviewPanel(VisualizationPanel.viewType, "Visualization", column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            retainContextWhenHidden: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "media"),
                vscode.Uri.joinPath(extensionUri, "out/compiled"),
            ],
        });
        VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
    }
    static kill() {
        var _a;
        (_a = VisualizationPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.dispose();
        VisualizationPanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri) {
        VisualizationPanel.currentPanel = new VisualizationPanel(panel, extensionUri);
    }
    dispose() {
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
    _update() {
        return __awaiter(this, void 0, void 0, function* () {
            const webview = this._panel.webview;
            this._panel.webview.html = this._getHtmlForWebview(webview);
            webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
                switch (data.command) {
                    case "open-file": {
                        console.log("Message: " + data.filename);
                        if (!data.filename) {
                            return;
                        }
                        vscode.window.showInformationMessage(data.filename);
                        var recipePath = "data.filename";
                        if (vscode.workspace.workspaceFolders !== undefined) {
                            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                            if (workspacePath.includes("wsl")) {
                                const pathData = workspacePath.replace("\\\\", "").split("\\");
                                console.log(pathData);
                                recipePath = "\\\\" + pathData[0] + "\\" + pathData[1] + "\\" + data.filename.replace("/", "\\");
                                console.log(recipePath);
                            }
                        }
                        vscode.workspace.openTextDocument(recipePath).then(document => vscode.window.showTextDocument(document));
                        break;
                    }
                }
            }));
        });
    }
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "visualization.js"));
        // Local path to css styles
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        //const cssUri = webview.asWebviewUri(
        //  vscode.Uri.joinPath(this._extensionUri, "out", "compiled/hello.css")
        //);
        //
        //// Use a nonce to only allow specific scripts to be run
        const nonce = (0, extension_1.getNonce)();
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
                <div class="chart">
                    <div id="visualization"></div>
                    <input type="hidden" id="graph" name="graph" value='${VisualizationPanel.graphString}''>
                    <script src="https://d3js.org/d3.v4.min.js" nonce="${nonce}"></script>
                    <script src="http://viz-js.com/bower_components/viz.js/viz-lite.js" nonce="${nonce}"></script>
                    <script src="${scriptUri}" type="module" nonce="${nonce}"></script>
                    <script nonce="${nonce}"></script>
                </div>
			</body>
			</html>`;
    }
}
exports.VisualizationPanel = VisualizationPanel;
VisualizationPanel.viewType = "visualization";


/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sidebar = void 0;
const vscode = __webpack_require__(1);
const extension_1 = __webpack_require__(0);
class Sidebar {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    revive(panel) {
        this._view = panel;
    }
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
            switch (data.command) {
                case "visualize": {
                    (0, extension_1.createVizualization)(this._extensionUri);
                }
            }
        }));
    }
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.js"));
        // Local path to css styles
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        //const cssUri = webview.asWebviewUri(
        //  vscode.Uri.joinPath(this._extensionUri, "out", "compiled/hello.css")
        //);
        //
        //// Use a nonce to only allow specific scripts to be run
        const nonce = (0, extension_1.getNonce)();
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
exports.Sidebar = Sidebar;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map