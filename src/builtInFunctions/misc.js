const { IBuiltInFunctionNode } = require("../interpreter/INodes.js");
const { dataTypes } = require("../constants.js");
const { getImportMetadata, generateClass } = require("../utils.js");
const { Error } = require("../error.js");

function Print() {
    return new IBuiltInFunctionNode(
        dataTypes.Null,
        "Print",
        [
            { type: dataTypes.Any, name: "input" }
        ],
        (args, context) => {
            const valueToPrint = IBuiltInFunctionNode.getArg("input", args);
            context.global.apiCaller.call(valueToPrint.value, "print");
        }
    );
}

function Clear() {
    return new IBuiltInFunctionNode(
        dataTypes.Null,
        "Clear",
        [],
        (args, context) => {
            context.global.apiCaller.call(null, "clear");
        }
    );
}

module.exports = {
    Print,
    Clear
};