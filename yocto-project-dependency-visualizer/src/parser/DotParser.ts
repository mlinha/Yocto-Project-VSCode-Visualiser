import { readFileSync } from "fs";
import { TSMap } from "typescript-map";
import { default_mode } from "../constants";
import { loadFile, getRecipePath } from "../helpers";
import { GraphElement } from "./GraphElement";
import { Link } from "./Link";
import { Node } from "./Node";
import { parseRecipe } from "./recipe_parser";

export class DotParser {

    private dotPath: string;
    constructor(dotPath: string) {
        this.dotPath = dotPath;
    }

    public parseDotFile(type: string, mode: string): string {
        var graphString;
        console.log(mode);
        if (type === "default") {
            graphString = this.parseDotFileDefault(mode);
        }
        else {
            graphString = this.parseDotFileTaskType(type, mode);
        }

        return graphString;
    }

    public parseDotFileDefault(mode: string): string{
        var index = 1;
        var data = loadFile(this.dotPath);
        var nodes: Array<GraphElement> = [];
        var links: Array<GraphElement> = [];

        data?.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes("do_prepare_recipe_sysroot") && !lineData[0].includes("label") && !lineData[1].includes("do_fetch")) {
                const recipeName = lineData[0].replace(".do_prepare_recipe_sysroot", "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].replace(".do_populate_sysroot", "").replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
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
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");

                var recipeNameData = lineData[0].split(".");
                var recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();

                var label = lineData[2].replace("[", "").replace("]", "").replace("label=", "").replace('"', "").replace('"', "").trim();

                var labelData = label.split(/\\n|:/);
                var recipePath = labelData[labelData.length - 1];

                if (!nodes.some(rn => (rn as Node).getName() == recipeName)) {
                    const node = new Node(index, recipeName);
                    node.setRecipe(recipePath);
                    if (mode === "licenses") {
                        node.setLicense(parseRecipe(getRecipePath(recipePath)).licence);
                    }
                    nodes.push(node);
                    index++;
                }
                else {
                    (nodes.find(rn => (rn as Node).getName() == recipeName) as Node).setRecipe(recipePath);
                }
            }
        });

        return this.generateGraphJSON(nodes, links);
    }

    public parseDotFileTaskType(type: string, mode: string): string {
        var index = 1;
        var data = loadFile(this.dotPath);
        var nodes: Array<GraphElement> = [];
        var links: Array<GraphElement> = [];

        data?.forEach(line => {
            var lineData = line.split(" -> ");
            if (lineData[0].includes(type) && !lineData[0].includes("label")) {
                const recipeName = lineData[0].replace("." + type, "").replace('"', "").replace('"', "").trim();
                const dependentRecipeName = lineData[1].split(".")[0].replace('"', "").replace('"', "").trim();
                if (dependentRecipeName !== recipeName) {
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
                }
            }
            else if (lineData[0].includes("label=")) {
                lineData = line.split(" ");

                var recipeNameData = lineData[0].split(".");
                var recipeName = recipeNameData[0].replace('"', "").replace('"', "").trim();

                var label = lineData[2].replace("[", "").replace("]", "").replace("label=", "").replace('"', "").replace('"', "").trim();

                var labelData = label.split(/\\n|:/);
                var recipePath = labelData[labelData.length - 1];

                if (!nodes.some(rn => (rn as Node).getName() == recipeName)) {
                    const node = new Node(index, recipeName);
                    node.setRecipe(recipePath);
                    if (mode === "licenses") {
                        node.setLicense(parseRecipe(getRecipePath(recipePath)).licence);
                    }
                    nodes.push(node);
                    index++;
                }
                else {
                    (nodes.find(rn => (rn as Node).getName() == recipeName) as Node).setRecipe(recipePath);
                }
            }
        });

        return this.generateGraphJSON(nodes, links);
    }

    public generateGraphJSON(nodes: GraphElement[], links: GraphElement[]): string {
        var graph = new TSMap<string, Array<GraphElement>>();
        graph.set("nodes", nodes);
        graph.set("links", links);

        return JSON.stringify(graph.toJSON());
    }

}
