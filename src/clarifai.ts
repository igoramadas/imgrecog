// CLARIFAI

import {logDebug, logInfo, logError, normalizeScore, normalizeTag} from "./utils"
import fs = require("fs")
import https = require("https")

/**
 * Clarifai API wrapper.
 */
export class Clarifai {
    description: "Clarifai API"

    /**
     * Number of API calls made to the Clarifai API.
     */
    apiCalls: number

    /**
     * Prepare the Clarifai client.
     * @param options Program options.
     */
    prepare = async (options: Options): Promise<void> => {
        logDebug(options, `Clarifai API key: ${options.clarifaiKey}`)
    }

    /**
     * Clarifai image detection.
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    detect = async (options: Options, filepath: string): Promise<ImageResult> => {
        return new Promise((resolve) => {
            let done = false
            const logtext = []
            const result: ImageResult = {
                file: filepath,
                tags: {}
            }

            try {
                const buffer = fs.readFileSync(filepath)

                // Default headers.
                const headers = {}
                headers["Authorization"] = `Key ${options.clarifaiKey}`
                headers["Content-Type"] = "application/json"
                headers["User-Agent"] = "IMGRecog.js"

                // Build request options.
                const reqOptions = {
                    port: 443,
                    hostname: "api.clarifai.com",
                    path: "/v2/models/aaa03c23b3724a16a56b629203edc62c/outputs",
                    method: "POST",
                    headers: headers
                }

                // Post data, we send the image as a base64 encoded string.
                const postData = {
                    inputs: [
                        {
                            data: {
                                image: {
                                    base64: buffer.toString("base64")
                                }
                            }
                        }
                    ]
                }

                // Here we go!
                const req = https.request(reqOptions, (res) => {
                    let chunks: string = ""

                    res.setEncoding("utf8")

                    // Receive response chucks from the API.
                    res.on("data", (chunk) => {
                        chunks += chunk
                    })

                    // Response complete.
                    res.on("end", function () {
                        this.apiCalls++

                        try {
                            const data: any = JSON.parse(chunks)

                            // Got an error?
                            if (!data.status || data.status.code != 10000) {
                                const err = data.status ? data.status.description : "Invalid response"
                                logError(options, `${filepath} - error parsing Clarifai response`, err)
                                result.error = err

                                if (!done) resolve(null)
                                done = true
                            }

                            // Parse result tags.
                            if (data.outputs) {
                                for (let out of data.outputs) {
                                    for (let concept of out.data.concepts) {
                                        const key = normalizeTag(concept.name)
                                        const score = normalizeScore(concept.value)

                                        if (score) {
                                            logtext.push(`${key}:${score}`)
                                            result.tags[key] = score
                                        }
                                    }
                                }
                            }

                            const details = logtext.length > 0 ? logtext.join(", ") : "NONE"
                            const logDetails = `${filepath}: ${details}`
                            logInfo(options, logDetails)

                            // Results are ready.
                            return resolve(result)
                        } catch (resEx) {
                            logError(options, `${filepath} - error parsing Clarifai response`, resEx)
                            result.error = resEx.message || resEx.toString()

                            if (!done) resolve(null)
                            done = true
                        }
                    })
                })

                req.on("error", (err) => {
                    logError(options, `${filepath} - error sending to Clarifai`, err)
                    result.error = err.message || err.toString()

                    if (!done) resolve(null)
                    done = true
                })

                req.write(JSON.stringify(postData, null, 0))
                req.end()
            } catch (ex) {
                logError(options, `${filepath} - could not send to Clarifai`, ex)
                result.error = ex.message || ex.toString()

                if (!done) resolve(null)
                done = true
            }
        })
    }
}

// Exports...
export default new Clarifai()
