const { Context, SymbolTable, APICaller } = require("../utils.js");

const {
    NumberType, StringType,
    Print, Clear,
    IsArray, IsNumber, IsString, IsEnum, IsBoolean, IsFunction, Typeof,
    getMath
} = require("../builtInFunctions/wrapper.js");

module.exports = function(fileName, contextParent = null) {
    const context = new Context("Global", contextParent === null ? new SymbolTable() : new SymbolTable(contextParent.symbolTable), contextParent);
    if (contextParent === null) context.apiCaller = new APICaller();
    context.fileName = fileName;
    
    context.symbolTable.set("Number", NumberType());
    context.symbolTable.set("String", StringType());

    context.symbolTable.set("Print", Print());
    context.symbolTable.set("Clear", Clear());

    context.symbolTable.set("IsArray", IsArray());
    context.symbolTable.set("IsNumber", IsNumber());
    context.symbolTable.set("IsString", IsString());
    context.symbolTable.set("IsEnum", IsEnum());
    context.symbolTable.set("IsBoolean", IsBoolean());
    context.symbolTable.set("IsFunction", IsFunction());

    context.symbolTable.set("Typeof", Typeof());

    context.symbolTable.set("Math", getMath());
    
    return context;
}