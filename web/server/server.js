const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");

const path = __dirname.replace("server", "build") + "/";

server.listen(3000, "192.168.1.20", () => {
    console.log("Listening at http://localhost:3000");
});

app.use(express.static("../build"));
app.use(express.static("../../src"));
app.use(cors());

app.get("/", (_req, res) => {
    res.sendFile(path + "index.html");
});

let data = {};

data["CharSet"] = generateNode("IStructNode", {
    key: "structure",
    value: [
        {
            name: "upper",
            value: generateNode("IStringNode", {
                key: "value",
                value: `"ABCDEFGHIJKLMNOPQRSTUVWXYZ"`
            }, "STRING"),
            writable: false
        },
        {
            name: "lower",
            value: generateNode("IStringNode", {
                key: "value",
                value: `"abcdefghijklmnopqrstuvwxyz"`
            }, "STRING"),
            writable: false
        },
        {
            name: "numbers",
            value: generateNode("IStringNode", {
                key: "value",
                value: `"1234567890"`
            }, "STRING"),
            writable: false
        },
        {
            name: "specials",
            value: generateNode("IStringNode", {
                key: "value",
                value: `"!@#$%^&*()_-+=~[]{}';:,./?<>\`|\\"`
            }, "STRING"),
            writable: false
        },
        {
            name: "characters",
            value: generateNode("IStringNode", {
                key: "value",
                value: `"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_-+=~[]{}';:,./?<>\`|\\"`
            }, "STRING"),
            writable: false
        }
    ]
}, "STRUCT", "CharSet");

data["BASP"] = generateNode("IStringNode", {
    key: "value",
    value: `"BASP_TEST"`
}, "STRING");

let calls = 0

app.get("/import", (req, res) => {
    const result = {
        success: false,
        data: null
    };

    if (req.query.package === undefined) {
        result.data = 0;
        return res.json(result);
    }

    else if (data[req.query.package] === undefined) {
        result.data = 1;
        return res.json(result);
    }

    result.success = true;
    result.data = data[req.query.package];


    console.log(++calls)

    return res.json(result);
});

function generateNode(node, data, type, name = null) {
    const result = { node, data: {} };

    if (name !== null) result.data.name = name;

    result.data[data.key] = data.value;
    result.data.type = type;

    return result;
}