"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRecipe = void 0;
const helpers_1 = require("../support/helpers");
/**
 * Parse a recipe file and return a dictionary with license information.
 * @param recipe Path to the recipe file.
 * @returns Dictionary with license information.
 */
function parseRecipe(recipe) {
    var additionalInfo = {};
    var data = (0, helpers_1.loadFile)(recipe);
    additionalInfo.license = "none";
    if (!data) {
        return additionalInfo;
    }
    for (var i = 0; i < data.length; i++) {
        var line = data[i];
        var lineData = line.split("=");
        if (lineData.length > 1) {
            if (lineData[0].trim() === "LICENSE") {
                additionalInfo.license = lineData[1].replace('"', "").replace('"', "").trim();
                break;
            }
        }
    }
    return additionalInfo;
}
exports.parseRecipe = parseRecipe;
//# sourceMappingURL=recipe_parser.js.map