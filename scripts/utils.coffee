# Common utilities to be used within scripts.

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
                    tags = fs.readFileSync tagsfile, "utf8"
                    tags = JSON.parse tags

                    # Make sure all scores are float!
                    tags[key] = parseFloat value for key, value of tags

                    result[tagsfile] = tags
                catch ex
                    console.error tagsfile, ex

        return result
}

module.exports = Utils
