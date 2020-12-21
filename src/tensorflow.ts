// TENSORFLOW

import {logDebug, logError, logInfo, normalizeTag} from "./utils"
import fs = require("fs")
import mobilenet = require("@tensorflow-models/mobilenet")
import tfnode = require("@tensorflow/tfjs-node")

/**
 * TensorFlow wrapper.
 */
export class TensowFlow {
    description: "TensorFlow Local API"

    /**
     * The MobileNet model.
     */
    tfModel: mobilenet.MobileNet

    /**
     * Prepare the TensorFlow MobileNet model.
     * @param options Program options.
     */
    prepare = async (options: Options): Promise<void> => {
        if (!this.tfModel) {
            require("@tensorflow/tfjs")

            this.tfModel = await mobilenet.load()
            logDebug(options, `Loaded TensorFlow / MobileNet model`)
        }
    }

    /**
     * Parse the image against the
     * @param options Program options.
     * @param filepath Image file to be scanned.
     */
    parse = async (options: Options, filepath: string): Promise<ImageResult> => {
        try {
            const buffer = fs.readFileSync(filepath)
            const tfImage: any = tfnode.node.decodeImage(buffer)
            const results = await this.tfModel.classify(tfImage)

            const logtext = []
            const tags = {}

            // Iterate results and set individual tags.
            for (let prediction of results) {
                const keywords = prediction.className.split(",")

                for (let kw of keywords) {
                    const key = normalizeTag(kw)
                    const score = prediction.probability.toFixed(2)
                    logtext.push(`${key}:${score}`)
                    tags[key] = score
                }
            }

            const details = logtext.length > 0 ? logtext.join(", ") : "NONE"
            const logDetails = `${filepath}: tags - ${details}`
            logInfo(options, logDetails)

            return {
                file: filepath,
                tags: tags
            }
        } catch (ex) {
            logError(options, `${filepath} - error parsing`, ex)
        }
    }
}

// Exports...
export default new TensowFlow()
