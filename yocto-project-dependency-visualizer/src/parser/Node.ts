import { GraphElement } from "./GraphElement";

export class Node implements GraphElement {

    private id: number;
    private name: string;

    /**
     *
     */
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }

    public getId() {
        return this.id;
    }
    
    public getName() {
        return this.name;
    }
}