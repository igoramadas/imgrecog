// COMMAND LINE WRAPPER

import {hasValue, logError, logInfo} from "./utils"
import ImgRecog from "./index"
import fs = require("fs")
import os = require("os")
import path = require("path")
import yargs = require("yargs/yargs")

// Unhandled rejections goes here.
process.on("unhandledRejection", (err) => {
    console.error("FATAL ERROR!")
    console.error(err)
    return process.exit()
})

export = async function () {
    const defaultOptions: Options = {
        console: true,
        verbose: false
    }

    // Location to expected files.
    const currentFolder = process.cwd() + "/"
    const homeFolder = os.homedir() + "/"
    const executableFolder = path.dirname(require.main.filename) + "/"
    const credentialsExecutable = path.join(executableFolder, "imgrecog.auth.json")
    const credentialsHome = path.join(homeFolder, "imgrecog.auth.json")
    const credentialsCurrent = path.join(currentFolder, "imgrecog.auth.json")
    const configExecutable = path.join(executableFolder, "imgrecog.options.json")
    const configHome = path.join(homeFolder, "imgrecog.options.json")
    const configCurrent = path.join(currentFolder, "imgrecog.options.json")

    // Starting logs.
    logInfo(defaultOptions, "")
    logInfo(defaultOptions, "################################################################################")
    logInfo(defaultOptions, "# IMGRecog.js")
    logInfo(defaultOptions, "################################################################################")
    logInfo(defaultOptions, "")

    // Command options.
    const argOptions = yargs(process.argv.slice(2)).options({
        e: {alias: "extensions", type: "array", default: ["png", "jpg", "jpeg", "gif", "bmp"], describe: "Allowed file extensions"},
        o: {alias: "output", type: "string", default: "imgrecog.results.json", describe: "Full path to the JSON output file"},
        l: {alias: "limit", type: "number", default: 1000, describe: "Limit API calls"},
        p: {alias: "parallel", type: "number", default: 4, describe: "How many API calls in parallel"},
        d: {alias: "deep", type: "boolean", default: false, describe: "Deep scan, include subdirectories of the passed folders."},
        v: {alias: "verbose", type: "boolean", default: false, describe: "Verbose mode with extra logging"},
        glgkeyfile: {type: "string", describe: "Custom path to the auth keyfilename for Google Vision"},
        clakey: {type: "string", describe: "Clarifai API key"},
        steuser: {type: "string", describe: "Sightengine API user"},
        stesecret: {type: "string", describe: "Sightengine API secret"},
        objects: {type: "boolean", default: false, describe: "Detect objects and things"},
        labels: {type: "boolean", default: false, describe: "Detect general labels and tags"},
        landmarks: {type: "boolean", default: false, describe: "Detect landmarks and famous hotspots"},
        logos: {type: "boolean", default: false, describe: "Detect logos and brands"},
        unsafe: {type: "boolean", default: false, describe: "Detect violent, adult and unsafe images"},
        delbloat: {type: "boolean", describe: "Delete bloat images (memes, screenshots etc...), implies 'labels' detection"},
        delunsafe: {type: "boolean", describe: "Delete violent, adult and unsafe images, implies 'unsafe' detection"},
        move: {type: "string", describe: "Move images to the specified folder after scanning"}
    })

    // Command line options.
    argOptions.env("IMGRECOG")
    argOptions.implies("delbloat", "labels")
    argOptions.implies("delunsafe", "unsafe")
    argOptions.demandCommand(1)

    // Examples.
    argOptions.usage("Usage: $0 -[options...] --[actions] folders...")
    argOptions.example("$0 --labels .", "Detect labels for images on the current folder")
    argOptions.example("$0 -d --labels --unsafe .", "Detect labels and unsafe images on current folder, including subfolders")
    argOptions.example("$0 --delbloat --delunsafe ./~", "Delete bloat and unsafe images from user's home folder")
    argOptions.epilog("Need help? Post an issue at the repo https://github.com/igoramadas/imgrecog.js")

    // Options coming from a JSON config file.
    let configOptions: Options = {}
    let configPath: string

    // Try loading options from relevant imgrecog.options.json files.
    try {
        if (fs.existsSync(configCurrent)) {
            configPath = configCurrent
        } else if (fs.existsSync(configHome)) {
            configPath = configHome
        } else if (fs.existsSync(configExecutable)) {
            configPath = configExecutable
        }

        // Options loaded from file?
        if (configPath != null) {
            configOptions = JSON.parse(fs.readFileSync(configPath, "utf8"))
            logInfo(configOptions, `Loaded options from file from ${configPath}`)
        }
    } catch (ex) {
        logError({verbose: argOptions.argv.v}, `Can't load ${configPath}`, ex)
        return process.exit()
    }

    // Transform arguments to options.
    let options: Options = {
        console: true,
        folders: argOptions.argv._ as string[],
        extensions: hasValue(argOptions.argv.e) ? argOptions.argv.e : configOptions.extensions,
        output: hasValue(argOptions.argv.o) ? argOptions.argv.o : configOptions.output,
        limit: hasValue(argOptions.argv.l) ? argOptions.argv.l : configOptions.limit,
        parallel: hasValue(argOptions.argv.p) ? argOptions.argv.p : configOptions.parallel,
        verbose: hasValue(argOptions.argv.v) ? argOptions.argv.v : configOptions.verbose,
        clarifaiKey: hasValue(argOptions.argv.clakey) ? argOptions.argv.clakey : configOptions.clarifaiKey,
        sightengineUser: hasValue(argOptions.argv.steuser) ? argOptions.argv.steuser : configOptions.sightengineUser,
        sightengineSecret: hasValue(argOptions.argv.stesecret) ? argOptions.argv.stesecret : configOptions.sightengineSecret,
        objects: hasValue(argOptions.argv.objects) ? argOptions.argv.objects : configOptions.objects,
        labels: hasValue(argOptions.argv.labels) ? argOptions.argv.labels : configOptions.labels,
        landmarks: hasValue(argOptions.argv.landmarks) ? argOptions.argv.landmarks : configOptions.landmarks,
        logos: hasValue(argOptions.argv.logos) ? argOptions.argv.logos : configOptions.logos,
        unsafe: hasValue(argOptions.argv.unsafe) ? argOptions.argv.unsafe : configOptions.unsafe,
        deleteBloat: hasValue(argOptions.argv.delbloat) ? argOptions.argv.delbloat : configOptions.deleteBloat,
        deleteUnsafe: hasValue(argOptions.argv.delunsafe) ? argOptions.argv.delunsafe : configOptions.deleteUnsafe,
        move: hasValue(argOptions.argv.move) ? argOptions.argv.move : configOptions.move
    }

    // Get credentials from the correct file.
    if (hasValue(argOptions.argv.glgkeyfile)) {
        options.googleKeyfile = argOptions.argv.glgkeyfile
    } else if (fs.existsSync(credentialsCurrent)) {
        options.googleKeyfile = credentialsCurrent
    } else if (fs.existsSync(credentialsHome)) {
        options.googleKeyfile = credentialsHome
    } else if (fs.existsSync(credentialsExecutable)) {
        options.googleKeyfile = credentialsExecutable
    }

    // Do it baby!
    const imgRecog = new ImgRecog(options)
    await imgRecog.run()
}
