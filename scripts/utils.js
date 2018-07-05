(function() {
  // Script common utilities.
  var Utils, fs, path;

  fs = require("fs");

  path = require("path");

  Utils = {
    // Returns a object filenames as keys and tags as value objects.
    // -------------------------------------------------------------------------
    getFolderTags: function(folder) {
      var ex, file, files, i, len, result, results, tags, tagsfile;
      result = {};
      files = fs.readdirSync(folder);
      results = [];
      for (i = 0, len = files.length; i < len; i++) {
        file = files[i];
        if (path.extname(file) === ".tags") {
          try {
            tagsfile = file.substring(0, file.lastIndexOf(".tags"));
            tagsfile = path.join(folder, file);
            tags = fs.readFileSync(tagsfile, "UTF-8");
            tags = JSON.parse(tags);
            results.push(result[tagsfile] = tags);
          } catch (error) {
            ex = error;
            results.push(console.error(tagsfile, ex));
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  module.exports = Utils;

}).call(this);
