import * as vscode from 'vscode';
import { NodeTreeItem } from './NodeTreeItem';

export class ConnectionsTreeDataProvider implements vscode.TreeDataProvider<NodeTreeItem> {
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

    public updateNodes(nodeData: { name: string; recipe: string; is_removed: number; }[]) {
        nodeData.forEach(node => {
            this.data.push(new NodeTreeItem(node.name, node.recipe, node.is_removed));
        });
    }

    public clearAllNodes() {
        this.data = [];
    }
}