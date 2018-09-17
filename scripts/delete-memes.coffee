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
                        tagsfile = file + ".tags"
                        toDelete.push file
                        toDelete.push tagsfile

                        console.log "#{imgfile} - meme: #{tags.meme}, screenshot: #{tags.screenshot}"
                catch ex
                    console.error file, ex

        # Delete unsafe files.
        for file in toDelete
            try
                result = fs.unlinkSync file
                console.log "#{file} - deleted"
            catch ex
                console.error file, ex

        return await true

    catch ex
        console.error ex
        throw ex

# Export!
module.exports = Script
