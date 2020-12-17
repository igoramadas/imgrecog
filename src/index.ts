// IMGRECOG INDEX

import {logError} from "./utils"
import {deleteBloat, deleteUnsafe} from "./actions"
import vision from "./vision"
import asyncLib = require("async")
import fs = require("fs")
import path = require("path")

// Unhandled rejections goes here.
process.on("unhandledRejection", (err) => {
    console.error("FATAL ERROR!")
    console.error(err)
    return process.exit(0)
})

/**
 * IMGRecog.js main module.
 */
export class IMGRecog {
    /**
     * List of processed folders on the last run.
     */
    folders = {}

    /**
     * List of scanned images with their results.
     */
    results: ImageResult[]

    /**
     * Run the thing!
     * @param options Program options.
     */
    run = (options: Options) => {
        if (!options.folders || options.folders.length < 1) {
            throw new Error("No folders were passed")
        }

        // Reset results.
        this.results = []

        if (options.verbose) {
            const logOptions = Object.entries(options).map((opt) => `${opt[0]}: ${opt[1]}`)
            console.log(`Options: ${logOptions.join(" | ")}`)
        }

        // Prepare the Vision API client.
        vision.prepare(options)

        // Create file processor queue to parse images against Google Vision.
        const queueProcessor = (filepath, callback) => this.scanFile(options, filepath, callback)
        const fileQueue = asyncLib.queue(queueProcessor, options.parallel)
        const folderTasks = []

        // Add folders to the scanning queue.
        for (let folder of options.folders) {
            const pusher = (f) => folderTasks.push((callback) => this.scanFolder(options, f, fileQueue, callback))
            pusher(folder)
        }

        // File processor queue will drain once we have processed all files.
        fileQueue.drain = async (err?) => {
            if (err) {
                console.error(err)
            }

            const duration = (Date.now() - startTime) / 1000

            console.log("")
            console.log(`Scanned ${this.results.length} images after ${duration} seconds`)

            // Delete bloat images?
            if (options.deleteBloat) {
                await deleteBloat(options, this.results)
            }

            // Delete unsafe images?
            if (options.deleteUnsafe) {
                await deleteUnsafe(options, this.results)
            }

            // Bye!
            console.log("")
        }

        // Set start time (Unix timestamp).
        const startTime = Date.now()

        // Run folder scanning tasks in parallel after 1 second so we have time to confirm client credentials.
        const delayedScan = () =>
            asyncLib.parallelLimit(folderTasks, options.parallel, function () {
                if (!fileQueue.started) {
                    console.log("")
                    console.log("No valid images were found!")
                    console.log("")
                    return
                }
            })

        return setTimeout(delayedScan, 1000)
    }

    /**
     * Scan the specified image file.
     * @param options Program options.
     * @param filepath Image file path.
     * @param queue File processing queue.
     * @param callback Callback method.
     */
    scanFolder = (options: Options, folder: string, queue, callback?) => {
        const scanner = (file: string) => {
            const filepath = path.join(folder, file)
            const ext = path.extname(filepath).toLowerCase().replace(".", "")

            try {
                const stats = fs.statSync(filepath)

                if (stats.isDirectory()) {
                    return this.scanFolder(options, filepath, queue)
                } else {
                    if (options.extensions.indexOf(ext) >= 0) {
                        if (this.results.length < options.limit) {
                            return queue.push(filepath)
                        }
                    } else if (options.verbose && ext !== "tags") {
                        return console.log(`  ${filepath}`, "skip (invalid extension)")
                    }
                }
            } catch (ex) {
                return console.error(`Error reading ${filepath}: ${ex}`)
            }
        }

        // Make sure we have the correct folder path.
        if (!path.isAbsolute(folder)) {
            folder = process.cwd() + "/" + folder
        }

        try {
            const contents = fs.readdirSync(folder)

            console.log("")
            console.log(`Scanning ${folder}`)

            if (options.verbose) {
                console.log(`Found ${contents.length} files`)
            }

            for (let filepath of contents) {
                scanner(filepath)
            }

            if (callback != null) {
                return callback(null)
            }
        } catch (ex) {
            logError(`Error reading ${folder}`, ex, options.verbose)

            if (callback != null) {
                return callback(ex)
            }
        }
    }

    /**
     * Scan the specified image file.
     * @param options Program options.
     * @param filepath Image file path.
     * @param callback Callback method.
     */
    scanFile = async (options: Options, filepath: string, callback) => {
        const result: ImageResult = {
            path: filepath,
            tags: {}
        }

        if (this.results.length === options.limit) {
            const delayedFinish = function () {
                console.log(`Limit ${options.limit} reached! Will NOT process more files...`)
                console.log("")
                return this.finishedQueue()
            }

            setTimeout(delayedFinish, 2000)

            return callback()
        }

        // Over the limit?
        if (this.results.length > options.limit) {
            return callback()
        }

        // Detect labels?
        if (options.labels) {
            const dResult = await vision.detectLabels(options, filepath)
            result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Detect landmarks?
        if (options.landmarks) {
            const dResult = await vision.detectLandmarks(options, filepath)
            result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Detect logos?
        if (options.logos) {
            const dResult = await vision.detectLogos(options, filepath)
            result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Detect safe search?
        if (options.unsafe) {
            const dResult = await vision.detectUnsafe(options, filepath)
            result.tags = Object.assign(result.tags, dResult.tags)
        }

        this.results.push(result)
    }
}

export default new IMGRecog()
