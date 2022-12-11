const rules = require("./constants.js").lexerRules;

const { Token, TokenStream, Position, getString } = require("./utils.js");
const { Error } = require("./error.js");

module.exports = function(input) {
    if (typeof input !== "string" || input.length === 0) return new TokenStream([]);

    const lines = input.split("\n");
    let tokens = [];

    for (let i = 0; i < lines.length; i++) {
        const sanitizedLine = lines[i].replace(/\r|\t|\n|\r\n/gm, "");

        const tokensInLine = sanitizedLine.split(/([(-)]|[{-}]|\[|\]|\/\/|\+=|-=|\*=|\/=|\^=|\+|-|\*|\/|\^|<=|>=|[<>]|&|~|!=|!|,|"|\.|:)| /g)
                                          .filter(token => token !== undefined && token !== "");

        tokensInLine.unshift("\n");

        let currentIndexInLine = 0;
        let inString = false;

        if (tokensInLine[1] === "//") {
            continue;
        }

        for (let tokenIndex = 0; tokenIndex < tokensInLine.length; tokenIndex++) {
            const token = tokensInLine[tokenIndex];
            const charPosition = sanitizedLine.indexOf(token, currentIndexInLine);
            const currentPosition = new Position(tokenIndex, i, charPosition === -1 ? 0 : charPosition);
            currentIndexInLine = currentPosition.char;

            if (inString && token !== `"`) {
                continue;
            }
            else if (inString && token === `"`) {
                inString = false;
                currentIndexInLine++;
                continue;
            }

            if (token === `"`) {
                const stringData = getString(sanitizedLine, currentIndexInLine);
                if (stringData.error !== null) return new Error(currentPosition, Error.InvalidSyntaxError, stringData.error);

                tokens.push(new Token("STRING", stringData.value, currentPosition));
                inString = true;
                continue;
            }

            for (let j = 0; j < rules.length; j++) {
                if (rules[j][1].test(token)) {
                    tokens.push(new Token(rules[j][0], token, currentPosition));
                    break;
                }
            }
        }
    }

    const lastToken = tokens[tokens.length - 1];
    let eofPosition = lastToken === undefined ? new Position(0, 0, 0) :  lastToken.position;
    
    if (lastToken !== undefined) {
        eofPosition.index += 1;
        eofPosition.char += lastToken.value.length;
    }

    return new TokenStream(tokens.concat(new Token("EOF", "EOF", eofPosition)));
}