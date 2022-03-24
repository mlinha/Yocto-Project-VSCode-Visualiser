import * as vscode from 'vscode';
import { NodeTreeItem } from './NodeTreeItem';

export class RemovedTreeDataProvider implements vscode.TreeDataProvider<NodeTreeItem> {
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
        this.data.push(new NodeTreeItem(label, recipe, 0));
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