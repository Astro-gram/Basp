const { dataTypes } = require("../constants.js");

//Had to import INodes as an argument because if I used require(), it would be an empty object

function push(INodes) {
    return new INodes.IBuiltInFunctionNode(
        dataTypes.Null,
        "push",
        [
            { type: dataTypes.Any, name: "newElement" }
        ],
        (args) => {
            const v = INodes.IBuiltInFunctionNode.getArg("value", args);
            const n = INodes.IBuiltInFunctionNode.getArg("newElement", args);

            const nClone = Object.assign(Object.create(Object.getPrototypeOf(n)), n);

            v.elements.push(nClone);
            v.value = v.getValue(v.elements);
        }
    );
}

function pop(INodes) {
    return new INodes.IBuiltInFunctionNode(
        dataTypes.Null,
        "pop",
        [],
        (args) => {
            const v = INodes.IBuiltInFunctionNode.getArg("value", args);
            
            v.elements.pop();
            v.value = v.getValue(v.elements);
        }
    );
}

module.exports = {
    push,
    pop
};