//////////////////////////////////////////////////
//                   GENERAL                    //
//////////////////////////////////////////////////

class Node {
    static StatementsNode = "StatementsNode";
    static NumberNode = "NumberNode";
    static UnaryOpNode = "UnaryOpNode";
    static BinOpNode = "BinOpNode";
    static ArrayNode = "ArrayNode";
    static EnumNode = "EnumNode";
    static BaseStructNode = "BaseStructNode";
    static StructNode = "StructNode";
    static VariableAssignNode = "VariableAssignNode";
    static VariableAccessNode = "VariableAccessNode";
    static IfNode = "IfNode";
    static ForNode = "ForNode";
    static WhileNode = "WhileNode";
    static CallNode = "CallNode";
    static FunctionNode = "FunctionNode";
    static ReturnNode = "ReturnNode";
    static BreakNode = "BreakNode";
    static ContinueNode = "ContinueNode";
    static ImportNode = "ImportNode";

    constructor(nodeType) {
        this.nodeType = nodeType;
    }

    toString() {
        return `<Node ${this.nodeType}>`;
    }
}

class StatementsNode extends Node {
    constructor(nodes) {
        super("StatementsNode");

        this.nodes = nodes;
    }
}

//////////////////////////////////////////////////
//                  DATA TYPES                  //
//////////////////////////////////////////////////

class NumberNode extends Node {
    constructor(token) {
        super("NumberNode");

        this.token = token;
    }
}

class UnaryOpNode extends Node {
    constructor(operationToken, node) {
        super("UnaryOpNode");

        this.operationToken = operationToken;
        this.node = node;
    }
}

class BinOpNode extends Node {
    constructor(leftNode, operationToken, rightNode) {
        super("BinOpNode");

        this.leftNode = leftNode;
        this.operationToken = operationToken;
        this.rightNode = rightNode;
    }

    get operation() {
        return this.operationToken.type.toLowerCase();
    }

    get leftIdentifierValue() {
        return this.leftNode.name?.value;
    }

    get leftIdentifierIndexes() {
        return this.leftNode.indexes;
    }

    get rightIdentifierValue() {
        return this.rightNode.name?.value;
    }

    get rightIdentifierIndexes() {
        return this.rightNode.indexes;
    }
}

class StringNode extends Node {
    constructor(token) {
        super("StringNode");

        this.token = token;
    }
}

class BooleanNode extends Node {
    constructor(token) {
        super("BooleanNode");

        this.token = token;
    }
}

class ArrayNode extends Node {
    constructor(elements, type, position) {
        super("ArrayNode");

        this.elements = elements;
        this.type = type;
        this.position = position;
    }
}

class EnumNode extends Node {
    constructor(elements, type, position) {
        super("EnumNode");

        this.elements = elements;
        this.type = type;
        this.position = position;
    }
}

class BaseStructNode extends Node {
    constructor(name, structure, position) {
        super("BaseStructNode");

        this.name = name;
        this.structure = structure;
        this.position = position;
    }
}

class StructNode extends Node {
    constructor(name, args, position) {
        super("StructNode");

        this.name = name;
        this.args = args;
        this.position = position;
    }
}

//////////////////////////////////////////////////
//                  VARIABLES                   //
//////////////////////////////////////////////////

class VariableAssignNode extends Node {
    constructor(name, value, type) {
        super("VariableAssignNode");

        this.name = name;
        this.value = value;
        this.type = type;
    }
}

class VariableAccessNode extends Node {
    constructor(name, indexes = []) {
        super("VariableAccessNode");

        this.name = name;
        this.indexes = indexes;
    }
}

//////////////////////////////////////////////////
//                   KEYWORDS                   //
//////////////////////////////////////////////////

class IfNode extends Node {
    constructor(cases, elseCase) {
        super("IfNode");

        this.cases = cases;
        this.elseCase = elseCase;
    }
}

class ForNode extends Node {
    constructor(variableName, controls, body) {
        super("ForNode");

        this.variableName = variableName;
        this.controls = controls;
        this.body = body;
    }
}

class WhileNode extends Node {
    constructor(condition, body) {
        super("WhileNode");

        this.condition = condition;
        this.body = body;
    }
}

class ImportNode extends Node {
    constructor(imports, file, alias, position) {
        super("ImportNode");

        this.imports = imports;
        this.file = file;
        this.alias = alias;
        this.position = position;
    }
}

//////////////////////////////////////////////////
//                    FUNCTION                  //
//////////////////////////////////////////////////

class CallNode extends Node {
    constructor(nodeToCall, args) {
        super("CallNode");

        this.nodeToCall = nodeToCall;
        this.args = args;
    }

    get functionName() {
        return this.nodeToCall.name.value;
    }
}

class FunctionNode extends Node {
    constructor(returnType, name, args, body) {
        super("FunctionNode");

        this.returnType = returnType;
        this.name = name;
        this.args = args;
        this.body = body;
    }
}

//////////////////////////////////////////////////
//                FORCE CONTROLS                //
//////////////////////////////////////////////////

class ReturnNode extends Node {
    constructor(nodeToReturn, position) {
        super("ReturnNode");

        this.nodeToReturn = nodeToReturn;
        this.position = position;
    }
}

class BreakNode extends Node {
    constructor(position) {
        super("BreakNode");

        this.position = position;
    }
}

class ContinueNode extends Node {
    constructor(position) {
        super("ContinueNode");

        this.position = position;
    }
}


module.exports = {
    Node,
    StatementsNode,

    NumberNode,
    BinOpNode,
    UnaryOpNode,
    StringNode,
    BooleanNode,
    ArrayNode,
    EnumNode,
    BaseStructNode,
    StructNode,

    VariableAssignNode,
    VariableAccessNode,

    IfNode,
    ForNode,
    WhileNode,
    ImportNode,

    CallNode,
    FunctionNode,

    ReturnNode,
    BreakNode,
    ContinueNode,
};