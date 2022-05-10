import { readFileSync } from "fs";
import * as vscode from 'vscode';

/**
 * Load data from a specified file and return them as a list of lines.
 * @param file File to be opened.
 * @returns List of lines (strings).
 */
export function loadFile(file: string): string[] | undefined {
    var data;
    try {
        data = readFileSync(file, "utf8");
    }
    catch (err) {
        data = undefined;
    }

    return data?.split("\n");
}

/**
 * Get correct path to the recipe file (used for WSLv2 functionality). 
 * @param recipe Path to recipe.
 * @returns Correct path to recipe.
 */
export function getRecipePath(recipe: string): string {
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

/**
 * Generated nonce to be used for loading JS file in HTML.
 * @returns Nonce string.
 */
export function getNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    var text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

/**
 * Opens a recipe file.
 * @param recipe Path to recipe.
 */
export function openRecipe(recipe: string) {
    var recipePath = getRecipePath(recipe);

    vscode.workspace.openTextDocument(recipePath).then(
        document => vscode.window.showTextDocument(document),
        () => vscode.window.showErrorMessage("Recipe file cannot be opened!"));
}