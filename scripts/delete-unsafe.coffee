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
                    filepath = path.join(folder, file)
                    tags = fs.readFileSync filepath, "UTF-8"
                    tags = JSON.parse tags

                    toDelete.push filepath if tags.adult? and tags.adult > score
                    toDelete.push filepath if tags.violence? and tags.violence > score
                catch ex
                    console.error filepath, ex

    # Delete unsafe files.
    for file in toDelete
        do (file) ->
            fs.unlink file, (err) ->
                if err?
                    console.error file, err
                else
                    console.log file, "deleted!"
