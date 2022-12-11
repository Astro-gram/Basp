const tokenTypes = {
    NEWLINE: "NEWLINE",
    COMMENT: "COMMENT",
    NUMBER: "NUMBER",
    STRING: "STRING",
    BOOL: "BOOL",

    ADD_EQ: "ADD_EQ",
    ADD: "ADD",

    SUB_EQ: "SUB_EQ",
    SUB: "SUB",

    MUL_EQ: "MUL_EQ",
    MUL: "MUL",

    DIV_EQ: "DIV_EQ",
    DIV: "DIV",

    POW_EQ: "POW_EQ",
    POW: "POW",

    MOD_EQ: "MOD_EQ",
    MOD: "MOD",

    LSQUARE: "LSQUARE",
    RSQUARE: "RSQUARE",

    LBRACKET: "LBRACKET",
    RBRACKET: "RBRACKET",

    EQ: "EQ",
    NEQ: "NEQ",

    NOT: "NOT",
    AND: "AND",
    OR: "OR",

    GTE: "GTE",
    LTE: "LTE",
    GT: "GT",
    LT: "LT",

    LPAR: "LPAR",
    RPAR: "RPAR",

    DOT: "DOT",
    COMMA: "COMMA",
    COLON: "COLON",

    ASSIGN: "ASSIGN",

    TYPE: "TYPE",

    KEYWORD: "KEYWORD",
    IDENTIFIER: "IDENTIFIER",
    EOF: "EOF",
}

const lexerRules = [
    [tokenTypes.NEWLINE, /\n/],
    [tokenTypes.COMMENT, /\/\//],
    [tokenTypes.NUMBER, /^\d*$/],
    [tokenTypes.STRING, /(["'])(?:(?=(\\?))\2.)*?\1/],
    [tokenTypes.BOOL, /^True$|^False$/],

    [tokenTypes.ADD_EQ, /^\+=$/],
    [tokenTypes.ADD, /^\+$/],

    [tokenTypes.SUB_EQ, /^\-=$/],
    [tokenTypes.SUB, /^\-$/],

    [tokenTypes.MUL_EQ, /^\*=$/],
    [tokenTypes.MUL, /^\*$/],

    [tokenTypes.DIV_EQ, /^\/=$/],
    [tokenTypes.DIV, /^\/$/],

    [tokenTypes.POW_EQ, /^\^=$/],
    [tokenTypes.POW, /^\^$/],

    [tokenTypes.MOD_EQ, /^\%=$/],
    [tokenTypes.MOD, /^\%$/],

    [tokenTypes.LSQUARE, /^\[$/],
    [tokenTypes.RSQUARE, /^\]$/],

    [tokenTypes.LBRACKET, /^\{$/],
    [tokenTypes.RBRACKET, /^\}$/],

    [tokenTypes.EQ, /^==$/],
    [tokenTypes.NEQ, /^!=$/],

    [tokenTypes.NOT, /^!$/],
    [tokenTypes.AND, /^&$/],
    [tokenTypes.OR, /^~$/],

    [tokenTypes.GTE, /^>=$/],
    [tokenTypes.LTE, /^<=$/],
    [tokenTypes.GT, /^>$/],
    [tokenTypes.LT, /^<$/],

    [tokenTypes.LPAR, /^\($/],
    [tokenTypes.RPAR, /^\)$/],

    [tokenTypes.DOT, /^\.$/],
    [tokenTypes.COMMA, /^,$/],
    [tokenTypes.COLON, /^:$/],

    [tokenTypes.ASSIGN, /^\=$/],

    [tokenTypes.TYPE, /^string$|^int$|^bool$|^array$|^enum$|^struct$/],

    [tokenTypes.KEYWORD, /^return$|^break$|^continue$|^fn$|^if$|^else$|^elif$|^for$|^in$|^while$|^new$|^import$|^as$|^from$/],
    [tokenTypes.IDENTIFIER, /[\s\S]*/],
];

const dataTypes = {
    Number: "NUMBER",
    String: "STRING",
    Bool: "BOOL",
    Array: "ARRAY",
    Enum: "ENUM",
    EnumValue: "ENUM_VALUE",
    Struct: "STRUCT",
    Function: "FUNCTION",
    Null: "NULL",
    Any: "ANY"
};

const assignmentOperators = [
    "add_eq",
    "sub_eq",
    "mul_eq",
    "div_eq",
    "mod_eq",
    "assign"
];

module.exports = {
    lexerRules,
    dataTypes,
    assignmentOperators,
    tokenTypes
};