// SIGHTENGINE

import {logDebug, logError, logInfo, normalizeTag} from "./utils"
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
     * Sightengine image detection.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detect = async (options: Options, filepath: string): Promise<ImageResult> => {
        return new Promise((resolve) => {
            this.apiCalls++

            // Image overal properties are always detected.
            const models = ["properties"]

            try {
                const form = new FormData()

                // Detect unsafe?
                if (options.unsafe) {
                    models.push("offensive")
                    models.push("nudity")
                    models.push("wad")
                }

                // Detect logos?
                if (options.logos) {
                    models.push("text")
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
                        return resolve(null)
                    }

                    let chunks: string = ""

                    // Receive response chucks from the API.
                    res.on("data", (chunk) => {
                        chunks += chunk
                    })

                    // Response complete.
                    res.on("end", function () {
                        try {
                            const logtext = []
                            const tags = {}

                            // Parse response data as JSON.
                            const data: any = JSON.parse(chunks)

                            // API returned an error?
                            if (data.error && data.status && data.status == "failure") {
                                logError(options, `${filepath} - error parsing`, new Error(data.error.message))
                                return resolve(null)
                            }

                            // Got good results?
                            if (data.status == "success") {
                                logInfo(options, `${filepath} parsed at Sightengine`)

                                // Has nudity?
                                if (data.nudity && data.nudity.raw) {
                                    const key = normalizeTag("explicit-adult")
                                    const score = data.nudity.raw.toFixed(2)
                                    logtext.push(`${key}:${score}`)
                                    tags[key] = score
                                }
                            }

                            // Results are ready.
                            return resolve({
                                file: filepath,
                                tags: tags
                            })
                        } catch (ex) {
                            logError(options, `${filepath} - error parsing response for ${models.join(", ")}`, ex)
                            return resolve(null)
                        }
                    })
                })
            } catch (ex) {
                logError(options, `${filepath} - error detecting ${models.join(", ")}`, ex)
                return resolve(null)
            }
        })
    }
}

// Exports...
export default new Sightengine()
