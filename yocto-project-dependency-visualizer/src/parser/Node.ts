import { GraphElement } from "./GraphElement";

export class Node implements GraphElement {

    private id: number;
    private name: string;
    private recipe: string;
    private license: string;

    /**
     *
     */
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.recipe = "";
        this.license = "";
    }

    public getId(): number {
        return this.id;
    }
    
    public getName(): string {
        return this.name;
    }

    public getRecipe(): string {
        return this.recipe;
    }

    public setRecipe(recipe: string) {
        this.recipe = recipe;
    }
    
    public getLicense(): string {
        return this.license;
    }

    public setLicense(license: string) {
        this.license = license;
    }  
}