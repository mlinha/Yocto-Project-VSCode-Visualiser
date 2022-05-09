"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTreeItem = void 0;
const vscode = require("vscode");
/**
 * Class representing an recipe (node) in the TreeView.
 */
class NodeTreeItem extends vscode.TreeItem {
    /**
     * Create an instance representing an recipe (node) in the TreeView.
     * @param label Name of the item in the TreeView.
     * @param recipe Path to the recipe.
     * @param is_removed Stores of recipe (node) is removed from the visualization.
     */
    constructor(label, recipe, is_removed) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.recipe = recipe;
        this.is_removed = is_removed;
        this.tooltip = this.recipe;
    }
    /**
     * Return if node is removed from the visualization.
     * @returns 1 if node is removed from the visualization.
     */
    isRemoved() {
        return this.is_removed;
    }
    /**
     * Get the path to the recipe.
     * @returns Path to the recipe.
     */
    getRecipe() {
        return this.recipe;
    }
}
exports.NodeTreeItem = NodeTreeItem;
//# sourceMappingURL=NodeTreeItem.js.map