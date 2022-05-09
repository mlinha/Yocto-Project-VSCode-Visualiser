import { TSMap } from "typescript-map";
import { DEFAULT_TYPE } from "../support/constants";
import { loadFile, getRecipePath } from "../support/helpers";
import { GraphElement } from "../model/GraphElement";
import { Link } from "../model/Link";
import { Node } from "../model/Node";
import { parseRecipe } from "./recipe_parser";

/**
 * Class used for parsing BitBake generated .dot files.
 */
export class DotParser {

    /**
     * Path to the .dot file.
     */
    private dotPath: string;

    /**
     * Initialize DotParser class instance.
     * @param dotPath Path to the .dot file.
     */
    public constructor(dotPath: string) {
        this.dotPath = dotPath;
    }

    /**
     * Parse a .dot file based on given parameters.
     * @param type Type of the BitBake task that will be parsed.
     * @param mode Mode of graph analysis.
     * @returns JSON string with data for visualization.
     */
    public parseDotFile(type: string, mode: string): string {
        var graphString;

        if (type === DEFAULT_TYPE) {
            graphString = this.parseDotFileDefault(mode);
        }
        else {
            graphString = this.parseDotFileTaskType(type, mode);
        }

        return graphString;
    }

    /**
     * Parse .dot file if "default" BitBake task type was selected (uses ".do_prepare_recipe_sysroot" on the left side and ".do_populate_sysroot" on the right side).
     * @param mode Mode of graph analysis.
     * @returns JSON string with data for visualization.
     */
    public parseDotFileDefault(mode: string): string {
        var index = 1;
        var data = loadFile(this.dotPath);
        var nodes: Array<GraphElement> = [];
        var links: Array<GraphElement> = [];

        data?.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes("do_prepare_recipe_sysroot") && !lineData[0].includes("label=") && lineData[1].includes("do_populate_sysroot")) {
                const recipeName = lineData[0].replace(".do_prepare_recipe_sysroot", "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].replace(".do_populate_sysroot", "").replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
                    index = this.addGraphData(nodes, links, recipeName, dependentRecipeName, index);
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");

                const recipeNameData = lineData[0].split(".");
                const recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();

                index = this.setNodeRecipe(nodes, lineData[2], recipeName, index, mode);
            }
        });

        return this.generateGraphJSON(nodes, links);
    }

    /**
     * Parse BitBake .dot file. Uses only lines that have the specified type on the left side.
     * @param type Type of the BitBake task that will be parsed.
     * @param mode Mode of graph analysis.
     * @returns JSON string with data for visualization.
     */
    public parseDotFileTaskType(type: string, mode: string): string {
        var index = 1;
        var data = loadFile(this.dotPath);
        var nodes: Array<GraphElement> = [];
        var links: Array<GraphElement> = [];

        data?.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes(type) && !lineData[0].includes("label=")) {
                const recipeName = lineData[0].replace("." + type, "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].split(".")[0].replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
                    index = this.addGraphData(nodes, links, recipeName, dependentRecipeName, index);
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");

                const recipeNameData = lineData[0].split(".");
                const recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();

                index = this.setNodeRecipe(nodes, lineData[2], recipeName, index, mode);
            }
        });

        return this.generateGraphJSON(nodes, links);
    }

    /**
     * Add new nodes and links to the list of nodes and links.
     * @param nodes List of nodes.
     * @param links List of links.
     * @param recipeName Name of the first recipe.
     * @param dependentRecipeName Name of the second recipe.
     * @param index Index of the node in the list of nodes.
     * @returns New index.
     */
    private addGraphData(nodes: Array<GraphElement>, links: Array<GraphElement>, recipeName: string, dependentRecipeName: string, index: number): number {
        var source;
        var target;

        if (!nodes.some(rn => (rn as Node).getName() == recipeName)) {
            nodes.push(new Node(index, recipeName));
            source = index;
            index++;
        }
        else {
            source = (nodes.find(rn => (rn as Node).getName() == recipeName) as Node).getId();
        }

        if (!nodes.some(rn => (rn as Node).getName() == dependentRecipeName)) {
            nodes.push(new Node(index, dependentRecipeName));
            target = index;
            index++;
        }
        else {
            target = (nodes.find(rn => (rn as Node).getName() == dependentRecipeName) as Node).getId();
        }
        const link = new Link(source, target);
        links.push(link);

        return index;
    }

    /**
     * Assing a path to the recipe file for a specified node or for a newly created one.
     * @param nodes List of nodes.
     * @param labelSource Label string.
     * @param recipeName Name of the recipe.
     * @param index Index of the node in the list of nodes.
     * @param mode Mode of graph analysis.
     * @returns New index.
     */
    private setNodeRecipe(nodes: Array<GraphElement>, labelSource: string, recipeName: string, index: number, mode: string): number {
        var label = labelSource.replace("[", "").replace("]", "").replace("label=", "").replace('"', "").replace('"', "").trim();

        var labelData = label.split(/\\n|:/);
        var recipePath = labelData[labelData.length - 1];

        if (!nodes.some(rn => (rn as Node).getName() == recipeName)) {
            const node = new Node(index, recipeName);
            node.setRecipe(recipePath);
            if (mode === "licenses") {
                node.setLicense(parseRecipe(getRecipePath(recipePath)).license);
            }
            nodes.push(node);
            index++;
        }
        else {
            const node = (nodes.find(rn => (rn as Node).getName() == recipeName) as Node);
            node.setRecipe(recipePath);
            if (mode === "licenses") {
                node.setLicense(parseRecipe(getRecipePath(recipePath)).license);
            }
        }

        return index;
    }

    /**
     * Generate a JSON string containing list of nodes and list of links.
     * @param nodes List of nodes.
     * @param links List of links.
     * @returns JSON string with data for visualization.
     */
    private generateGraphJSON(nodes: GraphElement[], links: GraphElement[]): string {
        var graph = new TSMap<string, Array<GraphElement>>();
        graph.set("nodes", nodes);
        graph.set("links", links);

        return JSON.stringify(graph.toJSON());
    }

}
