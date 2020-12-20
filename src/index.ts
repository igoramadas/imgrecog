// IMGRECOG INDEX

import {logDebug, logError, logInfo, logWarn, getEXIF} from "./utils"
import {deleteBloat, deleteUnsafe, moveImages} from "./actions"
import sightengine from "./sightengine"
import vision from "./vision"
import asyncLib = require("async")
import logger = require("anyhow")
import fs = require("fs")
import path = require("path")

/**
 * IMGRecog.js main module.
 */
export class IMGRecog {
    constructor(options: Options) {
        this.options = options

        // Make sure the logger is set.
        if (options.verbose) {
            logger.levels.push("debug")
        }
    }

    /**
     * Program options.
     */
    options: Options

    /**
     * List of scanned images with their results.
     */
    results: ImageResult[]

    /**
     * File scanning queue.
     */
    queue: asyncLib.QueueObject<any>

    /**
     * If running, when did the process start.
     */
    startTime: Date

    /**
     * Run the thing!
     */
    run = async (): Promise<void> => {
        if (!this.options.folders || this.options.folders.length < 1) {
            throw new Error("No folders were passed")
        }

        // Reset state.
        this.results = []
        this.startTime = new Date()

        const logOptions = Object.entries(this.options).map((opt) => `${opt[0]}: ${opt[1]}`)
        logDebug(this.options, `Options: ${logOptions.join(" | ")}`)

        // Implied options.
        if (this.options.deleteBloat) {
            if (!this.options.labels) {
                logDebug(this.options, "Action deleteBloat implies 'labels' detection")
            }
            this.options.labels = true
        }
        if (this.options.deleteUnsafe) {
            if (!this.options.unsafe) {
                logDebug(this.options, "Action deleteUnsafe implies 'unsafe' detection")
            }
            this.options.unsafe = true
        }

        // Prepare the Vision API client.
        await vision.prepare(this.options)

        // Create the images scanning queue.
        this.queue = asyncLib.queue(this.scanFile, this.options.parallel)

        // Scan image files on the specified folders.
        for (let folder of this.options.folders) {
            this.scanFolder(folder)
        }

        // Run file scanning tasks in parallel.
        try {
            await this.queue.drain()
            this.end()
        } catch (ex) {
            logError(this.options, `Failure  processing images`, ex)
        }
    }

    /**
     * End the scanning tasks.
     * @param kill Force kill the scanning queue.
     */
    end = async (kill?: boolean) => {
        try {
            if (kill) {
                this.queue.kill()
            }

            const duration = (Date.now() - this.startTime.valueOf()) / 1000
            logInfo(this.options, `Scanned ${this.results.length} images in ${duration} seconds`)

            await this.executeActions()
            await this.saveOutput()

            if (this.options.console) {
                console.log("")
            }
        } catch (ex) {
            logError(this.options, `Failure ending the processing queue`, ex)
        }
    }

    /**
     * Get image files for the specified folder.
     * @param folder Image file path.
     */
    scanFolder = (folder: string) => {
        const scanner = (scanpath: string) => {
            const filepath = path.join(folder, scanpath)

            try {
                const stats = fs.statSync(filepath)

                if (stats.isDirectory()) {
                    if (this.options.deep) {
                        this.scanFolder(filepath)
                    }
                } else {
                    const ext = path.extname(filepath).toLowerCase().replace(".", "")

                    if (this.options.extensions.indexOf(ext) >= 0) {
                        logDebug(this.options, `${filepath} added to queue`)
                        this.queue.push(filepath)
                    }
                }
            } catch (ex) {
                logError(this.options, `Error reading ${filepath}`, ex)
            }
        }

        // Make sure we have the correct folder path.
        if (!path.isAbsolute(folder)) {
            folder = path.join(process.cwd(), folder)
        }

        logInfo(this.options, `Scanning ${folder}`)

        try {
            const contents = fs.readdirSync(folder)
            logDebug(this.options, `Found ${contents.length} files`)

            for (let filepath of contents) {
                scanner(filepath)
            }
        } catch (ex) {
            logError(this.options, `Error reading ${folder}`, ex)
        }
    }

    /**
     * Scan the specified image file.
     * @param filepath Image file path.
     * @param callback Callback method.
     */
    scanFile = async (filepath: string, callback: Function): Promise<void> => {
        const result: ImageResult = {
            file: filepath,
            details: {},
            tags: {}
        }

        // Do not proceed if file was already scanned before.
        if (this.results[filepath]) {
            logWarn(this.options, `File ${filepath} was already scanned`)
        }

        // Stop here once we have reached the API calls limit.
        if (vision.apiCalls >= this.options.limit) {
            if (vision.apiCalls === this.options.limit) {
                logInfo(this.options, `Limit of ${this.options.limit} API calls reached! Will NOT process more files...`)
            }

            this.end(true)
            return callback()
        }

        const extension = path.extname(filepath).toLowerCase()

        // Get file stats.
        try {
            const stat = fs.statSync(filepath)
            result.details.size = stat.size
            result.details.date = stat.mtime.toISOString()
        } catch (ex) {
            logError(this.options, `Can't get filestat for ${filepath}`, ex)
        }

        logDebug(this.options, `${filepath}: size ${result.details.size}, date ${result.details.date}`)

        // Extract EXIF tags.
        if (extension == ".jpg" || extension == ".jpeg") {
            const exif = await getEXIF(this.options, filepath)
            result.details = Object.assign(result.details, exif)
        }

        // Detect objects?
        if (this.options.objects) {
            const dResult = await vision.detectObjects(this.options, filepath)
            if (dResult) result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Detect labels?
        if (this.options.labels) {
            const dResult = await vision.detectLabels(this.options, filepath)
            if (dResult) result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Detect landmarks?
        if (this.options.landmarks) {
            const dResult = await vision.detectLandmarks(this.options, filepath)
            if (dResult) result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Detect logos?
        if (this.options.logos) {
            const dResult = await vision.detectLogos(this.options, filepath)
            if (dResult) result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Detect safe search?
        if (this.options.unsafe) {
            const dResult = await vision.detectUnsafe(this.options, filepath)
            if (dResult) result.tags = Object.assign(result.tags, dResult.tags)
        }

        // Sightengine detection?
        if (this.options.sightengineUser && this.options.sightengineSecret) {
            const dResult = await sightengine.detect(this.options, filepath)
            if (dResult) result.tags = Object.assign(result.tags, dResult.tags)
        }

        this.results.push(result)
        return callback()
    }

    /**
     * Execute actions after all passed images have been scanned.
     */
    executeActions = async (): Promise<void> => {
        let executedActions = []
        const startTime = Date.now()

        // Delete bloat images?
        if (this.options.deleteBloat) {
            executedActions.push("deleteBloat")
            await deleteBloat(this.options, this.results)
        }

        // Delete unsafe images?
        if (this.options.deleteUnsafe) {
            await deleteUnsafe(this.options, this.results)
        }

        // Move scanned files to specific directory?
        if (this.options.move) {
            await moveImages(this.options, this.results)
        }

        const duration = (Date.now() - startTime) / 1000

        // Log duration.
        if (executedActions.length > 0) {
            logDebug(this.options, `Executed actions ${executedActions.join(", ")} in ${duration} seconds`)
        } else {
            logDebug(this.options, `No extra actions were executed`)
        }
    }

    /**
     * Save the execution output results to a file.
     */
    saveOutput = async (): Promise<void> => {
        const executableFolder = path.dirname(require.main.filename) + "/"
        const target = path.isAbsolute(this.options.output) ? this.options.output : path.join(executableFolder, this.options.output)

        try {
            fs.writeFileSync(target, JSON.stringify(this.results, null, 2))
            logInfo(this.options, `Saved results to ${target}`)
        } catch (ex) {
            logError(this.options, `Could not save output to ${target}`, ex)
        }
    }
}

export default IMGRecog
