# Deletes all images that are bloat (memes, screenshots, non relevant graphs etc).

fs = require "fs"
path = require "path"
utils = require "./utils.js"

# Script implementation.
Script = (folders) ->

    # Anything above these single / total score is considered bloat.
    singleScore = 0.85
    totalScore = 1.25

    # Array of files to be deleted.
    toDelete = []

    # Tags to consider.
    bloatTags = ["meme", "photo caption", "screenshot", "spoof", "website"]
    extraTags = ["advertising", "document", "map", "text"]

    try
        for folder in folders

            folderTags = utils.getFolderTags folder

            for file, tags of folderTags
                try
                    imgTotalScore = 0
                    hasBloat = false

                    for bt in bloatTags
                        tags[bt] = 0 if not tags[bt]?
                        imgTotalScore += tags[bt]
                        hasBloat = true if tags[bt] > singleScore

                    for et in extraTags
                        tags[et] = 0 if not tags[et]?
                        imgTotalScore += (tags[et] / 3)

                    if hasBloat or imgTotalScore > totalScore
                        imgfile = file.substring(0, file.length - 5)
                        toDelete.push imgfile
                        toDelete.push file

                        console.log "  #{imgfile} marked as bloat (score #{imgTotalScore})"
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
