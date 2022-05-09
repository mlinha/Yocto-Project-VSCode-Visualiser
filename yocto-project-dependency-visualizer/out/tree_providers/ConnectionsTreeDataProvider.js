"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsTreeDataProvider = void 0;
const vscode = require("vscode");
const NodeTreeItem_1 = require("./NodeTreeItem");
/**
 * TreeProvider class for a TreeView of requested and used-by nodes from visualization.
 */
class ConnectionsTreeDataProvider {
    /**
     * Inititalizes the provider.
     */
    constructor() {
        /**
         * Action executed when TreeView data changed.
         */
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
    }
    /**
     * Refresh the TreeViev.
     */
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    /**
     * Get the tree item (implemented because it is required by the interface).
     * @param element Element that is also returned.
     * @returns
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Get a list of childer of the element.
     * @returns All data elements as there is only one layer in the tree.
     */
    getChildren(element) {
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
    updateNodes(nodeData) {
        nodeData.forEach(node => {
            this.data.push(new NodeTreeItem_1.NodeTreeItem(node.name, node.recipe, node.is_removed));
        });
    }
    /**
     * Clear the list of nodes.
     */
    clearAllNodes() {
        this.data = [];
    }
}
exports.ConnectionsTreeDataProvider = ConnectionsTreeDataProvider;
//# sourceMappingURL=ConnectionsTreeDataProvider.js.map