import * as vscode from 'vscode';
import * as path from 'path';

export class Provv implements vscode.TreeDataProvider<NodeTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<NodeTreeItem | undefined | void> = new vscode.EventEmitter<NodeTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<NodeTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    data: NodeTreeItem[];

    constructor() {
        this.data = [];
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: NodeTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: NodeTreeItem | undefined): vscode.ProviderResult<NodeTreeItem[]> {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }

    public addNode(label: string, recipe: string) {
        this.data.push(new NodeTreeItem(label, recipe));
        console.log(this.data)
    }

    public removeNode(label: string) {
        var index = this.data.findIndex((node) => node.label === label);
        this.data.splice(index, 1);
    }

    public clearAllNodes() {
        this.data = [];
    }
}

export class NodeTreeItem extends vscode.TreeItem {
    children: NodeTreeItem[] | undefined;
    recipe: string;

    constructor(label: string, recipe: string, children?: NodeTreeItem[]) {
        super(
            label,
            vscode.TreeItemCollapsibleState.None)
        this.children = children;
        this.recipe = recipe;
        this.tooltip = this.recipe;
    }
}