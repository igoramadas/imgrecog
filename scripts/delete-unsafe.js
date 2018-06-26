(function() {
  // This script will delete all images that have
  var contents, f, folders, fs, i, len, path;

  fs = require("fs");

  path = require("path");

  try {
    folders = Array.prototype.slice.call(process.argv, 2);
    for (i = 0, len = folders.length; i < len; i++) {
      f = folders[i];
      contents = fs.readdirSync(f);
    }
  } catch (error) {}

}).call(this);
