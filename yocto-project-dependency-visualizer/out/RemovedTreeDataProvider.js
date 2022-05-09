"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemovedTreeDataProvider = void 0;
const vscode = require("vscode");
const NodeTreeItem_1 = require("./NodeTreeItem");
/**
 * TreeProvider class for a TreeView of nodes removed from visualization.
 */
class RemovedTreeDataProvider {
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
     * Adds a new node to the list of removed nodes.
     * @param label Name of the recipe.
     * @param recipe Path to the recipe file.
     */
    addNode(label, recipe) {
        this.data.push(new NodeTreeItem_1.NodeTreeItem(label, recipe, 0));
    }
    /**
     * Remove node from the list of removed nodes.
     * @param label Name of the node to be removed.
     */
    removeNode(label) {
        var index = this.data.findIndex((node) => node.label === label);
        this.data.splice(index, 1);
    }
    /**
     * Clear the list of nodes.
     */
    clearAllNodes() {
        this.data = [];
    }
}
exports.RemovedTreeDataProvider = RemovedTreeDataProvider;
//# sourceMappingURL=RemovedTreeDataProvider.js.map