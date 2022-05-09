import { GraphElement } from "./GraphElement";

/**
 * Class representing a recipe (node) in the graph.
 */
export class Node implements GraphElement {

    /**
     * ID of the node.
     */
    private id: number;

    /**
     * Name of the recipe representing a node.
     */
    private name: string;

    /**
     * Path of the recipe.
     */
    private recipe: string;

    /**
     * License used in the recipe.
     */
    private license: string;

    /**
     * Create an instance representing a recipe (node) in the graph.
     * @param id ID of the node.
     * @param name Name of the node.
     */
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.recipe = "";
        this.license = "";
    }

    /**
     * Return an ID of the node.
     * @returns ID of the node.
     */
    public getId(): number {
        return this.id;
    }
    
    /**
     * Return a name of the node.
     * @returns Name of the node.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Return a recipe of the node.
     * @returns Recipe of the node.
     */
    public getRecipe(): string {
        return this.recipe;
    }

    /**
     * Set path to the recipe.
     * @param recipe Path to the recipe.
     */
    public setRecipe(recipe: string) {
        this.recipe = recipe;
    }
    
    /**
     * Return a license used by the node.
     * @returns Used license of the node.
     */
    public getLicense(): string {
        return this.license;
    }

     /**
     * Set used license.
     * @param license Used license.
     */
    public setLicense(license: string) {
        this.license = license;
    }  
}