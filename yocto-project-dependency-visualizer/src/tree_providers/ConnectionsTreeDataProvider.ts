import * as vscode from 'vscode';
import { NodeTreeItem } from './NodeTreeItem';

/**
 * TreeProvider class for a TreeView of requested and used-by nodes from visualization.
 */
export class ConnectionsTreeDataProvider implements vscode.TreeDataProvider<NodeTreeItem> {

    /**
     * Action executed when TreeView data changed.
     */
    private _onDidChangeTreeData: vscode.EventEmitter<NodeTreeItem | undefined | void> = new vscode.EventEmitter<NodeTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<NodeTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    /**
     * Data to be shown in the TreeView.
     */
    private data: NodeTreeItem[];

    /**
     * Inititalizes the provider.
     */
    public constructor() {
        this.data = [];
    }

    /**
     * Refresh the TreeViev.
     */
    public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    /**
     * Get the tree item (implemented because it is required by the interface).
     * @param element Element that is also returned.
     * @returns 
     */
    public getTreeItem(element: NodeTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    /**
     * Get a list of childer of the element.
     * @returns All data elements as there is only one layer in the tree.
     */
    public getChildren(element?: NodeTreeItem | undefined): vscode.ProviderResult<NodeTreeItem[]> {
        //if (element === undefined) {
        //    return this.data;
        //}
        //return element.children;

        return this.data;
    }

    /**
     * Adds new nodes to the TreeView.
     * @param nodeData List of nodes to be added.
     */
    public updateNodes(nodeData: { name: string; recipe: string; is_removed: number; }[]) {
        nodeData.forEach(node => {
            this.data.push(new NodeTreeItem(node.name, node.recipe, node.is_removed));
        });
    }

    /**
     * Clear the list of nodes.
     */
    public clearAllNodes() {
        this.data = [];
    }
}