import { loadFile } from "../helpers";

export function parseRecipe(recipe: string): { [name: string]: string } {
    var additionalInfo: { [name: string]: string } = {};
    var data = loadFile(recipe);

    additionalInfo.licence = "none";

    if (data === undefined) {
        return additionalInfo;
    }

    for (var i = 0; i < data.length; i++) {
        console.log(data[i]);
        var line = data[i];
        if (line.includes("LICENSE")) {
            var lineData = line.split("=");
            if (lineData.length > 1) {
                additionalInfo.licence = lineData[1].replace('"', "").replace('"', "").trim();
                break;
            }
        }
    }

    return additionalInfo;
}