const { IBooleanNode } = require("./INodes.js");
const { dataTypes } = require("../constants.js");
const { toBoolean } = require("../utils.js");

function ICompare(left, right, operation) {
    if (compareFuncs[operation] === undefined) return null;
    return compareFuncs[operation](left, right);
}

const compareFuncs = {
    eq: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) === toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    neq: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) !== toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    lt: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) < toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    lte: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) <= toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    gt: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) > toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    gte: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) >= toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    and: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) && toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    or: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return new IBooleanNode(toBoolean(left.value) || toBoolean(right.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
        }
    },

    not: function(left) {
        return new IBooleanNode(!toBoolean(left.value) ? "True" : "False", dataTypes.Bool, left.position, left.context);
    },

    assign: function(left, right) {
        if (left.nodeType === right.nodeType) {
            return right;
        }
    }
}

module.exports = ICompare;