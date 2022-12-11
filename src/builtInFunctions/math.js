const { dataTypes } = require("../constants.js");
const { IBuiltInFunctionNode, INumberNode, IStringNode, IStructNode } = require("../interpreter/INodes.js");

function Floor() {
    return new IBuiltInFunctionNode(
        dataTypes.Number,
        "Floor",
        [
            { type: dataTypes.Any, name: "v" }
        ],
        (args, context) => {
            const v = IBuiltInFunctionNode.getArg("v", args);
            return new INumberNode(Math.floor(v.value), dataTypes.Number, v.position, context);
        }
    );
}

function Ceil() {
    return new IBuiltInFunctionNode(
        dataTypes.Number,
        "Ceil",
        [
            { type: dataTypes.Any, name: "v" }
        ],
        (args, context) => {
            const v = IBuiltInFunctionNode.getArg("v", args);
            return new INumberNode(Math.ceil(v.value), dataTypes.Number, v.position, context);
        }
    );
}

function Round() {
    return new IBuiltInFunctionNode(
        dataTypes.Number,
        "Round",
        [
            { type: dataTypes.Any, name: "v" }
        ],
        (args, context) => {
            const v = IBuiltInFunctionNode.getArg("v", args);
            return new INumberNode(Math.round(v.value), dataTypes.Number, v.position, context);
        }
    );
}

function Abs() {
    return new IBuiltInFunctionNode(
        dataTypes.Number,
        "Abs",
        [
            { type: dataTypes.Any, name: "v" }
        ],
        (args, context) => {
            const v = IBuiltInFunctionNode.getArg("v", args);
            return new INumberNode(Math.abs(v.value), dataTypes.Number, v.position, context);
        }
    );
}

function Sqrt() {
    return new IBuiltInFunctionNode(
        dataTypes.Number,
        "Sqrt",
        [
            { type: dataTypes.Any, name: "v" }
        ],
        (args, context) => {
            const v = IBuiltInFunctionNode.getArg("v", args);
            return new INumberNode(Math.sqrt(v.value), dataTypes.Number, v.position, context);
        }
    );
}

function Random() {
    return new IBuiltInFunctionNode(
        dataTypes.Number,
        "Random",
        [],
        (args, context) => {
            return new INumberNode(Math.random(), dataTypes.Number, null, context);
        }
    );
}

function getMath() {
    const methods = [
        { name: "Floor", value: Floor(), writable: false },
        { name: "Ceil", value: Ceil(), writable: false },
        { name: "Round", value: Round(), writable: false },
        { name: "Abs", value: Abs(), writable: false },
        { name: "Sqrt", value: Sqrt(), writable: false },
        { name: "Random", value: Random(), writable: false },
    ];

    const properties = [
        { name: "PI", value: new INumberNode(Math.PI, dataTypes.Number), writable: false },
    ];

    return new IStructNode("Math", methods.concat(properties), dataTypes.Struct);
}

module.exports = {
    getMath
};