const { dataTypes } = require("../constants.js");

//Had to import INodes as an argument because if I used require(), it would be an empty object
function toUpperCase(INodes) {
    return new INodes.IBuiltInFunctionNode(
        dataTypes.String,
        "toUpperCase",
        [],
        (args, context) => {
            const v = INodes.IBuiltInFunctionNode.getArg("value", args);
            return new INodes.IStringNode(v.value.toUpperCase(), dataTypes.String, v.position, context);
        }
    );
}

function toLowerCase(INodes) {
    return new INodes.IBuiltInFunctionNode(
        dataTypes.String,
        "toLowerCase",
        [],
        (args, context) => {
            const v = INodes.IBuiltInFunctionNode.getArg("value", args);
            return new INodes.IStringNode(v.value.toLowerCase(), dataTypes.String, v.position, context);
        }
    );
}

function split(INodes) {
    return new INodes.IBuiltInFunctionNode(
        dataTypes.Array,
        "split",
        [
            { type: dataTypes.String, name: "delimiter" }
        ],
        (args, context) => {
            const v = INodes.IBuiltInFunctionNode.getArg("value", args);
            const d = INodes.IBuiltInFunctionNode.getArg("delimiter", args);

            return new INodes.IArrayNode(
                v.stripQuotes(v.value)
                    .split(d.stripQuotes(d.value))
                    .map(c => new INodes.IStringNode(`"${c}"`, dataTypes.String, v.position, context)),
                dataTypes.Array,
                v.position,
                context
            );
        }
    );
}

module.exports = {
    toUpperCase,
    toLowerCase,
    split
}