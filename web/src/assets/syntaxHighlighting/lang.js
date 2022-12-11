import { parser } from "./parser.js";
import { LRLanguage, LanguageSupport } from "@codemirror/language";

import { completeFromList } from "@codemirror/autocomplete";

const language = LRLanguage.define({
    parser: parser,
    languageData: {
        commentTokens: {line: ";"}
    }
});

const autocomplete = language.data.of({
    autocomplete: completeFromList([
        { label: "Print", type: "fn" }
    ])
});

export function getLanguage() {
    return new LanguageSupport(language, autocomplete);
}