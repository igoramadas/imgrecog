#####################################################################
### IMGRecog.js
#####################################################################

asyncLib = require "async"
fs = require "fs"
os = require "os"
path = require "path"
vision = require "@google-cloud/vision"
client = null

# Get current and bin executable folder.
currentFolder = process.cwd() + "/"
homeFolder = os.homedir() + "/"
executableFolder = path.dirname(require.main.filename) + "/"

# Collection of folders to scan.
folders = []

# Collection of available scripts.
scripts = {}

# File scan count.
counter = 0

# Create file processor queue  to parse files against Google Vision.
queueProcessor = (filepath, callback) -> scanFile filepath, callback
fileQueue = asyncLib.queue queueProcessor, 4

# File processor queue will drain once we have processed all files.
fileQueue.drain = -> finishedQueue()

# Default options.
options = {
    decimals: 2
    extensions: ["png", "jpg", "jpeg", "gif", "bmp"]
    limit: 1000
    force: false
    verbose: false
    # Below are the available identification commands.
    labels: false
    landmarks: false
    logos: false
    safe: false
    # Scripts to run after processing.
    scripts: []
}

# Transforms safe search strings to scores.
likelyhood = {
    VERY_UNLIKELY: "0.00"
    UNLIKELY: "0.20"
    POSSIBLE: "0.50"
    LIKELY: "0.70"
    VERY_LIKELY: "0.90"
}

# Set start time (Unix timestamp).
startTime = Date.now()

# Show help on command line (imgrecog.js -help).
showHelp = ->
    console.log "imgrecog.js <options|script> <folders>"
    console.log ""
    console.log "Options:"
    console.log ""
    console.log "  -labels            detect labels"
    console.log "  -landmarks         detect landmarks"
    console.log "  -logos             detect logos"
    console.log "  -safe              detect safe search"
    console.log "  -all               detect all (same as enabling everything above)"
    console.log "  -force       -f    reprocess existing files / overwrite tags"
    console.log "  -verbose     -v    enable verbose"
    console.log "  -help        -h    help me (this screen)"
    console.log ""
    console.log "Scripts:"
    console.log ""
    console.log "  -delete-memes      delete previously processed memes and screenshots"
    console.log "  -delete-unsafe     delete previously processed adult and violent images"
    console.log ""
    console.log "............................................................................."
    console.log ""
    console.log "Examples:"
    console.log ""
    console.log "Detect labels and safe search on current directory"
    console.log "  $ imgrecog.js -labels -safe"
    console.log ""
    console.log "Detect everything and overwrite tags on specific directories"
    console.log "  $ imgrecog.js -all -f /home/someuser/images /home/someuser/photos"
    console.log ""
    console.log "Detect and execute scripts to delete memes and unsafe images"
    console.log "  $ imgrecog.js -safe -delete-memes -delete-unsafe /home/someuser/photos"
    console.log ""
    console.log "............................................................................."
    console.log ""
    console.log "The Google Vision API credentials must be set on a imgrecog.auth.json file."
    console.log "If you wish to change the tool options, create a imgrecog.config.json file."
    console.log "Current options:"
    console.log ""
    console.log "  decimals (#{options.decimals})"
    console.log "  extensions (#{options.extensions.join(' ')})"
    console.log "  limit (#{options.limit})"
    console.log "  force (#{options.force})"
    console.log "  verbose (#{options.verbose})"
    console.log ""
    console.log "#############################################################################"
    console.log ""

# Load scripts from /scripts folder.
getScripts = ->
    scriptsPath = path.join __dirname, "scripts"
    files = fs.readdirSync scriptsPath

    for s in files
        if path.extname(s) is ".js"
            filename = s.substring 0, s.lastIndexOf(".js")
            scripts[filename] = require "./scripts/#{s}"

# Get parameters from command line.
getParams = ->
    params = Array::slice.call process.argv, 2

    # No parameters? Show help.
    if params.length is 0
        showHelp()
        return process.exit 0

    # Parse parameters...
    for p in params
        switch p
            when "-help"
                showHelp()
                return process.exit 0
            when "-v", "-verbose"
                options.verbose = true
            when "-f", "-force"
                options.force = true
            when "-all"
                options.labels = true
                options.landmarks = true
                options.logos = true
                options.safe = true
            when "-labels"
                options.labels = true
            when "-landmarks"
                options.landmarks = true
            when "-logos"
                options.logos = true
            when "-safe"
                options.safe = true
            else
                filename = p.substring 1

                if scripts[filename]?
                    options.scripts.push filename
                else
                    folders.push p

    # If no folders were passed, search on current directory.
    if folders.length < 1
        folders.push currentFolder

    for f in folders
        if f.substring(0, 1) is "-"
            console.log "Abort! Invalid option: #{f}. Use -help to get a list of available options."
            console.log ""
            return process.exit 0

# Call the Vision API and return result so we can process tags.
apiResult = (filepath, apiMethod, key) ->
    return new Promise (resolve, reject) ->
        try
            result = await client[apiMethod] filepath
            resolve result[0][key]
        catch ex
            reject ex

# Scan and process image file.
scanFile = (filepath, callback) ->
    outputPath = filepath + ".tags"
    tags = {}

    # File was processed before?
    exists = fs.existsSync outputPath

    if exists
        if options.force
            console.log "  #{filepath}", "already processed, force overwrite" if options.verbose
        else
            console.log "  #{filepath}", "already processed, skip" if options.verbose
            return callback()

    # Increase scan counter.
    counter++

    if counter is options.limit
        delayedFinish = ->
            console.log "Limit #{counter} reached! Will NOT process more files..."
            console.log ""
            finishedQueue()
        setTimeout delayedFinish, 2000
        return callback()
    else if counter > options.limit
        return callback()

    # Detect labels?
    if options.labels
        try
            result = await apiResult filepath, "labelDetection", "labelAnnotations"
            logtext = []

            # Add labels as tags.
            for label in result
                score = label.score.toFixed options.decimals
                logtext.push "#{label.description}:#{score}"
                tags[label.description] = score

            if options.verbose and logtext.length > 0
                console.log filepath, "labels", logtext.join(", ")
        catch ex
            console.error filepath, "labels", ex

    # Detect landmarks?
    if options.landmarks
        try
            result = await apiResult filepath, "landmarkDetection", "landmarkAnnotations"
            logtext = []

            # Add landmarks as tags.
            for r in result
                if r.landmarks
                    for land in r.landmarks
                        score = land.score.toFixed options.decimals
                        logtext.push "#{land.description}:#{score}"
                        tags[land.description] = score

            if options.verbose and logtext.length > 0
                console.log filepath, "landmarks", logtext.join(", ")
        catch ex
            console.error filepath, "landmarks", ex

    # Detect logos?
    if options.logos
        try
            result = await apiResult filepath, "logoDetection", "logoAnnotations"
            logtext = []

            # Add logos as tags.
            for logo in result
                score = logo.score.toFixed options.decimals
                logtext.push "#{logo.description}:#{score}"
                tags[logo.description] = score

            if options.verbose and logtext.length > 0
                console.log filepath, "logos", logtext.join(", ")
        catch ex
            console.error filepath, "logos", ex

    # Detect safe search?
    if options.safe
        try
            result = await apiResult filepath, "safeSearchDetection", "safeSearchAnnotation"
            logtext = []

            # Add safe search labels as tags.
            for key, value of result
                score = likelyhood[value]
                logtext.push "#{key}:#{score}"
                tags[key] = score

            if options.verbose and logtext.length > 0
                console.log filepath, "safe", logtext.join(", ")
        catch ex
            console.error filepath, "safe", ex

    # Output data to JSON.
    outputData = JSON.stringify tags, null, 2

    # Write results to .json file.
    try
        fs.writeFile outputPath, outputData, (err) ->
            if err?
                console.error filepath, "write file", err
            else
                console.log filepath, "processed #{Object.keys(tags).length} tags"

            callback err
    catch ex
        console.error filepath, "write file", ex
        callback ex

# Scan a folder to match duplicates.
scanFolder = (folder, callback) ->
    scanner = (file) ->
        filepath = path.join folder, file
        ext = path.extname(filepath).toLowerCase().replace ".", ""

        try
            stats = fs.statSync filepath

            if stats.isDirectory()
                scanFolder filepath
            else
                if options.extensions.indexOf(ext) >= 0
                    if counter < options.limit
                        fileQueue.push filepath
                else if options.verbose and ext isnt "tags"
                    console.log "  #{filepath}", "skip (invalid extension)"
        catch ex
            console.error "Error reading #{filepath}: #{ex}"

    # Make sure we have the correct folder path.
    folder = executableFolder + folder if not path.isAbsolute folder

    try
        contents = fs.readdirSync folder

        console.log ""
        console.log "Scanning #{folder}"

        if options.verbose
            console.log "Found #{contents.length} files"

        i = 0
        while i < contents.length
            scanner contents[i]
            i++

        callback null if callback?
    catch ex
        console.error "Error reading #{folder}: #{ex}"
        callback ex if callback?

# Finished processing file queue.
finishedQueue = (err, result) ->
    duration = (Date.now() - startTime) / 1000

    console.log ""
    console.log "Finished processing images after #{duration} seconds"

    if options.scripts.length > 0
        for s in options.scripts
            console.log ""
            console.log "Running script #{s} ..."
            console.log ""

            try
                scriptResult = await scripts[s] folders
            catch ex
                console.error "Error running #{s}", ex

        console.log ""
        console.log "Finished running scripts"

    # Bye!
    console.log ""
    console.log ""

# Run it!
run = ->
    console.log ""
    console.log "#############################################################################"
    console.log "# IMGRecog.js"
    console.log "#############################################################################"
    console.log ""

    # Get valid filenames for the configuration and key files.
    configExecutable = path.join currentFolder, "imgrecog.config.json"
    configHome = path.join currentFolder, "imgrecog.config.json"
    configCurrent = path.join currentFolder, "imgrecog.config.json"
    credentialsExecutable = path.join executableFolder, "imgrecog.auth.json"
    credentialsHome = path.join homeFolder, "imgrecog.auth.json"
    credentialsCurrent = path.join currentFolder, "imgrecog.auth.json"

    # Load options from config file?
    try
        if fs.existsSync configCurrent
            configPath = configCurrent
         else if fs.existsSync configHome
            configPath = configHome
        else if fs.existsSync configExecutable
            configPath = configExecutable

        if configPath?
            console.log "Using config from #{configPath}"

            configJson = fs.readFileSync configPath, "utf8"
            configJson = JSON.parse configJson
            options[key] = value for key, value of configJson

    catch ex
        console.error "Can't load #{configPath}", ex

    # Load available scripts.
    getScripts()

    # Get the passed parameters. If -help, it will end here.
    getParams()

    # Passed options.
    arr = []
    for key, value of options
        if value is true
            arr.push key
        else if value isnt false
            arr.push "#{key}: #{value}"

    console.log "Options: #{arr.join(" | ")}"

    # Create client, checking if a credentials.json file exists.
    # Only if any of the identification commmands was passed.
    if options.labels or options.landmarks or options.logos or options.safe
        try
            if fs.existsSync credentialsCurrent
                client = new vision.ImageAnnotatorClient {keyFilename: credentialsCurrent}
                console.log "Using credentials from #{credentialsCurrent}"
            else if fs.existsSync credentialsHome
                client = new vision.ImageAnnotatorClient {keyFilename: credentialsHome}
                console.log "Using credentials from #{credentialsHome}"
            else if fs.existsSync credentialsExecutable
                client = new vision.ImageAnnotatorClient {keyFilename: credentialsExecutable}
                console.log "Using credentials from #{credentialsExecutable}"
            else
                client = new vision.ImageAnnotatorClient()
                console.log "Using credentials from environment variables"
        catch ex
            console.error "Could not create a Vision API client, make sure you have defined credentials on a imgrecog.json file or environment variables.", ex
            console.log ""
            process.exit 0

        folderTasks = []

        # Iterate and scan search folders.
        for folder in folders
            do (folder) -> folderTasks.push (callback) -> scanFolder folder, callback

        # Run folder scanning tasks in parallel after 1 second so we have time to confirm client credentials.
        delayedScan = ->
            asyncLib.parallelLimit folderTasks, 2, ->
                if not fileQueue.started
                    console.log ""
                    console.log "No valid images were found!"
                    console.log ""

        setTimeout delayedScan, 1200
    else
        finishedQueue()

# Unhandled rejections goes here.
process.on "unhandledRejection", (reason, p) ->
    if options.verbose
        console.log "ERROR!"
        console.log reason
    else
        console.log "ERROR!", reason.message or reason.code or reason

    console.log ""
    process.exit 0

# Run baby run!
# -----------------------------------------------------------------------------
run()
