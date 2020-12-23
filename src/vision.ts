// GOOGLE VISION

import {logDebug, logError, logInfo, normalizeScore, normalizeTag} from "./utils"
import vision = require("@google-cloud/vision")

// Likelyhood texts matched with a numeric score.
const likelyhood = {
    VERY_UNLIKELY: 0,
    UNLIKELY: 0.21,
    POSSIBLE: 0.51,
    LIKELY: 0.71,
    VERY_LIKELY: 0.91
}

/**
 * Google Vision API wrapper.
 */
export class Vision {
    description: "Google Vision API"

    /**
     * The Google Vision API client.
     */
    client: vision.v1.ImageAnnotatorClient

    /**
     * Number of API calls made to the Google Vision API.
     */
    apiCalls: number

    /**
     * Prepare the Google Vision client.
     * @param options Program options with the authfile.
     */
    prepare = async (options: Options): Promise<void> => {
        try {
            this.client = new vision.ImageAnnotatorClient({keyFilename: options.googleKeyfile})
            logDebug(options, `Google credentials from file ${options.googleKeyfile}`)
        } catch (ex) {
            logError(options, "Could not create the Google Vision API client", ex)
        }

        // Reset API call counter to 0.
        this.apiCalls = 0
    }

    /**
     * Detect objects on the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectObjects = async (options: Options, filepath: string): Promise<ImageResult> => {
        const logtext = []
        const result: ImageResult = {
            file: filepath,
            tags: {}
        }

        try {
            const apiCall = await this.client.objectLocalization(filepath)
            this.apiCalls++

            // Get the object annotations from the result.
            const apiResult = apiCall[0].localizedObjectAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} objects`)

            // Add objects as tags.
            for (let obj of apiResult) {
                const key = normalizeTag(obj.name)
                const score = normalizeScore(obj.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    result.tags[key] = obj.score
                }
            }

            const objects = logtext.length > 0 ? logtext.join(", ") : "None"
            const logDetails = `${filepath}: Google Vision - ${objects}`

            if (objects != "None") {
                logInfo(options, logDetails)
            } else {
                logDebug(options, logDetails)
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting objects`, ex)
            result.error = ex.message || ex.toString()
        }

        return result
    }

    /**
     * Detect labels and tags for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLabels = async (options: Options, filepath: string): Promise<ImageResult> => {
        const logtext = []
        const result: ImageResult = {
            file: filepath,
            tags: {}
        }

        try {
            const apiCall = await this.client.labelDetection(filepath)
            this.apiCalls++

            // Get the label annotations from the result.
            const apiResult = apiCall[0].labelAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} labels`)

            // Add labels as tags.
            for (let label of apiResult) {
                const key = normalizeTag(label.description)
                const score = normalizeScore(label.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    result.tags[key] = label.score
                }
            }

            const labels = logtext.length > 0 ? logtext.join(", ") : "None"
            const logDetails = `${filepath}: Google Vision - ${labels}`

            if (labels != "None") {
                logInfo(options, logDetails)
            } else {
                logDebug(options, logDetails)
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting labels`, ex)
            result.error = ex.message || ex.toString()
        }

        return result
    }

    /**
     * Detect landmarks for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLandmarks = async (options: Options, filepath: string): Promise<ImageResult> => {
        const logtext = []
        const result: ImageResult = {
            file: filepath,
            tags: {}
        }

        try {
            const apiCall = await this.client.landmarkDetection(filepath)
            this.apiCalls++

            // Get the landmark annotations from the result.
            const apiResult = apiCall[0].landmarkAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} landmarks`)

            // Add landmarks as tags.
            for (let land of apiResult) {
                const key = normalizeTag(land.description)
                const score = normalizeScore(land.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    result.tags[key] = land.score
                }
            }

            const landmarks = logtext.length > 0 ? logtext.join(", ") : "None"
            const logDetails = `${filepath}: Google Vision - ${landmarks}`

            if (landmarks != "None") {
                logInfo(options, logDetails)
            } else {
                logDebug(options, logDetails)
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting landmarks`, ex)
            result.error = ex.message || ex.toString()
        }

        return result
    }

    /**
     * Detect logos and brands for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLogos = async (options: Options, filepath: string): Promise<ImageResult> => {
        const logtext = []
        const result: ImageResult = {
            file: filepath,
            tags: {}
        }

        try {
            const apiCall = await this.client.logoDetection(filepath)
            this.apiCalls++

            // Get the logo annotations from the result.
            const apiResult = apiCall[0].logoAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} logos`)

            // Add logos as tags.
            for (let logo of apiResult) {
                const key = normalizeTag(`logo-${logo.description}`)
                const score = normalizeScore(logo.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    result.tags[key] = logo.score
                }
            }

            const logos = logtext.length > 0 ? logtext.join(", ") : "None"
            const logDetails = `${filepath}: Google Vision - ${logos}`

            if (logos != "None") {
                logInfo(options, logDetails)
            } else {
                logDebug(options, logDetails)
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting logos`, ex)
            result.error = ex.message || ex.toString()
        }

        return result
    }

    /**
     * Detect if the specified image is unsafe (violent, adult, racy, medical, spoof).
     * All these tags will be prefixed with "explicit".
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectUnsafe = async (options: Options, filepath: string): Promise<ImageResult> => {
        const logtext = []
        const result: ImageResult = {
            file: filepath,
            tags: {}
        }

        try {
            const apiCall = await this.client.safeSearchDetection(filepath)
            this.apiCalls++

            // Get the safe search annotations from the result.
            const apiResult = apiCall[0].safeSearchAnnotation
            const apiKeys = Object.keys(apiResult)
            logDebug(options, `${filepath} got ${apiKeys.length} unsafe properties`)

            // Add safe search labels as tags.
            for (let unsafeKey of apiKeys) {
                if (unsafeKey.indexOf("Confidence") > 0) continue
                const value = apiResult[unsafeKey]
                const key = normalizeTag(`explicit-${unsafeKey}`)
                const score = normalizeScore(likelyhood[value])

                if (score) {
                    logtext.push(`${key}:${score}`)
                    result.tags[key] = likelyhood[value]
                }
            }

            const unsafe = logtext.length > 0 ? logtext.join(", ") : "None"
            const logDetails = `${filepath}: Google Vision - ${unsafe}`

            if (unsafe != "None") {
                logInfo(options, logDetails)
            } else {
                logDebug(options, logDetails)
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting unsafe`, ex)
            result.error = ex.message || ex.toString()
        }

        return result
    }
}

// Exports...
export default new Vision()
