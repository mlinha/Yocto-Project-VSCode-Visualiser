import * as vscode from 'vscode';
import { NodeTreeItem } from './NodeTreeItem';

/**
 * TreeProvider class for a TreeView of nodes removed from visualization.
 */
export class RemovedTreeDataProvider implements vscode.TreeDataProvider<NodeTreeItem> {

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
     * Adds a new node to the list of removed nodes.
     * @param label Name of the recipe.
     * @param recipe Path to the recipe file.
     */
    public addNode(label: string, recipe: string) {
        this.data.push(new NodeTreeItem(label, recipe, 0));
    }

    /**
     * Remove node from the list of removed nodes.
     * @param label Name of the node to be removed.
     */
    public removeNode(label: string) {
        var index = this.data.findIndex((node) => node.label === label);
        this.data.splice(index, 1);
    }

    /**
     * Clear the list of nodes.
     */
    public clearAllNodes() {
        this.data = [];
    }
}