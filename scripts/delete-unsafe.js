(function() {
  // This script will delete all images that have
  var ex, file, filepath, files, folder, fs, i, j, k, len, len1, len2, params, path, score, tags, toDelete;

  fs = require("fs");

  path = require("path");

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
      console.log("");
      console.log(`Folder: ${folder}`);
      files = fs.readdirSync(folder);
      for (j = 0, len1 = files.length; j < len1; j++) {
        file = files[j];
        if (path.extname(file) === ".tags") {
          try {
            filepath = path.join(folder, file);
            tags = fs.readFileSync(filepath, "UTF-8");
            tags = JSON.parse(tags);
            if ((tags.adult != null) && tags.adult > score) {
              toDelete.push(filepath);
            }
            if ((tags.violence != null) && tags.violence > score) {
              toDelete.push(filepath);
            }
          } catch (error) {
            ex = error;
            console.error(filepath, ex);
          }
        }
      }
    }
// Delete unsafe files.
    for (k = 0, len2 = toDelete.length; k < len2; k++) {
      file = toDelete[k];
      (function(file) {
        return fs.unlink(file, function(err) {
          if (err != null) {
            return console.error(file, err);
          } else {
            return console.log(file, "deleted!");
          }
        });
      })(file);
    }
  } catch (error) {}

}).call(this);
