# Deletes all images that have adult or violence.

fs = require "fs"
path = require "path"
utils = require "./utils.js"

# Script implementation.
Script = (folders) ->

    # Minimum score to consider.
    score = 0.9

    # Array of files to be deleted.
    toDelete = []

    return new Promise(resolve, reject) ->
        try
            for folder in folders

                folderTags = utils.getFolderTags folder

                for file, tags of folderTags
                    try
                        tags.adult = 0 if not tags.adult?
                        tags.violence = 0 if not tags.violence?

                        if parseFloat(tags.adult) >= score or parseFloat(tags.violence) >= score
                            tagsfile = file + ".tags"
                            toDelete.push file
                            toDelete.push tagsfile

                            console.log "#{imgfile} - adult: #{tags.adult}, violence: #{tags.violence}"
                    catch ex
                        console.error file, ex

            # Delete unsafe files.
            for file in toDelete
                try
                    result = fs.unlinkSync file
                    console.log "#{file} - deleted"
                catch ex
                    console.error file, ex

        catch ex
            console.error ex

        resolve true

# Export!
module.exports = Script
