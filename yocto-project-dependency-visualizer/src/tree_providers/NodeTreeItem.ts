import * as vscode from 'vscode';

/**
 * Class representing an recipe (node) in the TreeView.
 */
export class NodeTreeItem extends vscode.TreeItem {

    /**
     * Path to the recipe.
     */
    private recipe: string;

    /**
     * Stores of recipe (node) is removed from the visualization.
     */
    private is_removed: number;

    /**
     * Create an instance representing an recipe (node) in the TreeView.
     * @param label Name of the item in the TreeView.
     * @param recipe Path to the recipe.
     * @param is_removed Stores of recipe (node) is removed from the visualization.
     */
    public constructor(label: string, recipe: string, is_removed: number) {
        super(
            label,
            vscode.TreeItemCollapsibleState.None)
        this.recipe = recipe;
        this.is_removed = is_removed;
        this.tooltip = this.recipe;
    }

    /**
     * Return if node is removed from the visualization.
     * @returns 1 if node is removed from the visualization.
     */
    public isRemoved(): number {
        return this.is_removed;
    }

    /**
     * Get the path to the recipe.
     * @returns Path to the recipe.
     */
    public getRecipe(): string {
        return this.recipe;
    }
}