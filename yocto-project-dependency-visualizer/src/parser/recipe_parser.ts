import { loadFile } from "../helpers";

export function parseRecipe(recipe: string): { [name: string]: string } {
    var additionalInfo: { [name: string]: string } = {};
    var data = loadFile(recipe);

    data?.forEach(line => {
        if (line.includes("LICENSE")) {
            var lineData = line.split("=");
            if (lineData.length > 1) {
                additionalInfo.licence = lineData[1].replace('"', "").replace('"', "").trim();
            }
        }
    });

    return additionalInfo;
}