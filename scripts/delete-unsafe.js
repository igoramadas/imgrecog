(function() {
  // This script will delete all images that have
  var ex, file, folder, folderTags, fs, i, j, len, len1, params, path, result, score, tags, tagsfile, toDelete, utils;

  fs = require("fs");

  path = require("path");

  utils = require("./utils.coffee");

  console.log("");

  console.log("#######################################################");

  console.log("###         - IMGRecog.js - delete unsafe -         ###");

  console.log("#######################################################");

  console.log("");

  // Minimum score to consider.
  score = 0.9;

  // Array of files to be deleted.
  toDelete = [];

  try {
    params = Array.prototype.slice.call(process.argv, 2);
    for (i = 0, len = params.length; i < len; i++) {
      folder = params[i];
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
    console.log("");
    console.log("FINSHED!");
    console.log("");
  } catch (error) {
    ex = error;
    console.error(ex);
  }

}).call(this);
