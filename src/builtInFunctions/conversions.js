const { IBuiltInFunctionNode, INumberNode, IStringNode } = require("../interpreter/INodes.js");
const { dataTypes } = require("../constants.js");

function NumberType() {
    return new IBuiltInFunctionNode(
        dataTypes.Number, //Return Type
        "Number", //Function Name
        [
            //Arguments
            { type: dataTypes.String, name: "string" } 
        ],
        (args, context) => { 
            //Function
            const strNumber = IBuiltInFunctionNode.getArg("string", args);
            return new INumberNode(Number(strNumber.stripQuotes(strNumber.value)), dataTypes.Number, strNumber.position, context);
        }
    );
}

function StringType() {
    return new IBuiltInFunctionNode(
        dataTypes.String,
        "String",
        [
            { type: dataTypes.Any, name: "value" } 
        ],
        (args, context) => { 
            const number = IBuiltInFunctionNode.getArg("value", args);
            return new IStringNode(`"${number.value}"`, dataTypes.String, number.position, context);
        }
    );
}

module.exports = {
    StringType,
    NumberType
};