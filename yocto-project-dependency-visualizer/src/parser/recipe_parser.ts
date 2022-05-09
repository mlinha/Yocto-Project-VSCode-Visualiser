import { loadFile } from "../support/helpers";

/**
 * Parse a recipe file and return a dictionary with license information.
 * @param recipe Path to the recipe file.
 * @returns Dictionary with license information.
 */
export function parseRecipe(recipe: string): { [name: string]: string } {
    var additionalInfo: { [name: string]: string } = {};
    var data = loadFile(recipe);

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