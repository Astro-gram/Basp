const fs = require("fs");
const readline = require("readline");


const lexer = require("./lexer.js");
const Parser = require("./parser/parser.js");
const Interpreter = require("./interpreter/interpreter.js");

const interpreterSetup = require("./interpreter/interpreterSetup.js");

const { isError, checkASTErrors, checkInterpreterErrors } = require("./utils.js");

const {
    PRODUCTION,
    NON_PRODUCTION_FILE_LOCATION
} = require("./config.js");

main(PRODUCTION ? process.argv[2] : NON_PRODUCTION_FILE_LOCATION);

async function main(file, displayEndMsg = true) {
    //src code
    const sourceCode = fs.readFileSync(file).toString();

    //tokens
    const tokens = lexer(sourceCode);

    if (tokens.tokens.length === 0) {
        if (displayEndMsg) log(null);
        return;
    }

    if (isError(tokens)) return console.log(tokens.toString());

    //ast
    const parser = new Parser(tokens);
    const ast = parser.parse();

    if (checkASTErrors(ast).error) return;

    //interpreter
    const interpreter = new Interpreter();
    const results = await interpreter.visit(ast, interpreterSetup(file));

    //display output
    checkInterpreterErrors(results);
    if (displayEndMsg) log(null);
}

function log(text) {
    if (text === null) return done();
    console.log(`[Basp] ${text}`);
}

function done() {
    if (!PRODUCTION) console.log("\n[Basp] Program Has Executed...");
    else {
        let finished = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        finished.question(`\n[Basp] Program Has Executed...`, () => {
            finished.close();
        });
    }
}
