(function() {
  var async, client, currentFolder, executableFolder, fileQueue, finished, folders, fs, getParams, homeFolder, images, likelyhood, options, os, path, queueProcessor, run, scanFile, scanFolder, showHelp, startTime, vision;

  async = require("async");

  fs = require("fs");

  os = require("os");

  path = require("path");

  vision = require("@google-cloud/vision");

  client = null;

  // Get current and bin executable folder.
  currentFolder = process.cwd() + "/";

  homeFolder = os.homedir() + "/";

  executableFolder = path.dirname(require.main.filename) + "/";

  // Collection of image models.
  images = {};

  // Collection of folders to scan.
  folders = [];

  // Create file processor queue  to parse files against Google Vision.
  queueProcessor = function(filepath, callback) {
    return scanFile(filepath, callback);
  };

  fileQueue = async.queue(queueProcessor, 4);

  // File processor queue will drain once we have processed all files.
  fileQueue.drain = function() {
    return finished();
  };

  // Default options.
  options = {
    decimals: 2,
    extensions: ["png", "jpg", "gif", "bpm", "raw", "webp"],
    labels: false,
    landmarks: false,
    logos: false,
    overwrite: false,
    safe: false,
    verbose: false
  };

  // Transforms safe search strings to score.
  likelyhood = {
    VERY_UNLIKELY: 0,
    UNLIKELY: 0.15,
    POSSIBLE: 0.45,
    LIKELY: 0.75,
    VERY_LIKELY: 0.95
  };

  // Set start time (Unix timestamp).
  startTime = Date.now();

  // Show help on command line (imgrecog.js -help).
  showHelp = function() {
    console.log("");
    console.log("imgrecog.js <options> <folders>");
    console.log("");
    console.log("  -labels            detect labels");
    console.log("  -landmarks         detect landmarks");
    console.log("  -logos             detect logos");
    console.log("  -safe              detect safe search");
    console.log("  -all               detect all (same as enabling everything above)");
    console.log("  -overwrite   -w    reprocess existing files / overwrite tags");
    console.log("  -verbose     -v    enable verbose");
    console.log("  -help        -h    help me (this screen)");
    console.log("");
    console.log("");
    console.log("Examples:");
    console.log("");
    console.log("Detect labels and safe search on current directory");
    console.log("  $ imgrecog.js -labels -safe");
    console.log("");
    console.log("Detect everything and overwrite tags on specific directories");
    console.log("  $ imgrecog.js -all -w /home/someuser/images /home/someuser/photos");
    return console.log("");
  };

  // Get parameters from command line.
  getParams = function() {
    var f, j, k, len, len1, p, params;
    params = Array.prototype.slice.call(process.argv, 2);
    // No parameters? Show help.
    if (params.length === 0) {
      showHelp();
      return process.exit(0);
    }
// Check params...
    for (j = 0, len = params.length; j < len; j++) {
      p = params[j];
      switch (p) {
        case "-h":
        case "-help":
          showHelp();
          return process.exit(0);
        case "-v":
        case "-verbose":
          options.verbose = true;
          break;
        case "-w":
        case "-overwrite":
          options.overwrite = true;
          break;
        case "-all":
          options.labels = true;
          options.landmarks = true;
          options.logos = true;
          options.safe = true;
          break;
        case "-labels":
          options.labels = true;
          break;
        case "-landmarks":
          options.landmarks = true;
          break;
        case "-logos":
          options.logos = true;
          break;
        case "-safe":
          options.safe = true;
          break;
        default:
          folders.push(p);
      }
    }
    // Exit if no folders were passed, search on current directory.
    if (folders.length < 1) {
      folders.push(currentFolder);
      return process.exit(0);
    }
    for (k = 0, len1 = folders.length; k < len1; k++) {
      f = folders[k];
      if (f.substring(0, 1) === "-") {
        console.log(`Abort! Invalid option: ${f}. Use -help to get a list of available options.`);
        return process.exit(0);
      }
    }
  };

  // Scan and process image file.
  scanFile = async function(filepath, callback) {
    var ex, exists, j, k, key, l, label, land, len, len1, len2, len3, logo, logtext, m, outputData, outputPath, r, ref, result, score, tags, value;
    outputPath = filepath + ".tags";
    tags = {};
    // File was processed before?
    exists = fs.existsSync(outputPath);
    if (exists) {
      if (options.overwrite) {
        if (options.verbose) {
          console.log(filepath, "already processed, overwrite");
        }
      } else {
        if (options.verbose) {
          console.log(filepath, "already processed, skip");
        }
        return;
      }
    }
    // Detect labels?
    if (options.labels) {
      try {
        result = (await client.labelDetection(filepath));
        result = result[0].labelAnnotations;
        logtext = [];
// Add labels as tags.
        for (j = 0, len = result.length; j < len; j++) {
          label = result[j];
          score = label.score.toFixed(options.decimals);
          logtext.push(`${label.description}:${score}`);
          tags[label.description] = score;
        }
        if (options.verbose && logtext.length > 0) {
          console.log(filepath, "labels", logtext.join(", "));
        }
      } catch (error) {
        ex = error;
        console.error(filepath, "labels", ex);
      }
    }
    // Detect landmarks?
    if (options.landmarks) {
      try {
        result = (await client.landmarkDetection(filepath));
        result = result[0].landmarkAnnotations;
        logtext = [];
// Add landmarks as tags.
        for (k = 0, len1 = result.length; k < len1; k++) {
          r = result[k];
          ref = r.landmarks;
          for (l = 0, len2 = ref.length; l < len2; l++) {
            land = ref[l];
            score = land.score.toFixed(options.decimals);
            logtext.push(`${land.description}:${score}`);
            tags[land.description] = score;
          }
        }
        if (options.verbose && logtext.length > 0) {
          console.log(filepath, "landmarks", logtext.join(", "));
        }
      } catch (error) {
        ex = error;
        console.error(filepath, "landmarks", ex);
      }
    }
    // Detect logos?
    if (options.logos) {
      try {
        result = (await client.logoDetection(filepath));
        result = result[0].logoAnnotations;
        logtext = [];
// Add logos as tags.
        for (m = 0, len3 = result.length; m < len3; m++) {
          logo = result[m];
          score = logo.score.toFixed(options.decimals);
          logtext.push(`${logo.description}:${score}`);
          tags[logo.description] = score;
        }
        if (options.verbose && logtext.length > 0) {
          console.log(filepath, "logos", logtext.join(", "));
        }
      } catch (error) {
        ex = error;
        console.error(filepath, "logos", ex);
      }
    }
    // Detect safe search?
    if (options.safe) {
      try {
        result = (await client.safeSearchDetection(filepath));
        result = result[0].safeSearchAnnotation;
        logtext = [];
// Add safe search labels as tags.
        for (key in result) {
          value = result[key];
          score = likelyhood[value];
          logtext.push(`${key}:${score}`);
          tags[key] = score;
        }
        if (options.verbose && logtext.length > 0) {
          console.log(filepath, "safe", logtext.join(", "));
        }
      } catch (error) {
        ex = error;
        console.error(filepath, "safe", ex);
      }
    }
    // Output data to JSON.
    outputData = JSON.stringify(tags, null, 2);
    try {
      // Write results to .json file.
      return fs.writeFile(outputPath, outputData, function(err) {
        if (err != null) {
          console.error(filepath, "write file", err);
        } else {
          console.log(filepath, `processed ${(Object.keys(tags).length)} tags`);
        }
        return callback();
      });
    } catch (error) {
      ex = error;
      return console.error(filepath, "write file", ex);
    }
  };

  // Scan a folder to match duplicates.
  scanFolder = function(folder, callback) {
    var contents, ex, i, scanner;
    if (options.verbose) {
      console.log("");
      console.log(`Scanning ${folder} ...`);
    }
    // Helper to scan folder contents (directories and files).
    scanner = function(file) {
      var ex, ext, filepath, stats;
      filepath = path.join(folder, file);
      ext = path.extname(filepath).toLowerCase().replace(".", "");
      try {
        stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
          return scanFolder(filepath);
        } else {
          if (options.extensions.indexOf(ext) >= 0) {
            return fileQueue.push(filepath);
          } else if (options.verbose) {
            return console.log(filepath, "extensions not included, skip");
          }
        }
      } catch (error) {
        ex = error;
        return console.error(`Error reading ${filepath}: ${ex}`);
      }
    };
    if (!path.isAbsolute(folder)) {
      // Make sure we have the correct folder path.
      folder = executableFolder + folder;
    }
    try {
      contents = fs.readdirSync(folder);
      if (options.verbose) {
        console.log(`${folder} has ${contents.length} itens`);
      }
      i = 0;
      while (i < contents.length) {
        scanner(contents[i]);
        i++;
      }
      if (callback != null) {
        return callback(null);
      }
    } catch (error) {
      ex = error;
      console.error(`Error reading ${folder}: ${ex}`);
      if (callback != null) {
        return callback(ex);
      }
    }
  };

  // Finished!
  finished = function(err, result) {
    var duration;
    duration = (Date.now() - startTime) / 1000;
    console.log("");
    console.log(`Finished after ${duration} seconds!`);
    // Bye!
    return console.log("");
  };

  // Run it!
  run = function() {
    var arr, credentialsCurrent, credentialsExecutable, credentialsHome, ex, folder, folderTasks, j, key, len, value;
    console.log("");
    console.log("#######################################################");
    console.log("###                 - IMGRecog.js -                 ###");
    console.log("#######################################################");
    console.log("");
    // First we get the parameters. If -help, it will end here.
    getParams();
    // Passed options.
    arr = [];
    for (key in options) {
      value = options[key];
      arr.push(`${key}: ${value}`);
    }
    console.log(`Options: ${arr.join(" | ")}`);
    credentialsExecutable = executableFolder + "imgrecog.json";
    credentialsHome = homeFolder + "imgrecog.json";
    credentialsCurrent = currentFolder + "imgrecog.json";
    try {
      // Create client, checking if a credentials.json file exists.
      if (fs.existsSync(credentialsCurrent)) {
        client = new vision.ImageAnnotatorClient({
          keyFilename: credentialsCurrent
        });
        console.log(`Using credentials from ${credentialsCurrent}`);
      } else if (fs.existsSync(credentialsHome)) {
        client = new vision.ImageAnnotatorClient({
          keyFilename: credentialsHome
        });
        console.log(`Using credentials from ${credentialsHome}`);
      } else if (fs.existsSync(credentialsExecutable)) {
        client = new vision.ImageAnnotatorClient({
          keyFilename: credentialsExecutable
        });
        console.log(`Using credentials from ${credentialsExecutable}`);
      } else {
        client = new vision.ImageAnnotatorClient();
        console.log("Using credentials from environment variables");
      }
    } catch (error) {
      ex = error;
      console.error("Could not create a Vision API client, make sure you have defined credentials on a imgrecog.json file or environment variables.", ex);
    }
    console.log("");
    folderTasks = [];
// Iterate and scan search folders.
    for (j = 0, len = folders.length; j < len; j++) {
      folder = folders[j];
      console.log(folder);
      (function(folder) {
        return folderTasks.push(function(callback) {
          return scanFolder(folder, callback);
        });
      })(folder);
    }
    console.log("");
    // Run folder scanning tasks in parallel.
    return async.parallelLimit(folderTasks, 2);
  };

  // Unhandled rejections goes here.
  process.on("unhandledRejection", function(reason, p) {
    if (options.verbose) {
      console.log("ERROR!");
      console.log(reason);
    } else {
      console.log("ERROR!", reason.message || reason.code || reason);
    }
    console.log("");
    return process.exit(0);
  });

  // Run baby run!
  // -----------------------------------------------------------------------------
  run();

}).call(this);
