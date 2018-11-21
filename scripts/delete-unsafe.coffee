# Deletes all images that have adult or violence.

fs = require "fs"
path = require "path"
utils = require "./utils.js"

# Script implementation.
Script = (folders) ->

    # Minimum score to consider.
    score = 0.001

    # Array of files to be deleted.
    toDelete = []

    try
        for folder in folders

            folderTags = utils.getFolderTags folder

            for file, tags of folderTags
                try
                    tags.adult = 0 if not tags.adult?
                    tags.violence = 0 if not tags.violence?

                    if parseFloat(tags.adult) > score or parseFloat(tags.violence) > score
                        imgfile = file.substring(0, file.length - 5)
                        toDelete.push imgfile
                        toDelete.push file

                        console.log "  #{imgfile} - adult: #{tags.adult}, violence: #{tags.violence}"
                    else
                        console.log "  #{imgfile} - safe"
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
