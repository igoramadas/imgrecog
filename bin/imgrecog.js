#!/usr/bin/env node

// Disable TensorFlow logs.
process.env.TF_CPP_MIN_LOG_LEVEL = "2"

// Execute.
const path = require("path")
const fs = require("fs")
const dir = path.join(path.dirname(fs.realpathSync(__filename)), "../", "lib")
require(dir + "/cmd.js")()
