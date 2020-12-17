// ACTIONS

import {logError} from "./utils"
import fs = require("fs")

/**
 * Delete the passed images.
 * @param options Program options.
 * @param images Images to be deleted.
 * @param description Additional description to be appended to the logs.
 */
export function deleteImages(options: Options, images: ImageResult[], description: string) {
    for (let image of images) {
        try {
            if (fs.existsSync) {
                fs.unlinkSync(image.path)
                console.log(`Deleted image (${description}): ${image.path}`)
            }
        } catch (ex) {
            logError(`Error deleting image ${image.path}`, ex, options.verbose)
        }
    }
}

/**
 * Delete bloat images (memes, screenshots, websites etc).
 * @param options
 * @param images
 */
export function deleteBloat(options: Options, images: ImageResult[]) {
    const bloatTags = ["meme", "photo caption", "screenshot", "spoof", "website"]
    const extraTags = ["advertising", "document", "map", "text"]

    // Maximum safe single / total scores to consider.
    // Anything above these values is considered bloat.
    const singleScore = 0.89
    const totalScore = 1.29
    const toDelete: ImageResult[] = []

    // Iterate passed images to detect the bloat stuff.
    for (let image of images) {
        try {
            let imgTotalScore = 0
            let hasBloat = false

            for (let bt of bloatTags) {
                if (image.tags[bt] == null) {
                    image.tags[bt] = 0
                }

                imgTotalScore += image.tags[bt]

                if (image.tags[bt] > singleScore) {
                    hasBloat = true
                }
            }

            for (let et of extraTags) {
                if (image.tags[et] == null) {
                    image.tags[et] = 0
                }

                imgTotalScore += image.tags[et] / 3
            }

            if (hasBloat || imgTotalScore > totalScore) {
                toDelete.push(image)

                if (options.verbose) {
                    console.log(`Image ${image.path} marked as bloat`)
                }
            }
        } catch (ex) {
            logError(`Error processing image (bloat): ${image.path}`, ex, options.verbose)
        }
    }

    deleteImages(options, toDelete, "bloat")
}

/**
 * Delete unsafe images (violent, adult etc).
 * @param options
 * @param images
 */
export function deleteUnsafe(options: Options, images: ImageResult[]) {
    const toDelete: ImageResult[] = []

    // Maximum safe single / total scores to consider.
    // Anything above these values is considered unsafe.
    const singleScore = 0.84
    const totalScore = 1.49

    // Iterate passed images to detect the unsafe ones.
    for (let image of images) {
        try {
            const tags = image.tags

            if (tags.adult == null) tags.adult = 0
            if (tags.spoof == null) tags.spoof = 0
            if (tags.medical == null) tags.medical = 0
            if (tags.racy == null) tags.racy = 0
            if (tags.violence == null) tags.violence = 0

            const imgTotalScore = tags.adult + tags.spoof + tags.medical + tags.racy + tags.violence

            if (tags.adult > singleScore || tags.violence > singleScore || imgTotalScore > totalScore) {
                toDelete.push(image)

                if (options.verbose) {
                    console.log(`Image ${image.path} marked as unsafe`)
                }
            }
        } catch (ex) {
            logError(`Error processing image (unsafe): ${image.path}`, ex, options.verbose)
        }
    }

    deleteImages(options, toDelete, "unsafe")
}
