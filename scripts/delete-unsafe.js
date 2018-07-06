(function() {
  // Deletes all images that have adult or violence.
  var Script, fs, path, utils;

  fs = require("fs");

  path = require("path");

  utils = require("./utils.js");

  // Script implementation.
  Script = function(folders) {
    var score, toDelete;
    // Minimum score to consider.
    score = 0.9;
    // Array of files to be deleted.
    toDelete = [];
    return new Promise(resolve, reject)(function() {
      var ex, file, folder, folderTags, i, j, len, len1, result, tags, tagsfile;
      try {
        for (i = 0, len = folders.length; i < len; i++) {
          folder = folders[i];
          folderTags = utils.getFolderTags(folder);
          for (file in folderTags) {
            tags = folderTags[file];
            try {
              if (tags.adult == null) {
                tags.adult = 0;
              }
              if (tags.violence == null) {
                tags.violence = 0;
              }
              if (parseFloat(tags.adult) > score || parseFloat(tags.violence) > score) {
                tagsfile = file + ".tags";
                toDelete.push(file);
                toDelete.push(tagsfile);
                console.log(`${imgfile} - adult: ${tags.adult}, violence: ${tags.violence}`);
              }
            } catch (error) {
              ex = error;
              console.error(file, ex);
            }
          }
        }
// Delete unsafe files.
        for (j = 0, len1 = toDelete.length; j < len1; j++) {
          file = toDelete[j];
          try {
            result = fs.unlinkSync(file);
            console.log(`${file} - deleted`);
          } catch (error) {
            ex = error;
            console.error(file, ex);
          }
        }
      } catch (error) {
        ex = error;
        console.error(ex);
      }
      return resolve(true);
    });
  };

  // Export!
  module.exports = Script;

}).call(this);
