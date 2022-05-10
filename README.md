# Yocto Project VSCode Visualiser

An Visual Studio Code extension development. The developed extension can be used to visualize  dependencies of recipes in the Yocto Project environment.

# Implemented features

1. Load bitbake generated task-depends.dot file and parse it (default connections with the following format are parsed: *"x.do_prepare_recipe_sysroot" -> "y.do_populate_sysroot"*, or for selected BitBake task).
2. Use parsed data to create a node-link diagram.
3. Basic interactivity in the displayed diagram:
    - pan and zoom
    - select node
    - remove selected nodes (return node)
4. Show information about selected node (name, license, path to recipe)
5. Higlight selected node, required node and nodes that require selected node
6. Highlight nodes affected by removing selected node (all nodes that directly or indirectly depend on selected node)
7. Highlight nodes according to licenses used
8. Open recipe files from the extension
9. Lists of nodes (removed, required, affected, ...)
 
# Future work

- Implement ability to create task-depends.dot file from the extension and then load it
- Support for multiple visalization at once
- Support for multiple Yocto Project folders in one workspace (select for which one the graph should be generated)
- Save state support
# How to use

Work on this extension can be continued by cloning this repository, running the '''npm run watch''' command and then pressing the F5 button (note: all tools needed for VSCode extension development are required, for more information follow this [link](https://code.visualstudio.com/api/get-started/your-first-extension).
