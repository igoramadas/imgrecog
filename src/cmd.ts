// COMMAND LINE WRAPPER

import {hasValue, logError} from "./utils"
import imgRecog from "./index"

import fs = require("fs")
import os = require("os")
import path = require("path")
import yargs = require("yargs/yargs")

export = function () {
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
    console.log("")
    console.log("################################################################################")
    console.log("# IMGRecog.js")
    console.log("################################################################################")
    console.log("")

    // Command options.
    const argOptions = yargs(process.argv.slice(2)).options({
        e: {alias: "extensions", type: "array", default: ["png", "jpg", "jpeg", "gif", "bmp"], describe: "Allowed file extensions"},
        o: {alias: "out", type: "string", default: "imgrecog.results.json", describe: "Full path to the JSON output file"},
        l: {alias: "limit", type: "number", default: 1000, describe: "Limit API calls"},
        p: {alias: "parallel", type: "number", default: 2, describe: "How many API calls in parallel"},
        v: {alias: "verbose", type: "boolean", default: false, describe: "Verbose mode with extra logging"},
        a: {alias: "auth", type: "string", describe: "Custom path to the auth keyfilename from Google"},
        lb: {alias: "labels", type: "boolean", default: false, describe: "Detect general labels and tags"},
        ln: {alias: "landmarks", type: "boolean", default: false, describe: "Detect landmarks and famous hotspots"},
        lg: {alias: "logos", type: "boolean", default: false, describe: "Detect logos and brands"},
        un: {alias: "unsafe", type: "boolean", default: false, describe: "Detect violent, adult and unsafe images"},
        dbl: {alias: "del-bloat", type: "boolean", describe: "Delete bloat images (memes, screenshots etc...), enforces 'labels' detection"},
        dun: {alias: "del-unsafe", type: "boolean", describe: "Delete violent, adult and unsafe images, enforces 'unsafe' detection"},
        mv: {alias: "move", type: "string", describe: "Move images to the specified folder after scanning"}
    })

    // Command line options.
    argOptions.usage("Usage: $0 -[options...] --[actions] folders...")
    argOptions.demandCommand(1)

    // Examples.
    argOptions.example("$0 --labels --tags .", "Detect labels and save tags on current directory")
    argOptions.example("$0 --safe --verbose ./~", "Detect unsafe images, with verbose mode on, for images on home folder")

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

        // Options
        if (configPath != null) {
            console.log(`Loading options from file from ${configPath}`)
            configOptions = JSON.parse(fs.readFileSync(configPath, "utf8"))
        }
    } catch (ex) {
        logError(`Can't load ${configPath}`, ex, argOptions.argv.v)
        return process.exit(1)
    }

    // Transform arguments to options.
    let options: Options = {
        extensions: hasValue(argOptions.argv.e) ? argOptions.argv.e : configOptions.extensions,
        output: hasValue(argOptions.argv.o) ? argOptions.argv.o : configOptions.output,
        limit: hasValue(argOptions.argv.l) ? argOptions.argv.l : configOptions.limit,
        parallel: hasValue(argOptions.argv.p) ? argOptions.argv.p : configOptions.parallel,
        verbose: hasValue(argOptions.argv.v) ? argOptions.argv.v : configOptions.verbose,
        labels: hasValue(argOptions.argv.lb) ? argOptions.argv.lb : configOptions.labels,
        landmarks: hasValue(argOptions.argv.ln) ? argOptions.argv.ln : configOptions.landmarks,
        logos: hasValue(argOptions.argv.lg) ? argOptions.argv.lg : configOptions.logos,
        unsafe: hasValue(argOptions.argv.un) ? argOptions.argv.un : configOptions.unsafe,
        deleteBloat: hasValue(argOptions.argv.dbl) ? argOptions.argv.dbl : configOptions.deleteBloat,
        deleteUnsafe: hasValue(argOptions.argv.dun) ? argOptions.argv.dun : configOptions.deleteUnsafe,
        move: hasValue(argOptions.argv.mv) ? argOptions.argv.mv : configOptions.move
    }

    // Get credentials from the correct file.
    if (argOptions.argv.a) {
        options.authfile = argOptions.argv.a
    } else if (fs.existsSync(credentialsCurrent)) {
        options.authfile = credentialsCurrent
    } else if (fs.existsSync(credentialsHome)) {
        options.authfile = credentialsHome
    } else if (fs.existsSync(credentialsExecutable)) {
        options.authfile = credentialsExecutable
    }

    imgRecog.run(options)
}
