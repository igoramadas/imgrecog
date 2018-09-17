# Deletes all images considered non relevant for archiving (adult, violence, memes and screenshots).

fs = require "fs"
path = require "path"
utils = require "./utils.js"

# Script implementation.
Script = (folders) ->
    try
        deleteMemes = require("./delete-memes.js")
        await deleteMemes folders

        deleteUnsafe = require("./delete-unsafe.js")
        await deleteUnsafe folders

        return await true

    catch ex
        console.error ex
        throw ex

# Export!
module.exports = Script
