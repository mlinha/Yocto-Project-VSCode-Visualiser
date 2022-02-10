import { readFileSync } from "fs";
import { TSMap } from "typescript-map";
import { GraphElement } from "./GraphElement";
import { Link } from "./Link";
import { Node } from "./Node";

export class DotParser {

    private dotPath: string;
    constructor(dotPath: string) {
        this.dotPath = dotPath;
    }

    private loadDotFile()  {
        var data;
    	try {
    	  data = readFileSync(this.dotPath, "utf8");
    	} catch (err) {
    	  console.error(err)
    	}

        return data?.split("\n");
    }

    public parseDotFile() {
        var index: number = 1;
        var data = this.loadDotFile();
        var nodes: Array<GraphElement> = [];
        var links: Array<GraphElement> = [];

        data?.forEach(line => {
            const lineData = line.split(" -> ");
            if (lineData[0].includes("do_prepare_recipe_sysroot") && !lineData[0].includes("label") && !lineData[1].includes("do_fetch"))
                {
                    const recipeName = lineData[0].replace(".do_prepare_recipe_sysroot", "").replace('"', "").replace('"', "").trim();
                    const dependentRecipeName = lineData[1].replace(".do_populate_sysroot", "").replace('"', "").replace('"', "").trim();

                    if (dependentRecipeName !== recipeName)
                    {
                        var source;
                        var target;

                        const recipeNode = new Node(index, recipeName);
                        if (!nodes.some(rn => (rn as Node).getName() == recipeName))
                        {
                            nodes.push(recipeNode);
                            source = index;
                            index++;
                        }
                        else
                        {
                            source = (nodes.find(rn => (rn as Node).getName() == recipeName) as Node).getId();
                        }

                        const dependentRecipeNode = new Node(index, dependentRecipeName);
                        if (!nodes.some(rn => (rn as Node).getName() == dependentRecipeName))
                        {
                            nodes.push(dependentRecipeNode);
                            target = index;
                            index++;
                        }
                        else
                        {
                            target = (nodes.find(rn => (rn as Node).getName() == dependentRecipeName) as Node).getId();
                        }

                        const link = new Link(source, target);
                        links.push(link);
                    }
                }
        });

        var graph = new TSMap<string, Array<GraphElement>>();
        graph.set("nodes", nodes);
        graph.set("links", links);

        return JSON.stringify(graph.toJSON());
    }

}