<template>
    <div class="editor">
        <div class="editor__code">
            <div class="editor__toolkit">
                <button class="editor__toolkit__btn" v-on:click="start">Run</button>
                <button class="editor__toolkit__btn" v-on:click="save">Save</button>
            </div>
            <div name="code" id="code" class="editor__code__input"></div>
        </div>

        <div class="editor__divider">

        </div>

        <div class="editor__output">
            <div class="editor__toolkit">
                <button class="editor__toolkit__btn" v-on:click="clearOutput">Clear Output</button>
            </div>

            <div class="editor__output__log" id="output">
                <pre :class="msg.text === ' ' ? 'editor__output__log__space' : 'editor__output__log__msg'" :key="msg.id"
                    v-for="msg in output">{{ msg.text }}</pre>
            </div>
        </div>
    </div>
</template>

<script>
//import CodeFlask from "codeflask";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
//import { getLanguage } from "@/assets/syntaxHighlighting/lang.js";

export default {
    name: "Editor",
    data() {
        return {
            editor: null,
            output: []
        }
    },
    methods: {
        start() {
            this.run();
            this.scrollElement(document.querySelector(".editor__output__log"));
        },

        async run() {
            const lexer = require(`../../../src/lexer.js`);
            const Parser = require("../../../src/parser/parser.js");

            const Interpreter = require("../../../src/interpreter/interpreter.js");
            const interpreterSetup = require("../../../src/interpreter/interpreterSetup.js");

            const { isError } = require("../../../src/utils.js");

            this.save();

            const tokens = lexer(this.getCode());
            if (tokens.tokens.length === 0) return this.log(null);
            if (isError(tokens)) return this.generateLog(tokens.toString());

            //this.generateLog(tokens)

            const parser = new Parser(tokens);
            const ast = parser.parse();

            for (let i = 0; i < ast.nodes.length; i++) {
                if (isError(ast.nodes[i])) {
                    if (ast.nodes[i] !== undefined && ast.nodes[i].error !== undefined) {
                        return this.generateLog(ast.nodes[i].toString());
                    }
                }
            }


            //interpreter
            const interpreter = new Interpreter();
            const results = ast === false ? null : await interpreter.visit(ast, interpreterSetup("C:\\Editor.basp"));

            //display output
            this.checkErrors(results, isError);
            this.log(null);
        },

        checkErrors(statements, isError) {
            if (isError(statements)) {
                this.generateLog(statements.toString());
                return null;
            }

            if (statements.context !== null) this.processAPICaller(statements.context.global.apiCaller);

            if (statements.value !== undefined) return;

            for (let i = 0; i < statements.nodes.length; i++) {
                if (statements.value === undefined) {
                    if (this.checkErrors(statements.nodes[i], isError) === null) return null;
                }
            }
        },

        processAPICaller(apiCaller) {
            const operations = {
                print: (call) => this.log(call.value),
                clear: () => this.clearOutput()
            };

            for (let i = 0; i < apiCaller.calls.length; i++) {
                if (operations[apiCaller.calls[i].type] === undefined) continue;
                operations[apiCaller.calls[i].type](apiCaller.calls[i]);
            }

            apiCaller.calls.splice(0, apiCaller.calls.length);
        },

        log(text) {
            if (text === null) {
                this.generateLog(" ");
                this.generateLog("[Basp] Program Has Executed...");
                this.generateLog(" ");
                return;
            }
            this.generateLog(`[Basp] ${text}`);
        },

        generateLog(textToDisplay) {
            this.output.push({
                text: textToDisplay,
                id: this.output.length
            });
        },

        clearOutput() {
            this.output = [];
        },

        save() {
            localStorage.setItem("code", this.getCode());
        },

        getCode() {
            const children = this.editor.state.doc.children;

            if (children !== null) {
                let code = "";

                for (let i = 0; i < children.length; i++) {
                    code += children[i].text.join("\n");
                }

                return code;
            }

            return this.editor.state.doc.text.join("\n");
        },

        scrollElement(element) {
            element.scroll({ top: element.scrollHeight, behavior: "smooth" });
        }
    },
    mounted() {
        this.editor = new EditorView({
            doc: localStorage.getItem("code") || "\n".repeat(4),
            extensions: [
                basicSetup,
                keymap.of([indentWithTab]),
                //getLanguage()
            ],
            parent: document.querySelector("#code"),
            theme: "monokai",
        });

        // console.log(this.editor.state.doc)

        // this.editor.addEventListener("change", () => {
        //     console.log("E")
        // })

        // this.editor = new CodeFlask(document.querySelector(".editor__code__input"), {
        //     lineNumbers: true,
        //     language: "basp",
        //     defaultTheme: false,
        //     tabSize: 4
        // });

        // this.editor.updateCode(localStorage.getItem("code") || "");

        // this.editor.addLanguage("basp", {
        //     "string": /"(.*?)"/g,
        //     "variable": /\b(int|string|bool|array|enum|null)\b/g,
        //     "keyword": /\b(if|else|elif|fn|return|continue|break|for|while|in)\b/g,
        //     "number": /\b([+-]?[0-9]+(\\.?[0-9]+)?)\b/g,
        //     "boolean": /\b(True|False)\b/g,
        //     "parenthesis": /[()]|[[]]|[{}]/g,
        //     "comment": /\b(comment)\b/g
        // });
    }
}
</script>

<style lang="scss">
$halfEditorWidth: 47%;

.codeflask {
    height: inherit !important;
    width: $halfEditorWidth !important;
    background-color: #3C3C3A;

    &__flatten {
        font-size: 1rem !important;
        color: #ddca7e;
    }

    &__textarea {
        background-color: #3C3C3A !important;
        caret-color: gray !important;
    }

    &__lines {
        background-color: #3C3C3A;
    }
}

.token {
    &.keyword {
        color: #569cd6;
    }

    &.string {
        color: #ce9178;
    }

    &.number {
        color: #b5cea8;
    }

    &.boolean {
        color: #4ec9b0;
    }

    &.variable {
        color: #c586c0;
    }

    &.parenthesis {
        color: rgb(160, 160, 160);
    }

    &.comment {
        color: #6a9955;
    }
}

.editor {
    width: 100%;
    height: 50rem;
    background-color: red;

    display: flex;
    justify-content: center;
    align-items: center;

    &__divider {
        width: 2rem;
    }

    &__toolkit {
        width: 100%;
        height: 3rem;

        display: flex;
        align-items: center;

        border-bottom: 10px solid #eee;

        &__btn {
            margin-left: 0.5rem;
            width: 4rem;
            height: 2rem;
            cursor: pointer;
        }
    }

    &__code {
        background-color: white;
        width: $halfEditorWidth;
        height: 90%;

        &__input {
            background-color: white;
            width: 100%;
            height: calc(50rem * 0.9 - 4rem);
            max-height: calc(50rem * 0.9 - 4rem);
            overflow-y: scroll;
        }
    }

    &__output {
        width: $halfEditorWidth;
        height: 90%;
        background-color: white;

        border-radius: 0px 10px 10px 0px;

        &__log {
            max-height: calc(50rem * 0.9 - 4rem);
            overflow-y: scroll;

            &__msg {
                padding: 0rem 1rem 0rem 1rem;
            }

            &__space {
                width: 100%;
                height: 1rem;
            }
        }

        &__toolkit {
            width: 100%;
            height: 3rem;

            display: flex;
            align-items: center;

            &__run {
                margin-left: 0.5rem;
                width: 7rem;
                height: 2rem;
                cursor: pointer;
            }
        }
    }
}
</style>