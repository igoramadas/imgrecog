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
        dry: {type: "boolean", describe: "Dry run, parse existing results instead of running them again"},
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
        filter: {type: "string", describe: "Filter images to be deleted or moved after the scanning"},
        move: {type: "string", describe: "Move images (according to filter) to the specified folder"},
        delete: {type: "boolean", describe: "Delete images (according to the filter))"}
    })

    // Option grouping.
    argOptions.group(["e", "o", "l", "p", "d", "v"], "Options:")
    argOptions.group(["glgkeyfile", "clakey", "steuser", "stesecret"], "Authentication:")
    argOptions.group(["objects", "labels", "logos", "unsafe", "all"], "Detection:")
    argOptions.group(["delbloat", "delunsafe", "move"], "Actions:")

    // Command line options.
    argOptions.env("IMGRECOG")
    argOptions.wrap(Math.min(100, yargs.terminalWidth()))
    argOptions.implies("move", "filter")
    argOptions.implies("delete", "filter")

    // Examples.
    argOptions.usage(`Usage: $0 -[options...] --[detections...] --[actions...] folders...`)
    argOptions.example(`$ $0 --glgkeyfile /path/to/googlekey.json --unsafe .`, "")
    argOptions.example(`$ $0 -d --clakey "mykey" --objects --labels .`, "")
    argOptions.example(`$ $0 -l 8000 --glgkeyfile google.json --clakey "mykey" --all ~/photos1 ~/photos2`, "")
    argOptions.example(`$ $0 --filter "is-porn, is-bloat" --move /photos/trash ~/photos/downloads ~/photos/camera`, "")
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
        deep: hasValue(argOptions.argv.d) ? argOptions.argv.d : configOptions.deep,
        verbose: hasValue(argOptions.argv.v) ? argOptions.argv.v : configOptions.verbose,
        dryRun: hasValue(argOptions.argv.dry) ? argOptions.argv.dry : configOptions.dryRun,
        googleKeyfile: hasValue(argOptions.argv.glgkeyfile) ? argOptions.argv.glgkeyfile : configOptions.googleKeyfile,
        clarifaiKey: hasValue(argOptions.argv.clakey) ? argOptions.argv.clakey : configOptions.clarifaiKey,
        sightengineUser: hasValue(argOptions.argv.steuser) ? argOptions.argv.steuser : configOptions.sightengineUser,
        sightengineSecret: hasValue(argOptions.argv.stesecret) ? argOptions.argv.stesecret : configOptions.sightengineSecret,
        objects: hasValue(argOptions.argv.objects) ? argOptions.argv.objects : configOptions.objects,
        labels: hasValue(argOptions.argv.labels) ? argOptions.argv.labels : configOptions.labels,
        landmarks: hasValue(argOptions.argv.landmarks) ? argOptions.argv.landmarks : configOptions.landmarks,
        logos: hasValue(argOptions.argv.logos) ? argOptions.argv.logos : configOptions.logos,
        unsafe: hasValue(argOptions.argv.unsafe) ? argOptions.argv.unsafe : configOptions.unsafe,
        all: hasValue(argOptions.argv.all) ? argOptions.argv.all : configOptions.all,
        filter: hasValue(argOptions.argv.filter) ? argOptions.argv.filter : configOptions.filter,
        move: hasValue(argOptions.argv.move) ? argOptions.argv.move : configOptions.move,
        delete: hasValue(argOptions.argv.delete) ? argOptions.argv.delete : configOptions.delete
    }

    // Do it baby!
    const imgRecog = new ImgRecog(options)
    await imgRecog.run()
}
