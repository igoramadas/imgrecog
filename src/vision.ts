// VISION

import {logError} from "./utils"
import vision = require("@google-cloud/vision")

// Defaults to 2 decimals when calculating scores.
const decimals = 2

/**
 * Vision's API wrapper.
 */
export class Vision {
    client: vision.v1.ImageAnnotatorClient

    /**
     * Prepare the Google Vision client.
     * @param options Program options with the authfile.
     */
    prepare = (options: Options): void => {
        try {
            if (options.authfile) {
                this.client = new vision.ImageAnnotatorClient({keyFilename: options.authfile})
                console.log(`Using credentials from file ${options.authfile}`)
            } else {
                this.client = new vision.ImageAnnotatorClient()
                console.log("Using credentials from environment variables")
            }
        } catch (ex) {
            logError("Could not create the Google Vision API client", ex, options.verbose)
            return process.exit(1)
        }
    }

    /**
     * Detect labels and tags for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLabels = async (options: Options, filepath: string): Promise<ImageResult> => {
        try {
            const apiCall = await this.client.labelDetection(filepath)
            const apiResult = apiCall[0].labelAnnotations
            const logtext = []
            let tags: any

            // Add labels as tags.
            for (let label of apiResult) {
                const score = label.score.toFixed(decimals)
                logtext.push(`${label.description}:${score}`)
                tags[label.description] = score
            }

            if (options.verbose && logtext.length > 0) {
                console.log(filepath, "labels", logtext.join(", "))
            }

            return {
                path: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(`Can't detect labels for ${filepath}`, ex, options.verbose)
        }
    }

    /**
     * Detect landmarks for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLandmarks = async (options: Options, filepath: string): Promise<ImageResult> => {
        try {
            const apiCall = await this.client.landmarkDetection(filepath)
            const apiResult = apiCall[0].landmarkAnnotations
            const logtext = []
            let tags: any

            // Add landmarks as tags.
            for (let land of apiResult) {
                const score = land.score.toFixed(decimals)
                logtext.push(`${land.description}:${score}`)
                tags[land.description] = score
            }

            if (options.verbose && logtext.length > 0) {
                console.log(filepath, "landmarks", logtext.join(", "))
            }

            return {
                path: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(`Can't detect landmarks for ${filepath}`, ex, options.verbose)
        }
    }

    /**
     * Detect logos and brands for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLogos = async (options: Options, filepath: string): Promise<ImageResult> => {
        try {
            const apiCall = await this.client.logoDetection(filepath)
            const apiResult = apiCall[0].logoAnnotations
            const logtext = []
            let tags: any

            // Add logos as tags.
            for (let logo of apiResult) {
                const score = logo.score.toFixed(decimals)
                logtext.push(`${logo.description}:${score}`)
                tags[logo.description] = score
            }

            if (options.verbose && logtext.length > 0) {
                console.log(filepath, "logos", logtext.join(", "))
            }

            return {
                path: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(`Can't detect logos for ${filepath}`, ex, options.verbose)
        }
    }

    /**
     * Detect if the specified image is unsafe (violent, adult, etc.).
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectUnsafe = async (options: Options, filepath: string): Promise<ImageResult> => {
        try {
            const apiCall = await this.client.safeSearchDetection(filepath)
            const apiResult = apiCall[0].safeSearchAnnotation
            const logtext = []
            let tags: any

            // Add safe search labels as tags.
            for (let key in Object.keys(apiResult)) {
                const value = apiResult[key]
                const score = Likelyhood[value]
                logtext.push(`${key}:${score}`)
                tags[key] = score
            }

            if (options.verbose && logtext.length > 0) {
                console.log(filepath, "safe", logtext.join(", "))
            }

            return {
                path: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(`Can't detect unsafe features for ${filepath}`, ex, options.verbose)
        }
    }
}

// Exports...
export default new Vision()
