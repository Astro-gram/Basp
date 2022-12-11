const { NumberType, StringType } = require("./conversions.js");
const { Print, Clear } = require("./misc.js");
const { IsArray, IsNumber, IsString, IsEnum, IsBoolean, IsFunction, Typeof } = require("./types.js");
const { getMath } = require("./math.js");

module.exports = {
    NumberType,
    StringType,

    Print,
    Clear,

    IsArray,
    IsNumber,
    IsString,
    IsEnum,
    IsBoolean,
    IsFunction,
    
    Typeof,

    getMath,
};