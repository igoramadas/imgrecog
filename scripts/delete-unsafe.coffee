# Deletes all images that are very likely adult, violence, or a good mix of unsafe categories.

fs = require "fs"
path = require "path"
utils = require "./utils.js"

# Script implementation.
Script = (folders) ->

    # Maximum safe single / total scores to consider.
    # Anything above these values is considered unsafe.
    singleScore = 0.8
    totalScore = 1.5

    # Array of files to be deleted.
    toDelete = []

    try
        for folder in folders

            folderTags = utils.getFolderTags folder

            for file, tags of folderTags
                try
                    tags.adult = 0 if not tags.adult?
                    tags.spoof = 0 if not tags.spoof?
                    tags.medical = 0 if not tags.medical?
                    tags.racy = 0 if not tags.racy?
                    tags.violence = 0 if not tags.violence?

                    imgTotalScore = tags.adult + tags.spoof + tags.medical + tags.racy + tags.violence

                    if tags.adult > singleScore or tags.violence > singleScore or imgTotalScore > totalScore
                        imgfile = file.substring(0, file.length - 5)
                        toDelete.push imgfile
                        toDelete.push file

                        console.log "  #{imgfile} marked as unsafe"
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
