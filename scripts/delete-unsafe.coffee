# This script will delete all images that have

fs = require "fs"
path = require "path"

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
        console.log ""
        console.log "Folder: #{folder}"

        files = fs.readdirSync folder

        for file in files
            if path.extname(file) is ".tags"
                try
                    tagsfile = path.join(folder, file)
                    tags = fs.readFileSync tagsfile, "UTF-8"
                    tags = JSON.parse tags

                    # Set default tags.
                    tags.adult = 0 if not tags.adult?
                    tags.violence = 0 if not tags.violence?

                    if parseFloat(tags.adult) > score or parseFloat(tags.violence) > score
                        imgfile = tagsfile.replace(".tags", "")
                        toDelete.push tagsfile
                        toDelete.push imgfile
                        console.log "#{imgfile} - adult: #{tags.adult}, violence: #{tags.violence}"
                catch ex
                    console.error tagsfile, ex

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
