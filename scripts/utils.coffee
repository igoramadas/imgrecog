# Script common utilities.

fs = require "fs"
path = require "path"

Utils = {

    # Returns a object filenames as keys and tags as value objects.
    # -------------------------------------------------------------------------
    getFolderTags: (folder) ->
        result = {}

        files = fs.readdirSync folder

        for file in files
            if path.extname(file) is ".tags"
                try
                    tagsfile = file.substring 0, file.lastIndexOf(".tags")
                    tagsfile = path.join folder, file
                    tags = fs.readFileSync tagsfile, "UTF-8"
                    tags = JSON.parse tags

                    result[tagsfile] = tags
                catch ex
                    console.error tagsfile, ex
}

module.exports = Utils
