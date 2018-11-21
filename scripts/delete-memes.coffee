# Deletes all images that are memes or screenshots.

fs = require "fs"
path = require "path"
utils = require "./utils.js"

# Script implementation.
Script = (folders) ->

    # Minimum score to consider.
    score = 0.8

    # Array of files to be deleted.
    toDelete = []

    try
        for folder in folders

            folderTags = utils.getFolderTags folder

            for file, tags of folderTags
                try
                    tags.meme = 0 if not tags.meme?
                    tags.screenshot = 0 if not tags.screenshot?

                    if parseFloat(tags.meme) > score or parseFloat(tags.screenshot) > score
                        imgfile = file.substring(0, file.length - 5)
                        toDelete.push imgfile
                        toDelete.push file

                        console.log "  #{imgfile} - meme: #{tags.meme}, screenshot: #{tags.screenshot}"
                    else
                        console.log "  #{imgfile} - not a meme / screenshot"
                catch ex
                    console.error file, ex

            console.log ""

        # Delete unsafe files.
        for file in toDelete
            try
                result = fs.unlinkSync file
                console.log "  #{file} - deleted"
            catch ex
                console.error "  #{file}", ex

        return await true

    catch ex
        console.error ex
        throw ex

# Export!
module.exports = Script
