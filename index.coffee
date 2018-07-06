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

# Collection of image models.
images = {}

# Collection of folders to scan.
folders = []

# Create file processor queue  to parse files against Google Vision.
queueProcessor = (filepath, callback) -> scanFile filepath, callback
fileQueue = asyncLib.queue queueProcessor, 4

# File processor queue will drain once we have processed all files.
fileQueue.drain = -> finished()

# Default options.
options = {
    decimals: 2
    extensions: ["png", "jpg", "jpeg", "gif", "bpm", "raw", "webp"]
    limit: 10000
    overwrite: false
    verbose: false
    # Below are the available identification commands.
    labels: false
    landmarks: false
    logos: false
    safe: false
}

# Transforms safe search strings to scores.
likelyhood = {
    VERY_UNLIKELY: 0
    UNLIKELY: 0.15
    POSSIBLE: 0.45
    LIKELY: 0.75
    VERY_LIKELY: 0.95
}

# Set start time (Unix timestamp).
startTime = Date.now()

# Show help on command line (imgrecog.js -help).
showHelp = ->
    console.log ""
    console.log "imgrecog.js <options> <folders>"
    console.log ""
    console.log "  -labels            detect labels"
    console.log "  -landmarks         detect landmarks"
    console.log "  -logos             detect logos"
    console.log "  -safe              detect safe search"
    console.log "  -all               detect all (same as enabling everything above)"
    console.log "  -overwrite   -w    reprocess existing files / overwrite tags"
    console.log "  -verbose     -v    enable verbose"
    console.log "  -help        -h    help me (this screen)"
    console.log ""
    console.log ""
    console.log "Examples:"
    console.log ""
    console.log "Detect labels and safe search on current directory"
    console.log "  $ imgrecog.js -labels -safe"
    console.log ""
    console.log "Detect everything and overwrite tags on specific directories"
    console.log "  $ imgrecog.js -all -w /home/someuser/images /home/someuser/photos"
    console.log ""

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
            when "-w", "-overwrite"
                options.overwrite = true
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
                folders.push p

    # Exit if no folders were passed, search on current directory.
    if folders.length < 1
        folders.push currentFolder
        return process.exit 0

    for f in folders
        if f.substring(0, 1) is "-"
            console.log "Abort! Invalid option: #{f}. Use -help to get a list of available options."
            return process.exit 0

# Call the Vision API and return result so we can process tags.
apiResult = (filepath, method, key) ->
    return new Promise (resolve, reject) ->
        try
            result = await method filepath
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
        if options.overwrite
            console.log filepath, "already processed, overwrite" if options.verbose
        else
            console.log filepath, "already processed, skip" if options.verbose
            callback()

    # Detect labels?
    if options.labels
        try
            result = await apiResult filepath, client.labelDetection, "labelAnnotations"
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
            result = await apiResult filepath, client.landmarkDetection, "landmarkAnnotations"
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
            result = await apiResult filepath, client.logoDetection, "logoAnnotations"
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
            result = await apiResult filepath, client.safeSearchDetection, "safeSearchAnnotation"
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
    if options.verbose
        console.log ""
        console.log "Scanning #{folder} ..."

    # Helper to scan folder contents (directories and files).
    scanner = (file) ->
        filepath = path.join folder, file
        ext = path.extname(filepath).toLowerCase().replace ".", ""

        try
            stats = fs.statSync filepath

            if stats.isDirectory()
                scanFolder filepath
            else
                if options.extensions.indexOf(ext) >= 0
                    fileQueue.push filepath
                else if options.verbose
                    console.log filepath, "extensions not included, skip"
        catch ex
            console.error "Error reading #{filepath}: #{ex}"

    # Make sure we have the correct folder path.
    folder = executableFolder + folder if not path.isAbsolute folder

    try
        contents = fs.readdirSync folder

        if options.verbose
            console.log "#{folder} has #{contents.length} itens"

        i = 0
        while i < contents.length
            scanner contents[i]
            i++

        callback null if callback?
    catch ex
        console.error "Error reading #{folder}: #{ex}"
        callback ex if callback?

# Finished!
finished = (err, result) ->
    duration = (Date.now() - startTime) / 1000

    console.log ""
    console.log "Finished after #{duration} seconds!"

    # Bye!
    console.log ""

# Run it!
run = ->
    console.log ""
    console.log "#######################################################"
    console.log "###                 - IMGRecog.js -                 ###"
    console.log "#######################################################"
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
            console.log "Loading config from #{configPath}"
            configJson = fs.readFileSync configPath, "utf8"
            configJson = JSON.parse configJson
            options[key] = value for key, value of configJson

    catch ex
        console.error "Can't load #{configPath}", ex

    # First we get the parameters. If -help, it will end here.
    getParams()

    # Passed options.
    arr = []
    for key, value of options
        arr.push "#{key}: #{value}"

    console.log "Options: #{arr.join(" | ")}"

    # Create client, checking if a credentials.json file exists.
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
    folderTasks = []

    # Iterate and scan search folders.
    for folder in folders
        console.log folder
        do (folder) -> folderTasks.push (callback) -> scanFolder folder, callback

    console.log ""

    # Run folder scanning tasks in parallel.
    asyncLib.parallelLimit folderTasks, 2

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
