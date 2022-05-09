import { GraphElement } from "./GraphElement";

/**
 * Class representing a link in the graph.
 */
export class Link implements GraphElement {

    /**
     * ID of the source recipe node.
     */
    private source: number;

    /**
     * ID of the target recipe node.
     */
    private target: number;

    /**
     * Create an instance representing a connection.
     * @param source ID of the source recipe node.
     * @param target ID of the target recipe node.
     */
    constructor(source: number, target: number) {
        this.source = source;
        this.target = target;
    }
}