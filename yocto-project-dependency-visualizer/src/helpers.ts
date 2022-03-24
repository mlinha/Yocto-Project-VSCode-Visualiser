import { readFileSync } from "fs";
import * as vscode from 'vscode';

export function loadFile(file: string): string[] | undefined {
    var data;
    try {
        data = readFileSync(file, "utf8");
    } catch (err) {
        console.error(err)
    }

    return data?.split("\n");
}

export function getRecipePath(recipe: string): string {
    var recipePath = recipe;

    if (vscode.workspace.workspaceFolders !== undefined) {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        if (workspacePath.includes("wsl")) {
            const pathData = workspacePath.replace("\\\\", "").split("\\");
            console.log(pathData);
            recipePath = "\\\\" + pathData[0] + "\\" + pathData[1] + "\\" + recipe.replace("/", "\\");
            console.log(recipePath);
        }
    }

    console.log(recipePath);

    return recipePath;
}