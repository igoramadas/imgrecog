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
        this.apiCalls++

        try {
            const apiCall = await this.client.objectLocalization(filepath)
            const apiResult = apiCall[0].localizedObjectAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} objects`)

            const logtext = []
            let tags: any = {}

            // Add objects as tags.
            for (let obj of apiResult) {
                const key = normalizeTag(obj.name)
                const score = normalizeScore(obj.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    tags[key] = score
                }
            }

            const objects = logtext.length > 0 ? logtext.join(", ") : "NONE"
            const logDetails = `${filepath}: ${objects}`
            logInfo(options, logDetails)

            return {
                file: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting objects`, ex)
            return null
        }
    }

    /**
     * Detect labels and tags for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLabels = async (options: Options, filepath: string): Promise<ImageResult> => {
        this.apiCalls++

        try {
            const apiCall = await this.client.labelDetection(filepath)
            const apiResult = apiCall[0].labelAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} labels`)

            const logtext = []
            let tags: any = {}

            // Add labels as tags.
            for (let label of apiResult) {
                const key = normalizeTag(label.description)
                const score = normalizeScore(label.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    tags[key] = score
                }
            }

            const labels = logtext.length > 0 ? logtext.join(", ") : "NONE"
            const logDetails = `${filepath}: ${labels}`
            logInfo(options, logDetails)

            return {
                file: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting labels`, ex)
            return null
        }
    }

    /**
     * Detect landmarks for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLandmarks = async (options: Options, filepath: string): Promise<ImageResult> => {
        this.apiCalls++

        try {
            const apiCall = await this.client.landmarkDetection(filepath)
            const apiResult = apiCall[0].landmarkAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} landmarks`)

            const logtext = []
            let tags: any = {}

            // Add landmarks as tags.
            for (let land of apiResult) {
                const key = normalizeTag(land.description)
                const score = normalizeScore(land.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    tags[key] = score
                }
            }

            const landmarks = logtext.length > 0 ? logtext.join(", ") : "NONE"
            const logDetails = `${filepath}: ${landmarks}`
            logInfo(options, logDetails)

            return {
                file: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting landmarks`, ex)
            return null
        }
    }

    /**
     * Detect logos and brands for the specified image.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectLogos = async (options: Options, filepath: string): Promise<ImageResult> => {
        this.apiCalls++

        try {
            const apiCall = await this.client.logoDetection(filepath)
            const apiResult = apiCall[0].logoAnnotations
            logDebug(options, `${filepath} got ${apiResult.length} logos`)

            const logtext = []
            let tags: any = {}

            // Add logos as tags.
            for (let logo of apiResult) {
                const key = normalizeTag(`logo-${logo.description}`)
                const score = normalizeScore(logo.score)

                if (score) {
                    logtext.push(`${key}:${score}`)
                    tags[key] = score
                }
            }

            const logos = logtext.length > 0 ? logtext.join(", ") : "NONE"
            const logDetails = `${filepath}: ${logos}`
            logInfo(options, logDetails)

            return {
                file: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting logos`, ex)
            return null
        }
    }

    /**
     * Detect if the specified image is unsafe (violent, adult, racy, medical, spoof).
     * All these tags will be prefixed with "explicit".
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detectUnsafe = async (options: Options, filepath: string): Promise<ImageResult> => {
        this.apiCalls++

        try {
            const apiCall = await this.client.safeSearchDetection(filepath)
            const apiResult = apiCall[0].safeSearchAnnotation
            const apiKeys = Object.keys(apiResult)
            logDebug(options, `${filepath} got ${apiKeys.length} unsafe properties`)

            const logtext = []
            let tags: any = {}

            // Add safe search labels as tags.
            for (let unsafeKey of apiKeys) {
                if (unsafeKey.indexOf("Confidence") > 0) continue
                const value = apiResult[unsafeKey]
                const key = normalizeTag(`explicit-${unsafeKey}`)
                const score = normalizeScore(likelyhood[value])

                if (score) {
                    logtext.push(`${key}:${score}`)
                    tags[key] = score
                }
            }

            const unsafe = logtext.length > 0 ? logtext.join(", ") : "NONE"
            const logDetails = `${filepath}: ${unsafe}`
            logInfo(options, logDetails)

            return {
                file: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(options, `${filepath} - error detecting unsafe`, ex)
            return null
        }
    }
}

// Exports...
export default new Vision()
