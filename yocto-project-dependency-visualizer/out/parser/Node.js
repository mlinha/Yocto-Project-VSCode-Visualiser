"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
/**
 * Class representing a recipe (node) in the graph.
 */
class Node {
    /**
     * Create an instance representing a recipe (node) in the graph.
     * @param id ID of the node.
     * @param name Name of the node.
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.recipe = "";
        this.license = "";
    }
    /**
     * Return an ID of the node.
     * @returns ID of the node.
     */
    getId() {
        return this.id;
    }
    /**
     * Return a name of the node.
     * @returns Name of the node.
     */
    getName() {
        return this.name;
    }
    /**
     * Return a recipe of the node.
     * @returns Recipe of the node.
     */
    getRecipe() {
        return this.recipe;
    }
    /**
     * Set path to the recipe.
     * @param recipe Path to the recipe.
     */
    setRecipe(recipe) {
        this.recipe = recipe;
    }
    /**
     * Return a license used by the node.
     * @returns Used license of the node.
     */
    getLicense() {
        return this.license;
    }
    /**
    * Set used license.
    * @param license Used license.
    */
    setLicense(license) {
        this.license = license;
    }
}
exports.Node = Node;
//# sourceMappingURL=Node.js.map