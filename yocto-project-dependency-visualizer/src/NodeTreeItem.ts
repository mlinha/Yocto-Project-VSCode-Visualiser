import * as vscode from 'vscode';

export class NodeTreeItem extends vscode.TreeItem {
    children: NodeTreeItem[] | undefined;
    recipe: string;
    is_removed: number;

    constructor(label: string, recipe: string, is_removed: number, children?: NodeTreeItem[]) {
        super(
            label,
            vscode.TreeItemCollapsibleState.None)
        this.children = children;
        this.recipe = recipe;
        this.is_removed = is_removed;
        this.tooltip = this.recipe;
    }
}