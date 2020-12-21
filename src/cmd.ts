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
        e: {alias: "extensions", type: "array", describe: "Allowed file extensions"},
        o: {alias: "output", type: "string", describe: "Full path to the JSON output file"},
        l: {alias: "limit", type: "number", describe: "Limit API calls (per service, default 1000)"},
        p: {alias: "parallel", type: "number", describe: "How many files processed in parallel (default 5)"},
        d: {alias: "deep", type: "boolean", describe: "Deep scan, include subdirectories of the passed folders."},
        v: {alias: "verbose", type: "boolean", describe: "Verbose mode with extra logging"},
        glgkeyfile: {type: "string", describe: "Custom path to the keyfilename for Google Vision"},
        clakey: {type: "string", describe: "Clarifai API key"},
        steuser: {type: "string", describe: "Sightengine API user"},
        stesecret: {type: "string", describe: "Sightengine API secret"},
        objects: {type: "boolean", describe: "Detect objects and things"},
        labels: {type: "boolean", describe: "Detect general labels and tags"},
        landmarks: {type: "boolean", describe: "Detect landmarks and famous places"},
        logos: {type: "boolean", describe: "Detect logos and brands"},
        unsafe: {type: "boolean", describe: "Detect unsafe and explicit images"},
        delbloat: {type: "boolean", describe: "Delete bloat images (memes, screenshots, thumbnails etc...), implies 'labels' detection"},
        delunsafe: {type: "boolean", describe: "Delete violent, adult and generally NSFW images, implies 'unsafe' detection"},
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
    argOptions.epilog("Need help? Post an issue at the repo https://github.com/igoramadas/imgrecog")

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
        extensions: hasValue(argOptions.argv.e) ? (argOptions.argv.e as string[]) : configOptions.extensions,
        output: hasValue(argOptions.argv.o) ? argOptions.argv.o : configOptions.output,
        limit: hasValue(argOptions.argv.l) ? argOptions.argv.l : configOptions.limit,
        parallel: hasValue(argOptions.argv.p) ? argOptions.argv.p : configOptions.parallel,
        verbose: hasValue(argOptions.argv.v) ? argOptions.argv.v : configOptions.verbose,
        googleKeyfile: hasValue(argOptions.argv.glgkeyfile) ? argOptions.argv.glgkeyfile : configOptions.googleKeyfile,
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

    // Do it baby!
    const imgRecog = new ImgRecog(options)
    await imgRecog.run()
}
