# This script will delete all images that have

fs = require "fs"
path = require "path"
utils = require "./utils.coffee"

console.log ""
console.log "#######################################################"
console.log "###         - IMGRecog.js - delete unsafe -         ###"
console.log "#######################################################"
console.log ""

# Minimum score to consider.
score = 0.9

# Array of files to be deleted.
toDelete = []

try
    params = Array::slice.call process.argv, 2

    for folder in params

        folderTags = utils.getFolderTags folder

        for file, tags of folderTags
            try
                tags.adult = 0 if not tags.adult?
                tags.violence = 0 if not tags.violence?

                if parseFloat(tags.adult) > score or parseFloat(tags.violence) > score
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

    console.log ""
    console.log "FINSHED!"
    console.log ""

catch ex
    console.error ex
