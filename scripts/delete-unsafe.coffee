# This script will delete all images that have

fs = require "fs"
path = require "path"

try
    folders = Array::slice.call process.argv, 2

    for f in folders
        contents = fs.readdirSync f
