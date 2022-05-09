"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = void 0;
/**
 * Class representing a link in the graph.
 */
class Link {
    /**
     * Create an instance representing a connection.
     * @param source ID of the source recipe node.
     * @param target ID of the target recipe node.
     */
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}
exports.Link = Link;
//# sourceMappingURL=Link.js.map