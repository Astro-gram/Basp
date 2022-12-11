class Error {
    static InvalidSyntaxError = "Invalid Syntax";
    static TypeError = "Type";
    static UnknownError = "Unknown";
    static RuntimeError = "Runtime";
    static IndexOutOfBoundsError = "Index Out Of Bounds";
    static InternalError = "Internal";

    constructor(position, error, details, context = null) {
        this.position = position;
        this.context = context;
        this.error = error;
        this.details = details;

    }

    toString() {
        const lineOne = `${this.error} Error: ${this.details}`;

        let lineTwo = this.position === undefined ? "<unknown>" : this.position.toString();
        const result = this.getStack(lineTwo);

        return `
${lineOne}
    at ${result.stack}
`;
    }


    getStack(current) {
        let result = {
            longestLine: 0,
            stack: current,
        };

        if (this.context === null) return result;

        let contextClone = this.context.clone();

        result.stack += "\n\tin " + this.context.displayName + ` (${this.context.fileName})`;

        while (contextClone.parent !== null) {
            result.stack += "\n\tin " + contextClone.parent.displayName + ` (${contextClone.parent.fileName})`;
            contextClone = contextClone.parent;
        }

        return result;
    }
}

module.exports = {
    Error
};