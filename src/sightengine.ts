// SIGHTENGINE

import {logDebug, logError, logInfo, normalizeScore, normalizeTag} from "./utils"
import FormData = require("form-data")
import fs = require("fs")

/**
 * Sightentine API wrapper.
 */
export class Sightengine {
    description: "Sightengine API"

    /**
     * Number of API calls made to the Sightengine API.
     */
    apiCalls: number

    /**
     * Prepare the Sightengine client.
     * @param options Program options.
     */
    prepare = async (options: Options): Promise<void> => {
        logDebug(options, `Sightengine API user ${options.sightengineUser}, secret ${options.sightengineSecret}`)
    }

    /**
     * Sightengine image detection.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detect = async (options: Options, filepath: string): Promise<ImageResult> => {
        return new Promise((resolve) => {
            const logtext = []
            const models = ["properties", "text"]
            const result: ImageResult = {
                file: filepath,
                tags: {}
            }

            try {
                const form = new FormData()
                let chunks: string = ""

                // Detect unsafe?
                if (options.unsafe) {
                    models.push("offensive")
                    models.push("scam")
                    models.push("nudity")
                    models.push("wad")
                }

                // Create form data to be posted to Sightengine.
                form.append("api_user", options.sightengineUser)
                form.append("api_secret", options.sightengineSecret)
                form.append("models", models.join(","))
                form.append("media", fs.createReadStream(filepath))

                logDebug(options, `${filepath} - posting to Sightengine now`)

                form.submit("https://api.sightengine.com/1.0/check.json", (err, res) => {
                    if (err) {
                        logError(options, `${filepath} - error detecting ${models.join(", ")}`, err)
                        result.error = err.message || err.toString()
                        return resolve(result)
                    }

                    // Receive response chucks from the API.
                    res.on("data", (chunk) => {
                        chunks += chunk
                    })

                    // Response complete.
                    res.on("end", function () {
                        this.apiCalls++

                        try {
                            const data: any = JSON.parse(chunks)

                            // API returned an error?
                            if (data.error && data.status && data.status == "failure") {
                                logError(options, `${filepath} - error parsing`, new Error(data.error.message))
                                result.error = data.error.message
                                return resolve(result)
                            }

                            // Got good results?
                            if (data.status == "success") {
                                if (data.nudity && data.nudity.raw) {
                                    const key = normalizeTag("nude")
                                    const score = normalizeScore(data.nudity.raw)

                                    if (score) {
                                        logtext.push(`${key}:${score}`)
                                        result.tags[key] = data.nudity.raw
                                    }
                                }

                                const details = logtext.length > 0 ? logtext.join(", ") : "No tags"
                                const logDetails = `${filepath}: Sightengine - ${details}`
                                logInfo(options, logDetails)
                            }

                            // Results are ready.
                            return resolve(result)
                        } catch (resEx) {
                            logError(options, `${filepath} - error parsing response for ${models.join(", ")}`, resEx)
                            result.error = resEx.message || resEx.toString()
                            return resolve(result)
                        }
                    })
                })
            } catch (ex) {
                logError(options, `${filepath} - error detecting ${models.join(", ")}`, ex)
                result.error = ex.message || ex.toString()
                return resolve(result)
            }
        })
    }
}

// Exports...
export default new Sightengine()
