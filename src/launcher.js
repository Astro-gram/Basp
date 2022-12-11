const { spawnSync } = require("child_process");
const { resolve } = require("path");

//Have to do this to get around node warnings
const cmd = "node --no-warnings " + resolve(__dirname, "main.js");
spawnSync(cmd, { stdio: "inherit", shell: true });