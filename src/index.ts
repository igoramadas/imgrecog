// IMGRECOG.JS INDEX

import {logDebug, logError, logInfo, logWarn, hasValue, normalizeScore} from "./utils"
import {deleteImages, moveImages} from "./actions"
import categorizer from "./categorizer"
import clarifai from "./clarifai"
import sightengine from "./sightengine"
import vision from "./vision"
import logger = require("anyhow")
import fs = require("fs")
import path = require("path")

// Default options.
const defaultOptions: Options = {
    extensions: ["png", "jpg", "jpeg", "gif", "bmp"],
    output: "imgrecog.results.json",
    limit: 1000,
    parallel: 5
}

/**
 * IMGRecog.js main module.
 */
class IMGRecog {
    constructor(options: Options) {
        this.options = options

        // Enforce default options.
        if (!this.options.extensions || this.options.extensions.length < 0) {
            this.options.extensions = defaultOptions.extensions
        } else {
            this.options.extensions = this.options.extensions.map((e) => e.toLowerCase())
        }
        if (!this.options.output || this.options.output.length < 0) {
            this.options.output = defaultOptions.output
        }
        if (!this.options.limit || this.options.limit < 1) {
            this.options.limit = defaultOptions.limit
        }
        if (!this.options.parallel || this.options.parallel < 1) {
            this.options.parallel = defaultOptions.parallel
        }

        // Make sure the logger is set.
        if (this.options.verbose) {
            logger.levels.push("debug")
        }
    }

    /**
     * Program options.
     */
    options: Options

    /**
     * List of files to be scanned.
     */
    files: string[]

    /**
     * List of scanned images with their results.
     */
    results: ImageResult[]

    /**
     * If running, when did the process start.
     */
    startTime: Date

    /**
     * Run the thing and return the results (also stored under the .results property).
     */
    run = async (): Promise<ImageResult[]> => {
        logInfo(this.options, "###############")
        logInfo(this.options, "# IMGRecog.js #")
        logInfo(this.options, "###############")

        const arr = Object.entries(this.options).map((opt) => (hasValue(opt[1]) ? `${opt[0]}: ${opt[1]}` : null))
        const logOptions = arr.filter((opt) => opt !== null)
        logDebug(this.options, `Options: ${logOptions.join(" | ")}`)

        if (this.options.dryRun && (!this.options.folders || this.options.folders.length < 1)) {
            throw new Error("No folders were passed")
        }

        // Action passed without a filter?
        if (!this.options.filter) {
            if (this.options.move) throw new Error(`Missing filter for the "move" action`)
            if (this.options.delete) throw new Error(`Missing filter for the "delete" action`)
        }

        // Filter was passed, but no action?
        if (this.options.filter && !this.options.delete && !this.options.move) {
            logWarn(this.options, `A filter was passed, but no actions (delete or move)`)
        }

        // Reset state.
        this.files = []
        this.results = []
        this.startTime = new Date()

        // Dry run? Parse existing results instead.
        if (this.options.dryRun) {
            logInfo(this.options, `Dry run, will only parse existing results...`)

            const existing = await this.readOutput()

            if (!existing || existing.length == 0) {
                logWarn(this.options, `No valid results loaded from ${this.options.output}`)
                return []
            }

            // Valid results are loaded from the passed output file.
            this.results = existing
            logInfo(this.options, `Loaded ${this.results.length} results from ${this.options.output}`)

            // Execute actions on loaded results.
            await this.executeActions()

            return this.results
        }

        // Prepare the detection clients.
        if (this.options.googleKeyfile) await vision.prepare(this.options)
        if (this.options.clarifaiKey) await clarifai.prepare(this.options)
        if (this.options.sightengineUser && this.options.sightengineSecret) await sightengine.prepare(this.options)

        // Scan folders and then process all files.
        try {
            for (let folder of this.options.folders) {
                this.scanFolder(folder)
            }

            // Process files in chunks (according to the parallel limit).
            for (let i = 0, j = this.files.length; i < j; i += this.options.parallel) {
                const chunk = this.files.slice(i, i + this.options.parallel)
                await Promise.all(chunk.map(async (filepath: string) => await this.scanFile(filepath)))
            }

            this.end()
        } catch (ex) {
            logError(this.options, `Failure processing images`, ex)
        }

        return this.results
    }

    /**
     * End the scanning tasks.
     * @param kill Force kill the scanning queue.
     */
    end = async () => {
        try {
            const duration = (Date.now() - this.startTime.valueOf()) / 1000
            logInfo(this.options, `Scanned ${this.results.length} images in ${duration} seconds`)

            await this.executeActions()

            this.saveOutput()

            logInfo(this.options, "")
        } catch (ex) {
            logError(this.options, `Failure ending the program`, ex)
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
                        this.files.push(filepath)
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
     */
    scanFile = async (filepath: string): Promise<void> => {
        const result: ImageResult = {
            file: filepath,
            tags: {}
        }

        // Do not proceed if file was already scanned before.
        if (this.results[filepath]) {
            logWarn(this.options, `File ${filepath} was already scanned`)
        }

        // Get file stats.
        try {
            const stat = fs.statSync(filepath)
            result.size = stat.size
        } catch (ex) {
            logError(this.options, `Can't get filestat for ${filepath}`, ex)
        }

        logDebug(this.options, `${filepath}: size ${result.size} bytes`)

        const methods = []

        // Google Vision detection.
        if (this.options.googleKeyfile) {
            if (vision.apiCalls >= this.options.limit) {
                if (vision.apiCalls === this.options.limit) {
                    logWarn(this.options, `Limit of ${this.options.limit} API calls reached on Google Vision`)
                }
            } else {
                if (this.options.all || this.options.objects) methods.push(vision.detectObjects)
                if (this.options.all || this.options.labels) methods.push(vision.detectLabels)
                if (this.options.all || this.options.landmarks) methods.push(vision.detectLandmarks)
                if (this.options.all || this.options.logos) methods.push(vision.detectLogos)
                if (this.options.all || this.options.unsafe) methods.push(vision.detectUnsafe)
            }
        }

        // Clarifai detection.
        if (this.options.clarifaiKey) {
            if (clarifai.apiCalls >= this.options.limit) {
                if (clarifai.apiCalls === this.options.limit) {
                    logWarn(this.options, `Limit of ${this.options.limit} API calls reached on Clarifai`)
                }
            } else {
                methods.push(clarifai.detect)
            }
        }

        // Sightengine detection.
        if (this.options.sightengineUser && this.options.sightengineSecret) {
            if (clarifai.apiCalls >= this.options.limit) {
                if (clarifai.apiCalls === this.options.limit) {
                    logWarn(this.options, `Limit of ${this.options.limit} API calls reached on Clarifai`)
                }
            } else {
                methods.push(sightengine.detect)
            }
        }

        // Execute detection methods.
        await Promise.all(
            methods.map(async (method: Function) => {
                const mResult = await method.call(null, this.options, filepath)
                if (!mResult) return null

                // Append result tags.
                result.tags = Object.assign(result.tags, mResult.tags)

                // Errors were found? Append to the error array.
                if (mResult.error) {
                    if (!result.error) result.error = []
                    result.error.push = mResult.error
                }

                return mResult
            })
        )

        // Run the ategorized.
        const isTags = categorizer.parse(this.options, result)
        result.tags = Object.assign(result.tags, isTags)

        this.results.push(result)
    }

    /**
     * Execute actions after all passed images have been scanned.
     */
    executeActions = async (): Promise<void> => {
        const startTime = Date.now()

        // Execute actions only if a filter was passed.
        if (this.options.filter) {
            let filteredResults = []
            const arrFilter = this.options.filter.replace(/ /g, "").split(",")

            for (let filter of arrFilter) {
                try {
                    let tempResults
                    let parts: string[]
                    let tag: string
                    let score: number

                    if (filter.indexOf(">") > 0) {
                        parts = filter.split(">")
                        tag = parts[0]
                        score = parseFloat(parts[1])

                        tempResults = this.results.filter((r) => r.tags[tag] && r.tags[tag] > score)
                        logDebug(this.options, `Filtered ${tempResults.length} results having ${tag} > ${score}`)
                    } else if (filter.indexOf("<") > 0) {
                        parts = filter.split("<")
                        tag = parts[0]
                        score = parseFloat(parts[1])
                        if (score < 0) score = 0

                        tempResults = this.results.filter((r) => r.tags[tag] || r.tags[tag] < score)
                        logDebug(this.options, `Filtered ${tempResults.length} results having ${tag} < ${score}`)
                    } else if (filter.indexOf("=") > 0) {
                        parts = filter.split("=")
                        tag = parts[0]
                        score = parseFloat(parts[1])

                        tempResults = this.results.filter((r) => r.tags[tag] == score)
                        logDebug(this.options, `Filtered ${tempResults.length} results having ${tag} = ${score}`)
                    } else if (filter.indexOf("!") >= 0) {
                        tag = filter
                        tempResults = this.results.filter((r) => !r.tags[tag])
                        logDebug(this.options, `Filtered ${tempResults.length} results not having ${tag}`)
                    } else {
                        tag = filter
                        tempResults = this.results.filter((r) => r.tags[tag])
                        logDebug(this.options, `Filtered ${tempResults.length} results having ${tag}`)
                    }

                    // Merge to the filtered results.
                    if (tempResults.length > 0) {
                        filteredResults = filteredResults.concat(tempResults)
                    }
                } catch (ex) {
                    logError(this.options, `Invalid filter: ${filter}`, ex)
                }
            }

            // Filter returned results? Remove duplicates and execute specified actions.
            if (filteredResults.length > 0) {
                filteredResults = filteredResults.filter((item, index) => filteredResults.indexOf(item) === index)

                if (this.options.move) await moveImages(this.options, this.results)
                if (this.options.delete) await deleteImages(this.options, this.results)
            } else {
                logDebug(this.options, `Filter ${this.options.filter} returned no results`)
            }
        }

        const duration = (Date.now() - startTime) / 1000

        // Log duration.
        if (this.options.move || this.options.delete) {
            logDebug(this.options, `Executed actions in ${duration} seconds`)
        }
    }

    /**
     * Save the execution output results to a file.
     */
    saveOutput = (): void => {
        const currentFolder = process.cwd() + "/"
        const target = path.isAbsolute(this.options.output) ? this.options.output : path.join(currentFolder, this.options.output)

        try {
            const replacer = (_key, value) => (!isNaN(value) && value <= 1 ? normalizeScore(value) : value)
            fs.writeFileSync(target, JSON.stringify(this.results, replacer, 2))
            logInfo(this.options, `Saved results to ${target}`)
        } catch (ex) {
            logError(this.options, `Could not save output to ${target}`, ex)
        }
    }

    /**
     * Read results from the saved output.
     */
    readOutput = (): ImageResult[] => {
        const currentFolder = process.cwd() + "/"
        const target = path.isAbsolute(this.options.output) ? this.options.output : path.join(currentFolder, this.options.output)

        try {
            const data = fs.readFileSync(target, "utf8")
            return JSON.parse(data)
        } catch (ex) {
            logError(this.options, `Could not read results from ${target}`, ex)
            return []
        }
    }
}

export default IMGRecog
