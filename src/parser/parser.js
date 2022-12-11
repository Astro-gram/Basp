const { Error } = require("../error.js");
const { isError } = require("../utils.js");
const { dataTypes, tokenTypes } = require("../constants.js");

const {
    Node,
    StatementsNode,
    NumberNode,
    BinOpNode,
    UnaryOpNode,
    StringNode,
    BooleanNode,
    VariableAccessNode,
    VariableAssignNode,
    IfNode,
    ArrayNode,
    EnumNode,
    BaseStructNode,
    StructNode,
    ForNode,
    WhileNode,
    ImportNode,
    CallNode,
    FunctionNode,
    ReturnNode,
    BreakNode,
    ContinueNode
} = require("./nodes.js");

module.exports = class Parser {
    constructor(tokens) {
        this.tokens = tokens;
    }

    parse() {
        return this.statements(false);
    }



    
    //Tree Making Functions

    statements(inBrackets) {
        let statements = [];
        
        while (this.tokens.currentToken.type !== tokenTypes.EOF) {
            while (this.tokens.currentToken.type === tokenTypes.NEWLINE) {
                this.tokens.advance();
            }

            if (inBrackets && this.tokens.currentToken.type === tokenTypes.RBRACKET) break;

            const statement = this.statement();
            statements.push(statement);

            if (isError(statement)) break;
        }

        return new StatementsNode(statements);
    }

    statement() {
        const currentPosition = this.tokens.currentToken.position;

        if (this.tokens.currentToken.matches(tokenTypes.KEYWORD, "return")) {
            this.tokens.advance();

            const expr = this.expr();
            if (isError(expr)) return expr;

            return new ReturnNode(expr, currentPosition);
        }

        else if (this.tokens.currentToken.matches(tokenTypes.KEYWORD, "break")) {
            this.tokens.advance();
            return new BreakNode(currentPosition);
        }

        else if (this.tokens.currentToken.matches(tokenTypes.KEYWORD, "continue")) {
            this.tokens.advance();
            return new ContinueNode(currentPosition);
        }

        return this.expr();
    }

    expr() {
        if (this.tokens.currentToken.type === tokenTypes.TYPE) {
            const variableType = this.tokens.currentToken;
            const isStruct = variableType.value.toUpperCase() === dataTypes.Struct;
            this.tokens.advance();

            const variableName = this.tokens.currentToken;

            if (this.tokens.currentToken.type !== tokenTypes.IDENTIFIER) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected identifier after type declaration");
            }

            this.tokens.advance();

            if (!isStruct) {
                if (this.tokens.currentToken.type !== tokenTypes.ASSIGN) {
                    return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected assignment after identifier declaration");
                }
    
                this.tokens.advance();
            }

            let value = isStruct ? this.structExpr(variableName) : this.expr();

            if (isError(value)) return value;

            return new VariableAssignNode(variableName, value, variableType);
        }

        else if (this.tokens.currentToken.type === tokenTypes.IDENTIFIER) {
            const result = this.checkInitStruct();
            if (result !== null) return result;
        }

        return this.binOp(this.compExpr.bind(this), [tokenTypes.OR, tokenTypes.AND]);
    }

    compExpr() {
        if (this.tokens.currentToken.type === tokenTypes.NOT) {
            const operationToken = this.tokens.currentToken;
            this.tokens.advance();

            const node = this.compExpr();
            if (isError(node)) return node;

            return new UnaryOpNode(operationToken, node);
        }

        return this.binOp(this.assignmentExpr.bind(this), [tokenTypes.EQ, tokenTypes.NEQ, tokenTypes.GT, tokenTypes.GTE, tokenTypes.LT, tokenTypes.LTE]);
    }

    assignmentExpr() {
        return this.binOp(this.arithExpr.bind(this), [tokenTypes.ADD_EQ, tokenTypes.SUB_EQ, tokenTypes.MUL_EQ, tokenTypes.DIV_EQ, tokenTypes.MOD_EQ, tokenTypes.ASSIGN]);
    }

    arithExpr() {
        return this.binOp(this.term.bind(this), [tokenTypes.ADD, tokenTypes.SUB]);
    }

    term() {
        return this.binOp(this.factor.bind(this), [tokenTypes.MUL, tokenTypes.DIV, tokenTypes.MOD]);
    }

    factor() {
        const currentToken = this.tokens.currentToken;

        if (currentToken === null) return;
        
        if ([tokenTypes.SUB, tokenTypes.ADD, tokenTypes.NOT].includes(currentToken.type)) {
            this.tokens.advance();

            const factor = this.factor();

            if (isError(factor)) return factor;

            return new UnaryOpNode(currentToken, factor);
        }
        
        return this.power();
    }

    power() {
        return this.binOp(this.dot.bind(this), [tokenTypes.POW], this.factor.bind(this));
    }

    dot() {
        let call = this.call();
        const currentToken = this.tokens.currentToken;

        if (currentToken.type === tokenTypes.DOT) {
            this.tokens.advance();

            const call2 = this.dot();
            if (isError(call2)) return call2;

            if (call.nodeType === Node.NumberNode && call2.nodeType === Node.NumberNode) call.token.value = `${call.token.value}.${call2.token.value}`;
            else return new BinOpNode(call, currentToken, call2);
        }

        return call;
    }

    call() {
        const atom = this.atom();

        if (this.tokens.currentToken.type === tokenTypes.LPAR) {
            const args = this.getArgs();
            if (isError(args)) return args;
            
            this.tokens.advance();

            return new CallNode(atom, args);
        }

        return atom;
    }

    atom() {
        const currentToken = this.tokens.currentToken;

        this.tokens.advance();

        if (currentToken === null) return null;

        if (currentToken.type === dataTypes.Number) return new NumberNode(currentToken);
        else if (currentToken.type === dataTypes.String) return new StringNode(currentToken);
        else if (currentToken.type === dataTypes.Bool) return new BooleanNode(currentToken);
        else if (currentToken.type === tokenTypes.IDENTIFIER) {
            const index = this.getIndexedValue(true, null);
            if (isError(index)) return index;

            return new VariableAccessNode(currentToken, index);
        }

        else if (currentToken.type === tokenTypes.LPAR) {
            const result = this.expr();
            if (isError(result)) return result;

            if (this.tokens.currentToken.type !== tokenTypes.RPAR) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected ')'`);
            }

            this.tokens.advance();

            return result;
        }

        else if (currentToken.type === tokenTypes.LBRACKET) return this.enumExpr();
        else if (currentToken.type === tokenTypes.LSQUARE) return this.arrayExpr();
        else if (currentToken.matches(tokenTypes.KEYWORD, "fn")) return this.functionExpr();
        else if (currentToken.matches(tokenTypes.KEYWORD, "if")) return this.ifExpr();
        else if (currentToken.matches(tokenTypes.KEYWORD, "for")) return this.forExpr();
        else if (currentToken.matches(tokenTypes.KEYWORD, "while")) return this.whileExpr();
        else if (currentToken.matches(tokenTypes.KEYWORD, "new")) return this.initStructExpr();
        else if (currentToken.matches(tokenTypes.KEYWORD, "import")) return this.importExpr();
        else return new Error(currentToken.position, Error.InvalidSyntaxError, `Unexpected token: ${currentToken.toString()}`);
    }

    binOp(func, operations, func2 = null) {
        if (func2 === null) func2 = func;

        let left = func();

        if (isError(left, this.tokens.currentToken)) return left;

        while (this.tokens.currentToken.type !== null && operations.includes(this.tokens.currentToken.type)) {
            const operationToken = this.tokens.currentToken;
            this.tokens.advance();
            const right = func2();

            if (isError(right)) return right;

            left = new BinOpNode(left, operationToken, right);
        }

        return left;
    }

    //Special Expressions


    functionExpr() {
        const name = this.tokens.currentToken;

        if (name.type !== tokenTypes.IDENTIFIER) {
            return new Error(name.position, Error.InvalidSyntaxError, "Expected function name after function initization");
        }

        this.tokens.advance();

        const args = this.getFunctionArgs();
        if (isError(args)) return args;

        this.tokens.advance();

        if (this.tokens.currentToken.type !== tokenTypes.COLON) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected colon (:) after arguments`);
        }

        this.tokens.advance();

        const returnType = this.tokens.currentToken;

        if (returnType.type !== tokenTypes.TYPE && !returnType.matches(tokenTypes.IDENTIFIER, "null")) {
            return new Error(returnType.position, Error.InvalidSyntaxError, "Expected function type");
        }

        this.tokens.advance();

        if (this.tokens.currentToken.type !== tokenTypes.LBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '{'");
        }

        this.tokens.advance();

        let body = null;

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) body = this.statements(true);
        if (body !== null && isError(body)) return body;

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '}'");
        }

        this.tokens.advance();
        
        return new FunctionNode(returnType, name, args, body);
    }



    whileExpr() {
        if (this.tokens.currentToken.type !== tokenTypes.LPAR) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '('");
        }

        const condition = this.expr();
        if (isError(condition)) return condition;

        if (this.tokens.currentToken.type !== tokenTypes.LBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '{'");
        }

        this.tokens.advance();

        let body = null;

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) body = this.statements(true);
        if (body !== null && isError(body)) return body;

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '}'");
        } 

        this.tokens.advance();

        return new WhileNode(condition, body);
    }

    forExpr() {
        if (this.tokens.currentToken.type !== tokenTypes.LPAR) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '('");
        }

        this.tokens.advance();

        if (this.tokens.currentToken.type !== tokenTypes.IDENTIFIER) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected identifier");
        }

        const variableName = this.tokens.currentToken;

        this.tokens.advance();

        if (this.tokens.currentToken.type !== tokenTypes.KEYWORD && this.tokens.currentToken.value !== "in") {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected identifier");
        }

        this.tokens.advance();

        const tokenType = this.tokens.currentToken.type;
        const isDatatypeOrIdentifier = Object.values(dataTypes).includes(tokenType) || tokenType === tokenTypes.IDENTIFIER || tokenType === tokenTypes.LSQUARE || tokenType === tokenTypes.LBRACKET;

        const controls = isDatatypeOrIdentifier ? this.expr() : this.getArgs();
        if (isError(controls)) return controls;

        if (!isDatatypeOrIdentifier && controls.length !== 3) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected 3 arguments");
        }

        if (!isDatatypeOrIdentifier && this.tokens.currentToken.type !== tokenTypes.RPAR) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected ')'");
        }

        this.tokens.advance();

        if (this.tokens.currentToken.type !== tokenTypes.LBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '{'");
        }

        this.tokens.advance();

        let body = null;

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) body = this.statements(true);

        if (body !== null && isError(body)) return body;

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '}'");
        } 

        this.tokens.advance();

        return new ForNode(variableName, controls, body);
    }


    ifExpr() {
        let cases = [];
        let elseCase = null;

        if (this.tokens.currentToken.type !== tokenTypes.LPAR) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '('");
        }

        const mainCondition = this.expr();
        if (isError(mainCondition)) return mainCondition;

        if (this.tokens.currentToken.type !== tokenTypes.LBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '{'");
        }

        this.tokens.advance();

        const mainExpr = this.statements(true);
        if (isError(mainExpr)) return mainExpr;

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '}'");
        }

        this.tokens.advance();

        cases.push({
            condition: mainCondition,
            expr: mainExpr 
        });

        while (this.tokens.currentToken.matches(tokenTypes.KEYWORD, "elif")) {
            this.tokens.advance();

            if (this.tokens.currentToken.type !== tokenTypes.LPAR) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '('");
            }
    
            const condition = this.expr();
            if (isError(condition)) return condition;
    
            if (this.tokens.currentToken.type !== tokenTypes.LBRACKET) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '{'");
            }
    
            this.tokens.advance();
    
            const expr = this.statements(true);
            if (isError(expr)) return expr;
    
            if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '}'");
            }
    
            this.tokens.advance();
    
            cases.push({
                condition: condition,
                expr: expr
            });
        }

        if (this.tokens.currentToken.matches(tokenTypes.KEYWORD, "else")) {
            this.tokens.advance();

            if (this.tokens.currentToken.type !== tokenTypes.LBRACKET) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '{'");
            }

            this.tokens.advance();

            elseCase = this.statements(true);
            if (isError(elseCase)) return elseCase;

            if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected '}'");
            }

            this.tokens.advance();
        }

        return new IfNode(cases, elseCase);
    }

    arrayExpr() {
        let elements = [];
        const startPosition = this.tokens.currentToken.position;

        if (this.tokens.currentToken.type === tokenTypes.RSQUARE) {
            this.tokens.advance();
        }
        else {
            while (this.tokens.currentToken.type !== tokenTypes.RSQUARE && this.tokens.currentToken.type !== tokenTypes.EOF) {
                const expr = this.expr();
                if (isError(expr)) return expr;
            
                elements.push(expr);
                
                if (this.tokens.currentToken.type === tokenTypes.COMMA) {
                    this.tokens.advance();
                }
                else if (this.tokens.currentToken.type !== tokenTypes.RSQUARE) {
                    return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected ']' or ','");
                }
            }

            if (this.tokens.currentToken.type !== tokenTypes.RSQUARE) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected ']'");
            }

            this.tokens.advance();
        }

        const arrayNode = new ArrayNode(elements, dataTypes.Array, startPosition);
        const indexedValue = this.getIndexedValue(false, arrayNode);

        return indexedValue === null ? arrayNode : indexedValue;
    }

    enumExpr() {
        let values = [];
        const startPosition = this.tokens.currentToken.position;

        while (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
            if (this.tokens.currentToken.type !== tokenTypes.IDENTIFIER) {
                if (Object.values(dataTypes).includes(this.tokens.currentToken.type)) {
                    return new Error(this.tokens.currentToken.position, Error.TypeError, `Expected type identifier, not type: ${this.tokens.currentToken.type}`);
                }

                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected '}' or ','`);
            }

            values.push(this.tokens.currentToken.value);

            this.tokens.advance();

            if (this.tokens.currentToken.type === tokenTypes.COMMA) {
                this.tokens.advance();
            }
        }

        if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected '}'`);
        }

        this.tokens.advance();

        return new EnumNode(values, dataTypes.Enum, startPosition);
    }

    structExpr(variableName) {
        const position = this.tokens.currentToken.position;

        if (this.tokens.currentToken.type !== tokenTypes.LBRACKET) {
            return new Error(position, Error.InvalidSyntaxError, `Expected '{'`);
        }

        this.tokens.advance();

        let structure = [];

        while (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
            let writable = false;

            if (this.tokens.currentToken.type === tokenTypes.NOT) {
                writable = true;
                this.tokens.advance();
            }

            const identifier = this.tokens.currentToken;

            if (identifier.type !== tokenTypes.IDENTIFIER) {
                return new Error(identifier.position, Error.TypeError, `Expected identifier`);
            }

            this.tokens.advance();

            if (this.tokens.currentToken.type !== tokenTypes.COLON) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected colon`);
            }

            this.tokens.advance();

            let dataType = this.tokens.currentToken;

            if (dataType.type !== tokenTypes.TYPE && dataType.type !== tokenTypes.IDENTIFIER && !dataType.matches(tokenTypes.KEYWORD, "fn")) {
                return new Error(dataType.position, Error.TypeError, `Expected data type, function, or struct`);
            }
            if (dataType.type === tokenTypes.IDENTIFIER) dataType = new VariableAccessNode(dataType);

            structure.push({ identifier, dataType, writable });

            this.tokens.advance();

            if (this.tokens.currentToken.type === tokenTypes.COMMA) {
                this.tokens.advance();
            }
            else if (this.tokens.currentToken.type !== tokenTypes.RBRACKET) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected '}' or ','`);
            }
        }

        this.tokens.advance();

        return new BaseStructNode(variableName, structure, position);
    }

    initStructExpr() {
        let name = this.tokens.currentToken;
        const position = name.position;

        if (name.type !== tokenTypes.IDENTIFIER) {
            return new Error(name.position, Error.InvalidSyntaxError, `Expected identifier`);
        }

        name = new VariableAccessNode(name);

        this.tokens.advance();
        const args = this.getArgs();
        this.tokens.advance();

        return new StructNode(name, args, position);
    }

    importExpr() {
        if (this.tokens.currentToken.type !== tokenTypes.IDENTIFIER) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected ${tokenTypes.IDENTIFIER}, but receieved: ${this.tokens.currentToken.type}`);
        }

        let imports = [];

        while (this.tokens.currentToken.type === tokenTypes.IDENTIFIER) {
            imports.push(this.tokens.currentToken);
            this.tokens.advance();

            if (this.tokens.currentToken.type === tokenTypes.COMMA) {
                this.tokens.advance();
            }
        }

        if (!this.tokens.currentToken.matches("KEYWORD", "from")) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected 'from' keyword after import identifiers`);
        }

        this.tokens.advance();

        const file = this.atom();
        let alias = null;

        if (this.tokens.currentToken.matches("KEYWORD", "as")) {
            this.tokens.advance();

            if (this.tokens.currentToken.type !== tokenTypes.IDENTIFIER) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected import alias after 'as' keyword`);
            }

            alias = this.tokens.currentToken;

            this.tokens.advance();
        }

        return new ImportNode(imports, file, alias, file.position);
    }

    //Helper Functions

    getIndexedValue(indexesOnly, array) {
        let indexes = [];
        let value = null;

        while (this.tokens.currentToken.type === tokenTypes.LSQUARE) {
            this.tokens.advance();

            const index = this.expr();
            if (isError(index)) return index;

            indexes.push(index);

            if (this.tokens.currentToken.type !== tokenTypes.RSQUARE) {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected ']'`);
            }

            this.tokens.advance();
        }

        if (!indexesOnly) {
            for (let i = 0; i < indexes.length; i++) {
                if (value === null) {
                    value = array.elements[indexes[i]];
                }
                else {
                    value = value.elements[indexes[i]];
                }

                if (value === undefined) {
                    return new Error(this.tokens.currentToken.position, Error.IndexOutOfBoundsError, `Index out of bounds: ${indexes[i]}`);
                }
            }
        }

        return indexesOnly ? indexes : value;
    } 

    getArgs() {
        let args = [];

        if (this.tokens.currentToken.type !== tokenTypes.LPAR) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected '('`);
        }

        this.tokens.advance();

        while (this.tokens.currentToken.type !== tokenTypes.RPAR && this.tokens.currentToken.type !== tokenTypes.EOF) {
            const value = this.expr();
            if (isError(value)) return value;

            args.push(value);

            if (this.tokens.currentToken.type === tokenTypes.COMMA) {
                this.tokens.advance();
            }
        }

        return args;
    }

    getFunctionArgs() {
        let args = [];

        if (this.tokens.currentToken.type !== tokenTypes.LPAR) {
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected '('`);
        }

        this.tokens.advance();

        while (this.tokens.currentToken.type !== tokenTypes.RPAR && this.tokens.currentToken.type !== tokenTypes.EOF) {
            const arg = this.tokens.currentToken;

            if (arg.type !== tokenTypes.IDENTIFIER) {
                return new Error(arg.position, Error.InvalidSyntaxError, `Expected identifer. Received: ${arg.type}`);
            }

            this.tokens.advance();

            if (this.tokens.currentToken.type === tokenTypes.COLON) {
                this.tokens.advance();

                const type = this.tokens.currentToken;

                if (type.type !== tokenTypes.TYPE) {
                    return new Error(type.position, Error.InvalidSyntaxError, `Expected data type. Recieved: ${type.type}`);
                }

                args.push({
                    type: type,
                    name: arg
                });

                this.tokens.advance();
            }
            else if ([tokenTypes.COMMA, tokenTypes.RPAR].includes(this.tokens.currentToken.type)) {
                args.push({
                    type: dataTypes.Any,
                    name: arg
                });
            }
            else {
                return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, `Expected ':' or ','`);
            }

            if (this.tokens.currentToken.type === tokenTypes.COMMA) {
                this.tokens.advance();
            }
        }

        return args;
    }

    checkInitStruct() {
        this.tokens.anchor();

        const structType = this.tokens.currentToken;

        this.tokens.advance();

        const name = this.tokens.currentToken;

        if (name.type !== tokenTypes.IDENTIFIER) {
            this.tokens.anchor();
            return null;
        }

        this.tokens.advance();

        if (this.tokens.currentToken.type !== tokenTypes.ASSIGN) {
            this.tokens.anchor();
            return new Error(this.tokens.currentToken.position, Error.InvalidSyntaxError, "Expected assignment after identifier declaration");
        }

        this.tokens.anchor(true);
        this.tokens.advance();

        const value = this.expr();
        if (isError(value)) return value;

        return new VariableAssignNode(name, value, structType);
    }
}