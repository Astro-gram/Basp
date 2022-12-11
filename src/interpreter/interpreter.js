const { Error } = require("../error.js");
const { isError, toBoolean, Context, SymbolTable, getImportMetadata, generateClass, checkASTErrors, checkInterpreterErrors } = require("../utils.js");

const { INumberNode, IStringNode, IBooleanNode, IArrayNode, IEnumNode, IBaseStructNode, IStructNode, IMultiResultNode, IForceControlNode, IFunctionNode, IReturnNode, INode } = require("./INodes.js");
const { Node } = require("../parser/nodes.js");
const ICompare = require("./compare.js");
const { dataTypes, assignmentOperators } = require("../constants.js");

let fs;
let path;

try {
    fs = require("fs");
    path = require("path");
}
catch {
    fs = null;
    path = null;
}

const lexer = require("../lexer.js");
const Parser = require("../parser/parser.js");
const Interpreter = require("../interpreter/interpreter.js");
const interpreterSetup = require("../interpreter/interpreterSetup.js");

module.exports = class Interpreter {
    async visit(node, context) {
        if (node === null || this[node.nodeType] === undefined) return new Error(undefined, Error.RuntimeError, `<Node: ${node === undefined || node === null ? node : node.nodeType}> was not expected`, context);

        const toVisit = this[node.nodeType].bind(this);
        return toVisit(node, context);
    }

    async Error(node, context) {
        node.context = context;
        return node;
    }

    async StatementsNode(node, context) {
        let statements = [];

        for (let i = 0; i < node.nodes.length; i++) {
            const statement = await this.visit(node.nodes[i], context);

            if (statement !== null && statement.error !== undefined) return statement;

            if (context.shouldReturn) return statement;
            if (context.shouldContinue || context.shouldBreak) break;
            
            if (!isError(statement) && statement.nodeType === INode.IForceControlNode) {
                if (statement.continue) statement.nodeToControl.shouldContinue = true;
                else if (statement.break) statement.nodeToControl.shouldBreak = true;

                break;
            }

            else if (!isError(statement) && statement.nodeType === INode.IReturnNode) {
                statement.nodeToReturnValueTo.shouldReturn = true;
                return statement;
            }

            if (statement === null) continue;
            statements.push(statement);
        }

        return new IMultiResultNode(statements, null, context);
    }

    async NumberNode(node, context) {
        return new INumberNode(node.token.value, node.token.type, node.token.position, context);
    }

    async StringNode(node, context) {
        return new IStringNode(node.token.value, node.token.type, node.token.position, context);
    }

    async BooleanNode(node, context) {
        return new IBooleanNode(node.token.value, node.token.type, node.token.position, context);
    }

    async BaseStructNode(node, context) {
        let structure = [];

        const structName = node.name.value;

        for (let i = 0; i < node.structure.length; i++) {
            const name = node.structure[i].identifier.value;
            const type = node.structure[i].dataType;
            const writable = node.structure[i].writable;

            if (type.nodeType === Node.VariableAccessNode) {
                const processedType = await this.visit(type, context);
                if (isError(processedType)) return processedType;

                if (processedType.nodeType !== INode.IBaseStructNode) {
                    return new Error(processedType.position, Error.RuntimeError, `Received non-struct type for identifier: "${name}" in struct`, context);
                }

                structure.push({ name, type: processedType, writable });
                continue;
            }

            structure.push({ name, type: type.value, writable });
        }

        return new IBaseStructNode(structName, structure, dataTypes.Struct, node.position, context);
    }

    async StructNode(node, context) {
        const baseStruct = await this.visit(node.name, context);
        if (isError(baseStruct)) return baseStruct;

        if (baseStruct.nodeType !== INode.IBaseStructNode) {
            return new Error(baseStruct.position, Error.RuntimeError, `Can't instantiate node: ${baseStruct}`, context);
        }

        if (baseStruct.structure.length !== node.args.length) {
            return new Error(node.position, Error.RuntimeError, `Expected ${baseStruct.structure.length} arguments. Received ${node.args.length} arguments`, context);
        }

        const args = await this._processArgs(true, node.args, baseStruct.structure, context);
        if (isError(args)) return args;

        return new IStructNode(baseStruct.name, args, dataTypes.Struct, node.position, context);
    }

    async ImportNode(node, context) {
        const file = await this.visit(node.file, context);
        const alias = node.alias;

        const filePath = path === null ? file.stripQuotes(file.value) : path.resolve(file.stripQuotes(file.value));

        if (file.nodeType !== INode.IStringNode) {
            return new Error(file.position, Error.RuntimeError, `Expected type ${dataTypes.String} for file path. Received: ${file.type}`, context);
        }

        if (context.global.importManager.has(file.value)) {
            return new Error(file.position, Error.RuntimeError, `Package: "${filePath}" has already been imported.`, context);
        }

        const meta = getImportMetadata(filePath, fs);
        let result = null;

        if (!meta.isFile) {
            const response = await fetch(meta.path);
            const responseJson = await response.json();
            
            if (!responseJson.success) {
                return new Error(position, Error.RuntimeError, `Basp package: "${filePath}" was not found`, context);
            }

            result = generateClass(responseJson.data.node, responseJson.data.data, context);
        }
        else {
            if (meta.path.error) {
                return new Error(file.position, Error.RuntimeError, meta.path.data, context);
            }

            if (context.parent !== null && context.parent.fileName === filePath) {
                return new Error(file.position, Error.RuntimeError, "Can't have circular imports", context);
            }

            //console.log(meta.path, context.fileName)

            const srcCode = fs.readFileSync(meta.path.data).toString();
            const tokens = lexer(srcCode);

            if (isError(tokens)) return tokens;

            const parser = new Parser(tokens);
            const ast = parser.parse();

            const astErrorResults = checkASTErrors(ast, false);
            if (astErrorResults.error) return astErrorResults.node;

            const interpreter = new Interpreter();
            const results = ast === false ? null : await interpreter.visit(ast, interpreterSetup(filePath, context));

            let data = [];

            const interpreterErrorResults = checkInterpreterErrors(results, false);
            if (!interpreterErrorResults.success) return interpreterErrorResults.node;

            for (let i = 0; i < node.imports.length; i++) {
                const keys = Object.keys(results.context.symbolTable.symbols);
                const values = Object.values(results.context.symbolTable.symbols);

                if (!keys.includes(node.imports[i].value)) {
                    return new Error(node.imports[i].position, Error.RuntimeError, `Package: ${file.value} doesn't contain variable: "${node.imports[i].value}"`, context);
                }

                const indexInArray = keys.indexOf(node.imports[i].value);

                if (alias !== null) {
                    data.push({
                        name: keys[indexInArray],
                        value: values[indexInArray],
                        writable: true
                    });
                }
                else {
                    if (!context.global.symbolTable.set(keys[indexInArray], values[indexInArray])) {
                        return new Error(node.alias.position, Error.RuntimeError, `Variable "${keys[indexInArray]}" is already defined`, context);
                    }
                }
            }

            result = new IStructNode("Exports", data, dataTypes.Struct, node.position, context);
        }

        if (alias !== null) {
            if (!context.global.symbolTable.set(alias.value, result)) {
                return new Error(node.alias.position, Error.RuntimeError, `Variable "${alias}" is already defined`, context);
            }
        }

        context.global.importManager.add(file);

        return null;
    }

    async UnaryOpNode(node, context) {
        let factor = await this.visit(node.token || node.node, context);
        if (isError(factor)) return factor;

        if (node.operationToken.type === "SUB") {
            factor = factor.mul(new INumberNode(-1));
        }

        else if (node.operationToken.type === "NOT") {
            factor = ICompare(factor, null, node.operationToken.type.toLowerCase());
        }

        return factor;
    }

    async BinOpNode(node, context) {
        const left = await this.visit(node.leftNode, context);
        if (isError(left)) return left;
        
        let operationFunc = node.operation;
        let assign = false;

        if (operationFunc === "dot") return this._processDotExpression(left, node, context);

        const right = await this.visit(node.rightNode, context);
        if (isError(right)) return right;

        if (assignmentOperators.includes(operationFunc)) {
            operationFunc = operationFunc.replace("_eq", "");
            assign = true;
        }

        let result = left[operationFunc] === undefined ? ICompare(left, right, operationFunc) : left[operationFunc](right);
        if (isError(result)) return new Error(node.operationToken.position, Error.RuntimeError, `Can't do operations on type ${right.type} to ${left.type}`, context);

        if (assign) {
            if (node.leftIdentifierValue === undefined) {
                const propertyName = await this._getPropertyName(node.leftNode);
                if (left.parent === null) return new Error(node.operationToken.position, Error.RuntimeError, `Can't assign to immutable property: "${propertyName}"`, context);
                
                const property = left.parent.structure.filter(value => value.name === propertyName)[0];

                if (!property.writable) return new Error(node.operationToken.position, Error.RuntimeError, `Can't assign to immutable property: "${propertyName}"`, context);

                property.value = right;
                left.parent.update();

                return null;
            }

            context.symbolTable.update(node.leftIdentifierValue, result);
            return null;
        }

        return result;
    }

    async ArrayNode(node, context) {
        let elements = [];

        for (let i = 0; i < node.elements.length; i++) {
            const value = await this.visit(node.elements[i], context);
            if (isError(value)) return value;

            elements.push(value);
        }

        return new IArrayNode(elements, node.type, node.position, context);
    }

    async EnumNode(node, context) {
        return new IEnumNode(node.elements, node.type, node.position, context);
    }

    async VariableAssignNode(node, context) {
        const name = node.name.value;
        const position = node.name.position;
        let type = node.type.value;

        const value = await this.visit(node.value, context);
        if (isError(value)) return value;

        if (value.nodeType === INode.IStructNode) {
            if (value.name !== type) {
                return new Error(position, Error.RuntimeError, `Can't assign data type: "${value.name}" to "${type}"`, context);
            }

            type = value.type;
        }

        if (convertToDatatypes(type) !== value.type) {
            return new Error(position, Error.RuntimeError, `Can't assign type ${value.type} to ${type.toUpperCase()}`, context);
        }

        if (!context.symbolTable.set(name, value)) {
            return new Error(position, Error.RuntimeError, `Variable "${name}" is already defined`, context);
        }

        return null;
    }

    async VariableAccessNode(node, context) {
        const name = node.name.value;

        let value = context.symbolTable.get(name);

        if (value === undefined) {
            return new Error(node.name.position, Error.RuntimeError, `Variable "${name}" is not defined`, context);
        }

        return this._processIndexes(value, node.indexes, node.name.position, context);
    }

    async CallNode(node, context) {
        let func = await this.visit(node.nodeToCall, context);
        if (isError(func)) return func;

        if (func.nodeType !== INode.IFunctionNode && func.nodeType !== INode.IBuiltInFunctionNode) {
            return new Error(node.nodeToCall.name.position, Error.RuntimeError, `${func} is not a function`, context);
        }

        if (func.body === null) return null;

        func.context = new Context(func.value, new SymbolTable(context.symbolTable), context, false, true);

        if (node.args.length !== func.args.length) {
            return new Error(node.nodeToCall.name.position, Error.RuntimeError, `Expected ${func.args.length} arguments. Received ${node.args.length} arguments`, context);
        }

        const isBuiltInFunction = func.nodeType === INode.IBuiltInFunctionNode ? true : false;

        let builtInFunctionArgs = await this._processArgs(isBuiltInFunction, node.args, func.args, context, func);
        if (isError(builtInFunctionArgs)) return builtInFunctionArgs;

        let result = undefined;

        if (isBuiltInFunction) {
            func.context.parent = context;
            result = functionReturnFormat(await func.execute(builtInFunctionArgs, func.context, node.nodeToCall.name.position), func);
        }
        else result = functionReturnFormat(await this.visit(func.body, func.context), func);

        if (isError(result)) return result;
        if (isError(result.value)) return result.value;

        if (result.type !== func.returnType && func.returnType !== dataTypes.Null) {
            return new Error(node.nodeToCall.name.position, Error.TypeError, `Expected return type: ${func.returnType}. Received: ${result.type}`, func.context);
        }
        
        return result.value;
    }

    async FunctionNode(node, context) {
        const name = node.name.value;
        const returnType = convertToDatatypes(node.returnType.value);
        const args = [];

        for (let i = 0; i < node.args.length; i++) {
            args.push({
                type: convertToDatatypes(node.args[i].type.value || node.args[i].type),
                name: node.args[i].name.value
            });
        }

        const func = new IFunctionNode(returnType, name, args, node.body, node.name.position);
        func.context = new Context(func.value, new SymbolTable(context.symbolTable), context, false, true);
        
        if (!context.symbolTable.set(name, func)) {
            return new Error(node.name.position, Error.RuntimeError, `Function ${name}() is already defined`, context);
        }

        return null;
    }

    async ContinueNode(node, context) {
        const controllableNode = context.isForceControllable();
        if (controllableNode === null) return new Error(node.position, Error.InvalidSyntaxError, `Illegal continue statement`, context);

        return new IForceControlNode(controllableNode, true, false);
    }

    async BreakNode(node, context) {
        const controllableNode = context.isForceControllable();
        if (controllableNode === null) return new Error(node.position, Error.InvalidSyntaxError, `Illegal break statement`, context);

        return new IForceControlNode(controllableNode, false, true);
    }

    async ReturnNode(node, context) {
        const nodeToReturnValueTo = context.isReturnable();
        if (nodeToReturnValueTo === null) return new Error(node.position, Error.InvalidSyntaxError, `Illegal return statement`, context);

        const value = await this.visit(node.nodeToReturn, context);

        return new IReturnNode(value, nodeToReturnValueTo, node.position, context);
    }

    async IfNode(node, context) {
        const newContext = new Context("IfNode", new SymbolTable(context.symbolTable), context);

        for (let i = 0; i < node.cases.length; i++) {
            const condition = await this.visit(node.cases[i].condition, newContext);
            if (isError(condition)) return condition;

            if (toBoolean(condition.value)) { 
                return this.visit(node.cases[i].expr, newContext);
            }
        }

        if (node.elseCase !== null) {
            return this.visit(node.elseCase, newContext);
        }

        return null;
    }

    async WhileNode(node, context) {
        const newContext = new Context("WhileNode", new SymbolTable(context.symbolTable), context, true);

        if (node.body === null) return null;
        let condition = await this.visit(node.condition, newContext);
        if (isError(condition)) return condition;

        let result = [];

        while (toBoolean(condition.value)) {
            newContext.symbolTable.clear();
            
            const statements = await this.visit(node.body, newContext);
            if (isError(statements)) return statements;

            if (statements.nodeType === INode.IReturnNode) return statements;

            result.push(statements);

            if (newContext.shouldContinue) newContext.shouldContinue = false;
            else if (newContext.shouldBreak) break;

            condition = await this.visit(node.condition, newContext);
        }

        return new IMultiResultNode(result, null, context);
    }

    async ForNode(node, context) {
        const newContext = new Context("ForNode", new SymbolTable(context.symbolTable), context, true);

        if (node.body === null) return null;

        let controls = {
            start: 0,
            end: 0,
            step: 1,
            value: null
        }

        if (Array.isArray(node.controls)) {
            let interpretedControls = [];

            for (let i = 0; i < node.controls.length; i++) {
                const control = await this.visit(node.controls[i], context);
                if (isError(control)) return control;

                if (control.type !== dataTypes.Number) {
                    return new Error(control.position, Error.RuntimeError, `Expected type ${dataTypes.Number}. Received: ${control.type}`, newContext);
                }

                interpretedControls.push(control);
            }

            controls.start = interpretedControls[0].value;
            controls.end = interpretedControls[1].value;
            controls.step = interpretedControls[2].value;
        }
        else {
            const variable = await this.visit(node.controls, newContext);
            if (isError(variable)) return variable;

            controls.end = variable.elements ? variable.elements.length : variable.value;
            controls.value = variable.elements ? variable.elements : null;

            if (isNaN(controls.end)) {
                return new Error(variable.position, Error.RuntimeError, `Can't loop through type: ${variable.type}`, newContext);
            }
        }

        const variableName = node.variableName.value;

        let index = new INumberNode(controls.start, dataTypes.Number, node.variableName.position, newContext);
        let continueLooping = true;

        if (!newContext.symbolTable.set(variableName, controls.value === null ? new INumberNode(index.value, index.type, index.position, newContext) : controls.value[index.value])) {
            return new Error(node.variableName.position, Error.RuntimeError, `Variable '${variableName}' already exists`, newContext);
        }

        let result = [];

        while (continueLooping) {
            if ((controls.step >= 0 && index.value >= (controls.end - controls.step)) || (controls.step < 0 && index.value <= (controls.end - controls.step))) {
                continueLooping = false;

                if (controls.start === 0 && controls.end === 0) {
                    break;
                }
            }

            const statements = await this.visit(node.body, newContext);

            if (statements === null) {
                index.value += controls.step;
                newContext.symbolTable.clear();
                newContext.symbolTable.update(variableName, controls.value === null ? new INumberNode(index.value, index.type, index.position, newContext) : controls.value[index.value]);
                continue;
            }

            if (isError(statements)) return statements;

            if (statements.nodeType === INode.IReturnNode) return statements;

            result.push(statements);

            if (newContext.shouldContinue) newContext.shouldContinue = false;
            else if (newContext.shouldBreak) break;

            index.value += controls.step;
            newContext.symbolTable.clear();

            newContext.symbolTable.update(variableName, controls.value === null ? new INumberNode(index.value, index.type, index.position, newContext) : controls.value[index.value]);
        }

        return result.length === 0 ? null : new IMultiResultNode(result, null, context);
    }

    async _processDotExpression(left, node, context, processRightNode = true) {
        const nodeToProcess = processRightNode ? node.rightNode : node.leftNode;

        if (isError(left)) return left;

        //Get Methods
        if (nodeToProcess.nodeType === Node.BinOpNode) {
            const result = await this._processDotExpression(left, nodeToProcess, context, false);
            return this._processDotExpression(result, nodeToProcess, context, true);
        }

        else if (nodeToProcess.nodeType === Node.CallNode) {
            if (left.methods[nodeToProcess.functionName] === undefined) {
                return new Error(node.operationToken.position, Error.RuntimeError, `${left} doesn't contain method: "${nodeToProcess.functionName}()"`, context);
            }

            const receivedArgs = nodeToProcess.args;
            const expectedArgs = left.methods[nodeToProcess.functionName].args;

            if (receivedArgs.length !== expectedArgs.length) {
                return new Error(nodeToProcess.nodeToCall.name.position, Error.RuntimeError, `Expected ${expectedArgs.length} arguments. Received ${receivedArgs.length} arguments`, context);
            }

            const isBuiltInFunction = left.methods[nodeToProcess.functionName].nodeType === INode.IFunctionNode ? false : true;

            const func = left.methods[nodeToProcess.functionName];
            if (func.context === undefined) func.context = new Context(func.value, new SymbolTable(context.symbolTable), context, false, true);

            const args = await this._processArgs(isBuiltInFunction, receivedArgs, expectedArgs, context, left.methods[nodeToProcess.functionName]);
            if (isError(args)) return args;

            if (isBuiltInFunction) args.push({ name: "value", value: left });

            let result;

            if (isBuiltInFunction) {
                result = functionReturnFormat(await func.execute(args, func.context), func);
            }
            else {
                result = functionReturnFormat(await this.visit(func.body, func.context), func);
            }

            if (isError(result)) return result;
            if (isError(result.value)) return result.value;

            if (result.type !== func.returnType && func.returnType !== dataTypes.Null) {
                return new Error(left.position, Error.TypeError, `Expected return type: ${func.returnType}. Received: ${result.type}`, func.context);
            }

            return result.value;
        }


        //Get Properties

        const identifierValue = processRightNode ? node.rightIdentifierValue : node.leftIdentifierValue;
        const indexes = processRightNode ? node.rightIdentifierIndexes : node.leftIdentifierIndexes;

        if (left.type === dataTypes.Enum) {
            const result = left.elements.filter(enumValue => enumValue.value === identifierValue)[0];
            return result !== undefined ? result : new Error(node.operationToken.position, Error.RuntimeError, `${left} doesn't contain value: "${identifierValue}"`, context);
        }

        if (!Object.keys(left.properties).includes(identifierValue)) {
            return new Error(node.operationToken.position, Error.RuntimeError, `${left} doesn't contain property: "${identifierValue}"`, context);
        }

        return this._processIndexes(left.properties[identifierValue](), indexes, node.operationToken.position, context);
    }

    async _processArgs(getResult, args, expectedArgs, context, func = null) {
        let builtInFunctionArgs = [];

        for (let i = 0; i < args.length; i++) {
            let argValue = await this.visit(args[i], context);
            if (isError(argValue)) return argValue;

            if (argValue.type === dataTypes.EnumValue) argValue = argValue.wrap();
            
            const expectedType = convertToDatatypes(expectedArgs[i].type.nodeType === INode.IBaseStructNode ? expectedArgs[i].type.type : expectedArgs[i].type);

            if (expectedType !== argValue.type && expectedType !== dataTypes.Any) {
                return new Error(argValue.position, Error.RuntimeError, `Expected type: ${expectedType}. Received: ${argValue.type}`, func === null ? context : func.context);
            }

            if (!getResult && func !== null && !func.context.symbolTable.set(expectedArgs[i].name, argValue)) {
                return new Error(argValue.position, Error.RuntimeError, `Argument name: "${expectedArgs[i].name}" is already taken`);
            }
            else {
                const result = {
                    name: expectedArgs[i].name,
                    value: argValue,
                };

                if (expectedArgs[i].writable !== undefined) result.writable = expectedArgs[i].writable;

                builtInFunctionArgs.push(result);
            }
        }

        return getResult ? builtInFunctionArgs : true;
    }

    async _getPropertyName(node) {
        if (node.nodeType === Node.BinOpNode) {
            return this._getPropertyName(node.rightNode);
        }

        return node.nodeType === Node.VariableAccessNode ? node.name.value : node.functionName;
    }

    async _processIndexes(value, indexes, position, context) {
        if (indexes.length > 0 && ![dataTypes.Array, dataTypes.Enum, dataTypes.String].includes(value.type)) {
            return new Error(position, Error.RuntimeError, `Data type: ${value.type} is not indexable`, context);
        }

        for (let i = 0; i < indexes.length; i++) {
            const index = await this.visit(indexes[i], context);
            if (isError(index)) return index;

            if (index.nodeType !== INode.INumberNode) return new Error(position, Error.RuntimeError, `Unexpected type received for index: ${index}`, context);

            value = value.elements === undefined ? value.index(index.value) : value.elements[index.value];

            if (value === undefined) {
                return new Error(position, Error.IndexOutOfBoundsError, `Index out of bounds: ${index.value}`, context);
            }
        }

        return value;
    }
}

function convertToDatatypes(type) {
    if (type === "int" || type === "INT") return dataTypes.Number;
    else if (type === "fn") return dataTypes.Function;
    return type.toUpperCase();
}

function functionReturnFormat(input, func) {
    let result = {
        type: dataTypes.Number,
        value: new INumberNode(0, dataTypes.Number, null, func.context)
    };

    if (input !== undefined && input.error !== undefined) return input;

    if (func.returnType === dataTypes.Null && func.nodeType === INode.IBuiltInFunctionNode) return result;

    if (input.nodeType !== INode.IMultiResultNode && func.returnType === dataTypes.Null) return new Error(func.position, Error.RuntimeError, "No return value expected", func.context);
    else if (input.nodeType === INode.IMultiResultNode && func.returnType !== dataTypes.Null) return new Error(func.position, Error.RuntimeError, "Expected return value", func.context);

    else if (input.nodeType === INode.IReturnNode) {
        result.value = input.value.type === dataTypes.EnumValue ? input.value.wrap() : input.value;
        result.type = result.value.type;
    }
    else if (input.nodeType !== INode.IMultiResultNode) {
        result.value = input;
        result.type = input.type;
    }

    return result;
}