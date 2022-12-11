const { IBuiltInFunctionNode, IBooleanNode, IStringNode } = require("../interpreter/INodes.js");
const { dataTypes } = require("../constants.js");

function IsArray() {
    return new IBuiltInFunctionNode(
        dataTypes.Bool,
        "IsArray",
        [
            { type: dataTypes.Any, name: "array" }
        ],
        (args, context) => {
            const arg = IBuiltInFunctionNode.getArg("array", args);
            return new IBooleanNode(arg.type === dataTypes.Array ? "True" : "False", dataTypes.Bool, arg.position, context);
        }
    );
}

function IsNumber() {
    return new IBuiltInFunctionNode(
        dataTypes.Bool,
        "IsNumber",
        [
            { type: dataTypes.Any, name: "number" }
        ],
        (args, context) => {
            const arg = IBuiltInFunctionNode.getArg("number", args);
            return new IBooleanNode(arg.type === dataTypes.Number ? "True" : "False", dataTypes.Bool, arg.position, context);
        }
    );
}

function IsString() {
    return new IBuiltInFunctionNode(
        dataTypes.Bool,
        "IsString",
        [
            { type: dataTypes.Any, name: "string" }
        ],
        (args, context) => {
            const arg = IBuiltInFunctionNode.getArg("string", args);
            return new IBooleanNode(arg.type === dataTypes.String ? "True" : "False", dataTypes.Bool, arg.position, context);
        }
    );
}

function IsEnum() {
    return new IBuiltInFunctionNode(
        dataTypes.Bool,
        "IsEnum",
        [
            { type: dataTypes.Any, name: "enum" }
        ],
        (args, context) => {
            const arg = IBuiltInFunctionNode.getArg("enum", args);
            return new IBooleanNode(arg.type === dataTypes.Enum ? "True" : "False", dataTypes.Bool, arg.position, context);
        }
    );
}

function IsBoolean() {
    return new IBuiltInFunctionNode(
        dataTypes.Bool,
        "IsBoolean",
        [
            { type: dataTypes.Any, name: "boolean" }
        ],
        (args, context) => {
            const arg = IBuiltInFunctionNode.getArg("boolean", args);
            return new IBooleanNode(arg.type === dataTypes.Bool ? "True" : "False", dataTypes.Bool, arg.position, context);
        }
    );
}

function IsFunction() {
    return new IBuiltInFunctionNode(
        dataTypes.Bool,
        "IsFunction",
        [
            { type: dataTypes.Any, name: "function" }
        ],
        (args, context) => {
            const arg = IBuiltInFunctionNode.getArg("function", args);
            return new IBooleanNode(arg.type === dataTypes.Function ? "True" : "False", dataTypes.Bool, arg.position, context);
        }
    );
}

function Typeof() {
    return new IBuiltInFunctionNode(
        dataTypes.String,
        "Typeof",
        [
            { type: dataTypes.Any, name: "input" }
        ],
        (args, context) => {
            const arg = IBuiltInFunctionNode.getArg("input", args);
            return new IStringNode(`"${arg.type}"`, dataTypes.String, arg.position, context);
        }
    );
}

module.exports = {
    IsArray,
    IsNumber,
    IsString,
    IsEnum,
    IsBoolean,
    IsFunction,

    Typeof
};