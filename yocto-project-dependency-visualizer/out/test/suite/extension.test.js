"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const vscode = require("vscode");
const constants_1 = require("../../support/constants");
const DotParser_1 = require("../../parser/DotParser");
const recipe_parser_1 = require("../../parser/recipe_parser");
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    var dotParser = new DotParser_1.DotParser(path.resolve(__dirname, "../../../src/test/data/task-depends_test.dot"));
    test('Test DOT parser default', () => {
        var output = dotParser.parseDotFile(constants_1.DEFAULT_TYPE, constants_1.DEFAULT_MODE);
        var json = JSON.parse(output);
        assert.strictEqual(json.nodes[0].name, "acl-native");
        assert.strictEqual(json.nodes[1].name, "attr-native");
        assert.strictEqual(json.nodes[2].name, "autoconf-native");
        assert.strictEqual(json.nodes[0].license, "");
        assert.strictEqual(json.nodes[0].recipe, "/home/michal/workir/poky/meta/recipes-support/attr/acl_2.2.53.bb");
        assert.strictEqual(json.links[0].source, 1);
        assert.strictEqual(json.links[0].target, 2);
        assert.strictEqual(json.links[1].source, 1);
        assert.strictEqual(json.links[1].target, 3);
        assert.strictEqual(json.links[2].source, 1);
        assert.strictEqual(json.links[2].target, 4);
    });
    test('Test DOT parser licences mode', () => {
        var output = dotParser.parseDotFile(constants_1.DEFAULT_TYPE, "licenses");
        var json = JSON.parse(output);
        assert.strictEqual(json.nodes[0].name, "acl-native");
        assert.strictEqual(json.nodes[1].name, "attr-native");
        assert.strictEqual(json.nodes[2].name, "autoconf-native");
        assert.strictEqual(json.nodes[0].recipe, "/home/michal/workir/poky/meta/recipes-support/attr/acl_2.2.53.bb");
        assert.strictEqual(json.nodes[0].license, "none");
        assert.strictEqual(json.nodes[1].license, "");
        assert.strictEqual(json.links[0].source, 1);
        assert.strictEqual(json.links[0].target, 2);
        assert.strictEqual(json.links[1].source, 1);
        assert.strictEqual(json.links[1].target, 3);
        assert.strictEqual(json.links[2].source, 1);
        assert.strictEqual(json.links[2].target, 4);
    });
    test('Test DOT parser task do_build', () => {
        var output = dotParser.parseDotFile("do_build", constants_1.DEFAULT_MODE);
        var json = JSON.parse(output);
        assert.strictEqual(json.nodes[0].name, "acl-native");
        assert.strictEqual(json.nodes[1].name, "acl");
        assert.strictEqual(json.nodes[2].name, "attr");
        assert.strictEqual(json.nodes[0].recipe, "/home/michal/workir/poky/meta/recipes-support/attr/acl_2.2.53.bb");
        assert.strictEqual(json.nodes[1].recipe, "/home/michal/workir/poky/meta/recipes-support/attr/acl_2.2.53.bb");
        assert.strictEqual(json.links[0].source, 2);
        assert.strictEqual(json.links[0].target, 3);
        assert.strictEqual(json.links[1].source, 2);
        assert.strictEqual(json.links[1].target, 4);
        assert.strictEqual(json.links[2].source, 2);
        assert.strictEqual(json.links[2].target, 5);
    });
    test('Test DOT parser wrong file', () => {
        var dotParserWrong = new DotParser_1.DotParser(path.resolve(__dirname, "../../../src/test/data/task-depends_test2.dot"));
        var output = dotParserWrong.parseDotFile("do_build", constants_1.DEFAULT_MODE);
        var json = JSON.parse(output);
        assert.strictEqual(json.nodes.length, 0);
        assert.strictEqual(json.links.length, 0);
    });
    test('Test recipe_parser normal', () => {
        var data = (0, recipe_parser_1.parseRecipe)(path.resolve(__dirname, "../../../src/test/data/recipe1.bb"));
        assert.strictEqual(data.license, "LGPLv2.1+ & GPLv2+");
    });
    test('Test recipe_parser no license', () => {
        var data = (0, recipe_parser_1.parseRecipe)(path.resolve(__dirname, "../../../src/test/data/recipe2.bb"));
        assert.strictEqual(data.license, "none");
    });
    test('Test recipe_parser licence bellow specific licenses', () => {
        var data = (0, recipe_parser_1.parseRecipe)(path.resolve(__dirname, "../../../src/test/data/recipe3.bb"));
        assert.strictEqual(data.license, "LGPLv2.1+ & GPLv2+");
    });
    test('Test recipe_parser wrong file', () => {
        var data = (0, recipe_parser_1.parseRecipe)(path.resolve(__dirname, "../../../src/test/data/recipe4.bb"));
        assert.strictEqual(data.license, "none");
    });
});
//# sourceMappingURL=extension.test.js.map