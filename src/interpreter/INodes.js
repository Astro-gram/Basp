const { dataTypes } = require("../constants.js");
const { Error } = require("../error.js");

const { toUpperCase, toLowerCase, split } = require("../builtInFunctions/string.js");
const { push, pop } = require("../builtInFunctions/array.js");

class INode {
    static INumberNode = "INumberNode";
    static IStringNode = "IStringNode";
    static IBooleanNode = "IBooleanNode";
    static IArrayNode = "IArrayNode";
    static IEnumNode = "IEnumNode";
    static IEnumValueNode = "IEnumValueNode";
    static IStructNode = "IStructNode";
    static IBaseStructNode = "IBaseStructNode";
    static IFunctionNode = "IFunctionNode";
    static IBuiltInFunctionNode = "IBuiltInFunctionNode";
    static IMultiResultNode = "IMultiResultNode";
    static IForceControlNode = "IForceControlNode";
    static IReturnNode = "IReturnNode";

    constructor(value, type, nodeType, position = null, context = null, properties = {}, methods = {}) {
        this.value = value;
        this.type = type;
        this.nodeType = nodeType;

        this.position = position;
        this.context = context;
        this.properties = properties;
        this.methods = methods;
        this.parent = null;
    }

    toString() {
        return `<INode ${this.nodeType}>`;
    }
}

class INumberNode extends INode {
    constructor(value, type, position = null, context = null) {
        super(Number(value), type, INode.INumberNode, position, context);
    }

    add(other) {
        if (other instanceof INumberNode) {
            return new INumberNode(this.value + other.value, this.type, this.position, this.context);
        }
    }

    sub(other) {
        if (other instanceof INumberNode) {
            return new INumberNode(this.value - other.value, this.type, this.position, this.context);
        }
    }

    mul(other) {
        if (other instanceof INumberNode) {
            return new INumberNode(this.value * other.value, this.type, this.position, this.context);
        }
    }

    div(other) {
        if (other instanceof INumberNode) {
            if (other.value === 0) {
                return new Error(other.position, Error.RuntimeError, "Can't divide by 0", this.context);
            }

            return new INumberNode(this.value / other.value, this.type, this.position, this.context);
        }
    }

    pow(other) {
        if (other instanceof INumberNode) {
            return new INumberNode(this.value ** other.value, this.type, this.position, this.context);
        }
    }

    mod(other) {
        if (other instanceof INumberNode) {
            return new INumberNode(this.value % other.value, this.type, this.position, this.context);
        }
    }
}

class IStringNode extends INode {
    constructor(value, type, position = null, context = null) {
        super(value, type, INode.IStringNode, position, context);

        this.properties = {
            length: () => new INumberNode(this.value.length - 2, dataTypes.Number, this.position)
        };

        this.methods = {
            toUpperCase: toUpperCase(module.exports),
            toLowerCase: toLowerCase(module.exports),
            split: split(module.exports),
        };
    }

    add(other) {
        if (other instanceof IStringNode) {
            return new IStringNode(`"${this.stripQuotes(this.value)}${this.stripQuotes(other.value)}"`, this.type, this.position, this.context);
        }
    }

    index(index) {
        const value = this.stripQuotes(this.value)[index];
        if (value === undefined) return value;

        return new IStringNode(`"${value}"`, this.type, this.position, this.context);
    }

    stripQuotes(value) {
        return value.replace(/"/g, "");
    }
}

class IBooleanNode extends INode {
    constructor(value, type, position = null, context = null) {
        super(value, type, INode.IBooleanNode, position, context);
    }
}

class IArrayNode extends INode {
    constructor(value, type, position = null, context = null) {
        super(getArrayValue(value), type, INode.IArrayNode, position, context);

        this.methods = {
            push: push(module.exports),
            pop: pop(module.exports)
        };

        this.properties = {
            length: () => new INumberNode(this.elements.length, dataTypes.Number, this.position)
        };

        this.elements = value;
        this.getValue = getArrayValue;
    }
}

class IEnumNode extends INode {
    constructor(value, type, position = null, context = null) {
        super(getEnumValue(value), type, INode.IEnumNode, position, context);

        this.elements = value.map(element => new IEnumValueNode(element, dataTypes.EnumValue, position, context));
        this.getValue = getEnumValue;
    }
}

class IEnumValueNode extends INode {
    constructor(value, type, position = null, context = null) {
        super(value, type, INode.IEnumValueNode, position, context);
    }

    wrap() {
        return new IEnumNode([this.value], dataTypes.Enum, this.position, this.context);
    }
}

class IBaseStructNode extends INode {
    constructor(name, structure, type, position = null, context = null) {
        super(getBaseStructValue(name, structure), type, INode.IBaseStructNode, position, context);

        this.name = name;
        this.structure = structure;
    }
}

class IStructNode extends INode {
    constructor(name, value, type, position = null, context = null) {

        super(getStructValue(name, value), type, INode.IStructNode, position, context);

        this.structure = value;
        this.name = name;
        this.update(false);
    }

    update(setValue = true) {
        if (this.structure === undefined) return;

        for (let i = 0; i < this.structure.length; i++) {
            this.structure[i].value.parent = this;

            if ([INode.IFunctionNode, INode.IBuiltInFunctionNode].includes(this.structure[i].value.nodeType)) {
                this.methods[this.structure[i].name] = this.structure[i].value;
            }
            else {
                this.properties[this.structure[i].name] = () => this.structure[i].value;
            }
        }

        if (setValue) {
            this.value = getStructValue(this.name, this.structure);

            let parentClone = this.parent;

            while (parentClone !== null) {
                parentClone.update();
                parentClone = parentClone.parent;
            }
        }
    }
}

class IBaseFunction {
    constructor(returnType, name, args, position, context) {
        this.returnType = returnType;
        this.name = name;
        this.args = args;
        this.type = dataTypes.Function;
        this.value = `${name}`;
        this.parent = null;

        this.position = position;
        this.context = context;

        this.properties = {
            name: () => new IStringNode(`"${this.name}"`, dataTypes.String, this.position, this.context)
        };
    }

    toString() {
        return this.value;
    }
}

class IFunctionNode extends IBaseFunction {
    constructor(returnType, name, args, body, position = null, context = null) {
        super(returnType, `fn ${name}`, args, position, context);

        this.body = body;
        this.nodeType = INode.IFunctionNode;
    }
}

class IBuiltInFunctionNode extends IBaseFunction {
    constructor(returnType, name, args, execute) {
        super(returnType, `built-in ${name}`, args);

        this.execute = execute;
        this.nodeType = INode.IBuiltInFunctionNode;
    }

    static getArg(wantedArg, args) {
        return args.filter(arg => arg.name === wantedArg)[0].value;
    }
}

class IMultiResultNode {
    constructor(nodes, position = null, context = null) {
        this.nodes = nodes;
        this.position = position;
        this.context = context;
        this.nodeType = INode.IMultiResultNode;
    }

    toString() {
        return `<INode ${this.nodeType}>`;
    }
}

class IForceControlNode {
    constructor(nodeToControl, continueControl = false, breakControl = false) {
        this.nodeToControl = nodeToControl;
        this.continue = continueControl;
        this.break = breakControl;
        this.nodeType = INode.IForceControlNode;
    }

    toString() {
        return `<INode ${this.nodeType}>`;
    }
}

class IReturnNode {
    constructor(value, nodeToReturnValueTo, position = null, context = null) {
        this.value = value;
        this.nodeToReturnValueTo = nodeToReturnValueTo;
        this.position = position;
        this.context = context;
        this.nodeType = INode.IReturnNode;
    }
}

const INodeTable = {
    "INumberNode": INumberNode,
    "IStringNode": IStringNode,
    "IBooleanNode": IBooleanNode,
    "IArrayNode": IArrayNode,
    "IEnumNode": IEnumNode,
    "IEnumValueNode": IEnumValueNode,
    "IStructNode": IStructNode,
    "IBaseStructNode": IBaseStructNode,
    "IFunctionNode": IFunctionNode,
    "IBuiltInFunctionNode": IBuiltInFunctionNode,
    "IMultiResultNode": IMultiResultNode,
    "IForceControlNode": IForceControlNode,
    "IReturnNode": IReturnNode,
};

module.exports = {
    INode,
    INumberNode,
    IStringNode,
    IBooleanNode,
    IArrayNode,
    IEnumNode,
    IEnumValueNode,
    IBaseStructNode,
    IStructNode,

    IFunctionNode,
    IBuiltInFunctionNode,

    IMultiResultNode,
    IForceControlNode,
    IReturnNode,

    INodeTable
};

function getArrayValue(elements) {
    if (elements === undefined) return "<Unknown>";
    let valueStr = "[ ";

    for (let i = 0; i < elements.length; i++) {
        valueStr += elements[i].value;

        if (i < elements.length - 1) {
            valueStr += ", ";
        }
    }

    return valueStr + " ]";
}

function getEnumValue(elements) {
    if (elements === undefined) return "<Unknown>";

    let valueStr = "{ ";

    for (let i = 0; i < elements.length; i++) {
        valueStr += elements[i];

        if (i < elements.length - 1) {
            valueStr += ", ";
        }
    }

    return valueStr + " }";
}

function getBaseStructValue(name, structure) {
    if (structure === undefined) return "<Unknown>";
    let valueStr = "";

    for (let i = 0; i < structure.length; i++) {
        if (structure[i].type.nodeType === INode.IBaseStructNode) {
            valueStr += `${structure[i].name}: ${getBaseStructValue(structure[i].type.name, structure[i].type.structure)}`;
        }
        else valueStr += `${structure[i].name}: ${structure[i].type}`;

        if (i < structure.length - 1) {
            valueStr += ", ";
        }
    }

    return `${name} { ${valueStr} }`;
}

function getStructValue(name, structure) {
    if (structure === undefined) return "<Unknown>";

    let valueStr = "";

    for (let i = 0; i < structure.length; i++) {
        if (structure[i].value.nodeType === INode.IBaseStructNode) {
            valueStr += `${structure[i].name}: ${getBaseStructValue(structure[i].value.name, structure[i].value.structure)}`;
        }
        else valueStr += `${structure[i].name}: ${structure[i].value.value}`;

        if (i < structure.length - 1) {
            valueStr += ", ";
        }
    }

    return `${name} { ${valueStr} }`;
}