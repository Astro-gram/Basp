const { IMPORT_BASE_URL } = require("./config.js");
const { tokenTypes } = require("./constants.js");
const { INodeTable, INode } = require("./interpreter/INodes.js");

class Position {
    constructor(index, line, char) {
        this.index = index;
        this.line = line;
        this.char = char;
    }

    toString() {
        return `Token ${this.index + 1} [${this.line + 1}:${this.char}]`;
    }
}

class Token {
    constructor(type, value, position) {
        this.type = type;
        this.value = value;
        this.position = position;
    }

    matches(type, value) {
        return (this.type === type && this.value === value);
    }

    toString() {
        return `<Token ${this.type}: ${this.value === "\n" ? "\\n" : this.value}>`;
    }
}

class TokenStream {
    constructor(tokens) {
        this.tokens = tokens;
        this.index = -1;
        this.currentToken = this.noToken();

        this.anchorData = {
            anchored: false
        };

        this.advance();
    }

    advance() {
        this.index++;
        this.currentToken = this.tokens[this.index] || this.noToken();

        while (this.currentToken.type !== null && this.currentToken.type === tokenTypes.NEWLINE) this.advance();
    }

    anchor(keepPosition = false) {
        if (!this.anchorData.anchored) {
            this.anchorData.index = this.index;
            this.anchorData.currentToken = this.currentToken;
        }
        else if (!keepPosition) {
            this.index = this.anchorData.index;
            this.currentToken = this.anchorData.currentToken;
        }

        this.anchorData.anchored = !this.anchorData.anchored;
    }

    noToken() {
        return new Token("NO_TOKEN", "INTERNAL_ERROR", new Position(-1, -1, 0));
    }
}

//This is for calling functions within Javascript such as console.log, fileSystem, etc.
class APICaller {
    constructor() {
        this.calls = [];
    }

    call(value, type) {
        this.calls.push({
            value,
            type
        });
    }

    process() {
        for (let i = 0; i < this.calls.length; i++) {
            if (this[this.calls[i].type] === undefined) continue;
            
            this[this.calls[i].type](this.calls[i]);
        }

        this.calls.splice(0, this.calls.length);
    }

    print(call) {
        console.log(`[Basp] ${call.value}`);
    }

    clear() {
        console.clear();
    }
}

class ImportManager {
    constructor() {
        this.imports = [];
    }

    add(file) {
        this.imports.push(file);
    }

    has(fileValue) {
        return !!(this.imports.map(x => x.value).includes(fileValue));
    }
}

class Context {
    #displayName

    constructor(displayName, symbolTable = null, parent = null, allowForceControls = false, allowReturn = false) {
        this.#displayName = displayName;
        this.parent = parent;
        this.allowForceControls = allowForceControls;
        this.allowReturn = allowReturn;
        this.symbolTable = symbolTable;

        this.shouldContinue = false;
        this.shouldBreak = false;
        this.shouldReturn = false;

        this.isGlobal = false;
        this.global = this._getGlobalContext();

        this.fileName = this.parent === null ? "Unknown" : this.parent.fileName;

        if (!this.global.isGlobal) {
            this.global.isGlobal = true;
            this.global.importManager = new ImportManager();
        }
    }

    get displayName() {
        return `<${this.#displayName}>`
    }

    set displayName(value) {
        this.#displayName = value;
    }

    isForceControllable(context = this) {
        if (context.allowForceControls) return context;
        else if (context.parent !== null) return this.isForceControllable.bind(this)(context.parent);

        return null;
    }

    isReturnable(context = this) {
        if (context.allowReturn) return context;
        else if (context.parent !== null) return this.isReturnable.bind(this)(context.parent);

        return null;
    }

    _getGlobalContext(context = this) {
        if (!context.parent || context.isGlobal) return context;
        else return this._getGlobalContext.bind(this)(context.parent);
    }

    clone() {
        return new Context(this.displayName, this.symbolTable, this.parent, this.allowForceControls, this.allowReturn);
    }
}

class SymbolTable {
    constructor(parent = null) {
        this.symbols = {};
        this.parent = parent;
    }

    get(name) {
        const value = this.symbols.hasOwnProperty(name) ? this.symbols[name] : undefined;

        if (value === undefined && this.parent !== null) {
            return this.parent.get(name);
        }

        return value;
    }

    set(name, value) {
        if (this.symbols.hasOwnProperty(name)) return false;

        this.symbols[name] = value;
        return true;
    }

    update(name, value) {
        if (this.symbols[name] === undefined && this.parent !== null) {
            const depth = this.parent._find(name);
            
            if (depth !== undefined) {
                let currentParent = this.parent;

                for (let i = 0; i < depth; i++) {
                    currentParent = currentParent.parent;
                }

                currentParent.symbols[name] = value;
            }
        }

        this.symbols[name] = value;
    }

    clear() {
        this.symbols = {};
    }

    _find(name, depth = 0) {
        const value = this.symbols[name];

        if (value === undefined && this.parent !== null) {
            depth++;
            return this.parent._find(name, depth);
        }

        return depth;
    }
}

function isError(check) {
    return !!(check === undefined || check === null || check.error !== undefined);
}

function getString(line, start) {
    let result = {
        error: null,
        value: null
    };

    const end = line.indexOf(`"`, start + 1);

    result.value = line.slice(start, end + 1);

    return result;
}

function toBoolean(value) {
    if (value === "True") return true;
    else if (value === "False") return false;

    return value;
}

function getImportMetadata(pkg, fs) {
    const splitPkg = pkg.split(":");
    const isFile = !(splitPkg.length == 2 && splitPkg[0] === "basp");

    return {
        isFile,
        path: isFile ? getFilePath(pkg, fs) : `${IMPORT_BASE_URL}?package=${splitPkg[1]}`
    };
}

function getFilePath(name, fs) {
    let result = {
        error: true,
        data: name
    }

    if (fs === null) {
        result.data = "FileSystem is not supported in this environment";
        return result;
    }

    if (!fs.existsSync(name)) {
        result.data = `File: "${name}" was not found`;
        return result;
    }
    

    result.error = false;
    return result;
}

function generateClass(classToGenerate, data, context) {
    const instance = new INodeTable[classToGenerate]();

    const keys = Object.keys(data);
    const values = Object.values(data);

    for (let i = 0; i < keys.length; i++) {
        if (keys[i] === "structure") {
            for (let j = 0; j < values[i].length; j++) {
                values[i][j].value = generateClass(values[i][j].value.node, values[i][j].value.data, context);
            }
        }
        else if (keys[i] === "elements") {
            for (let j = 0; j < values[i].length; j++) {
                values[i][j] = generateClass(values[i][j].node, values[i][j].data, context);
            }
        }

        instance[keys[i]] = values[i];
    }

    instance.context = context;

    if (instance.nodeType === INode.IArrayNode) instance.value = instance.getValue(instance.elements);
    if (instance.nodeType === INode.IBaseStructNode || instance.nodeType === INode.IStructNode) instance.update(true);

    return instance;
}

function checkInterpreterErrors(statements, printErrors = true) {
    if (isError(statements)) {
        if (printErrors) console.log(statements.toString());

        return {
            success: false,
            node: statements
        }
    }

    if (statements.context !== null) statements.context.global.apiCaller.process();

    if (statements.value !== undefined) return { success: true };

    for (let i = 0; i < statements.nodes.length; i++) {
        if (statements.nodes[i].context !== null) statements.nodes[i].context.global.apiCaller.process();

        if (statements.nodes[i].value === undefined) {
            const branchResult = checkInterpreterErrors(statements.nodes[i]);
            if (!branchResult.success) return branchResult.node;
        }
    }

    return {
        success: true
    }
}

function checkASTErrors(ast, print = true) {
    for (let i = 0; i < ast.nodes.length; i++) {
        if (isError(ast.nodes[i])) {
            if (ast.nodes[i] !== undefined && ast.nodes[i].error !== undefined) {
                if (print) console.log(ast.nodes[i].toString());

                return {
                    error: true,
                    node: ast.nodes[i]
                }
            }
        }
    }

    return {
        error: false
    }
}


module.exports = {
    Token,
    TokenStream,
    Position,
    Context,
    SymbolTable,
    APICaller,
    ImportManager,
    isError,
    getString,
    toBoolean,
    getImportMetadata,
    generateClass,
    checkASTErrors,
    checkInterpreterErrors
};