"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonce = exports.getRecipePath = exports.loadFile = void 0;
const fs_1 = require("fs");
const vscode = require("vscode");
/**
 * Load data from a specified file and return them as a list of lines.
 * @param file File to be opened.
 * @returns List of lines (strings).
 */
function loadFile(file) {
    var data;
    try {
        data = (0, fs_1.readFileSync)(file, "utf8");
    }
    catch (err) {
        console.error(err);
    }
    return data === null || data === void 0 ? void 0 : data.split("\n");
}
exports.loadFile = loadFile;
/**
 * Get correct path to the recipe file (used for WSLv2 functionality).
 * @param recipe Path to recipe.
 * @returns Correct path to recipe.
 */
function getRecipePath(recipe) {
    var recipePath = recipe;
    if (vscode.workspace.workspaceFolders !== undefined) {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        if (workspacePath.includes("wsl")) {
            const pathData = workspacePath.replace("\\\\", "").split("\\");
            recipePath = "\\\\" + pathData[0] + "\\" + pathData[1] + "\\" + recipe.replace("/", "\\");
        }
    }
    return recipePath;
}
exports.getRecipePath = getRecipePath;
/**
 * Generated nonce to be used for loading JS file in HTML.
 * @returns Nonce string.
 */
function getNonce() {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;
//# sourceMappingURL=helpers.js.map