// TEST

const ImgRecog = require("../lib/index.js").default

const imgRecog = new ImgRecog({console: true, move: true, folders: []})
imgRecog.run()
