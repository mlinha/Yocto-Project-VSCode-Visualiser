import { GraphElement } from "./GraphElement";

export class Link implements GraphElement {

    private source: number;
    private target: number;

    /**
     *
     */
    constructor(source: number, target: number) {
        this.source = source;
        this.target = target;
    }
}