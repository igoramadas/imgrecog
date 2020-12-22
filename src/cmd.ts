// COMMAND LINE WRAPPER

import {hasValue, logError, logInfo} from "./utils"
import ImgRecog from "./index"
import fs = require("fs")
import os = require("os")
import path = require("path")
import yargs = require("yargs")
import yargsIntance = require("yargs/yargs")

// Unhandled rejections goes here.
process.on("unhandledRejection", (err) => {
    console.error("FATAL ERROR!")
    console.error(err)
    return process.exit()
})

export = async function () {
    const currentFolder = process.cwd() + "/"
    const homeFolder = os.homedir() + "/"
    const executableFolder = path.dirname(require.main.filename) + "/"
    const configExecutable = path.join(executableFolder, "imgrecog.options.json")
    const configHome = path.join(homeFolder, "imgrecog.options.json")
    const configCurrent = path.join(currentFolder, "imgrecog.options.json")

    // Command options.
    const argOptions = yargsIntance(process.argv.slice(2)).options({
        e: {alias: "extensions", type: "array", describe: "Allowed file extensions"},
        o: {alias: "output", type: "string", describe: "Full path to the JSON output file"},
        l: {alias: "limit", type: "number", describe: "Limit API calls (per service, default 1000)"},
        p: {alias: "parallel", type: "number", describe: "How many files processed in parallel (default 5)"},
        d: {alias: "deep", type: "boolean", describe: "Deep scan, include subdirectories."},
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
        all: {type: "boolean", describe: "Detect everything (all of the above)"},
        delbloat: {type: "boolean", describe: "Delete bloat images (lowres, memes, screenshots, thumbnails etc)"},
        delunsafe: {type: "boolean", describe: "Delete violent, adult and generally NSFW images"},
        move: {type: "string", describe: "Move images to the specified folder after scanning"}
    })

    // Option grouping.
    argOptions.group(["e", "o", "l", "p", "d", "v"], "Options:")
    argOptions.group(["glgkeyfile", "clakey", "steuser", "stesecret"], "Authentication:")
    argOptions.group(["objects", "labels", "logos", "unsafe", "all"], "Detection:")
    argOptions.group(["delbloat", "delunsafe", "move"], "Actions:")

    // Command line options.
    argOptions.env("IMGRECOG")
    argOptions.wrap(Math.min(100, yargs.terminalWidth()))
    argOptions.implies("delbloat", "labels")
    argOptions.implies("delunsafe", "unsafe")
    argOptions.demandCommand(1)

    // Examples.
    argOptions.usage(`Usage: $0 -[options...] --[detections...] --[actions...] folders...`)
    argOptions.example(`$ $0 --glgkeyfile /path/to/googlekey.json --unsafe .`, "")
    argOptions.example(`$ $0 -d --clakey "mykey" --objects --labels .`, "")
    argOptions.example(`$ $0 -l 8000 --glgkeyfile google.json --clakey "mykey" --all ~/photos1 ~/photos2`, "")
    argOptions.epilog("Need help? More info at https://github.com/igoramadas/imgrecog")

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

    // Detect everything?
    if (argOptions.argv.all) {
        options.objects = options.labels = options.landmarks = options.logos = options.unsafe = true
    }

    // Do it baby!
    const imgRecog = new ImgRecog(options)
    await imgRecog.run()
}
