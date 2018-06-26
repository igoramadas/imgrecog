(function() {
  // This script will delete all images that have
  var ex, file, files, folder, fs, i, imgfile, j, k, len, len1, len2, params, path, result, score, tags, tagsfile, toDelete;

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
            tagsfile = path.join(folder, file);
            tags = fs.readFileSync(tagsfile, "UTF-8");
            tags = JSON.parse(tags);
            if (tags.adult == null) {
              // Set default tags.
              tags.adult = 0;
            }
            if (tags.violence == null) {
              tags.violence = 0;
            }
            if (parseFloat(tags.adult) > score || parseFloat(tags.violence) > score) {
              imgfile = tagsfile.replace(".tags", "");
              toDelete.push(tagsfile);
              toDelete.push(imgfile);
              console.log(imgfile, `- adult: ${tags.adult}, violence: ${tags.violence}`);
            }
          } catch (error) {
            ex = error;
            console.error(tagsfile, ex);
          }
        }
      }
    }
// Delete unsafe files.
    for (k = 0, len2 = toDelete.length; k < len2; k++) {
      file = toDelete[k];
      try {
        result = fs.unlinkSync(file);
        console.log(file, "- deleted");
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
