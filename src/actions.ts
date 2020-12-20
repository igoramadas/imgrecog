// ACTIONS

import {logDebug, logError, logInfo} from "./utils"
import fs = require("fs")
import path = require("path")

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
                fs.unlinkSync(image.file)
                logInfo(options, `${image.file} - deleted (${description})`)
            }
        } catch (ex) {
            logError(options, `${image.file} - error deleting`, ex)
        }
    }
}

/**
 * Delete bloat images (memes, screenshots, websites etc).
 * @param options Program options.
 * @param images Scanned images.
 */
export async function deleteBloat(options: Options, images: ImageResult[]) {
    const bloatTags = ["meme", "photo-caption", "screenshot", "website", "explicit-spoof"]
    const extraTags = ["advertising", "document", "text", "logo-facebook", "logo-twitter", "logo-instagram", "logo-whatsapp"]

    // Minimum safe single / total scores to consider.
    // Anything above these values is considered bloat.
    const singleScore = 0.89
    const totalScore = 1.79
    const toDelete: ImageResult[] = []

    // Iterate passed images to detect the bloat stuff.
    for (let image of images) {
        try {
            let imgTotalScore = 0
            let hasBloat = false

            // Images smaller than 50KB are automatically considered bloat.
            if (image.details.size && image.details.size < 50000) {
                toDelete.push(image)
                logDebug(options, `${image.file} marked as bloat due to small size`)
                continue
            }

            // Check for main bloat tags.
            for (let bt of bloatTags) {
                if (!image.tags[bt]) {
                    image.tags[bt] = "0"
                }

                imgTotalScore += parseFloat(image.tags[bt])

                if (parseFloat(image.tags[bt]) > singleScore) {
                    hasBloat = true
                }
            }

            // Check for extra tags and logos.
            for (let et of extraTags) {
                if (!image.tags[et]) {
                    image.tags[et] = "0"
                }

                imgTotalScore += parseFloat(image.tags[et])
            }

            if (hasBloat && imgTotalScore > totalScore) {
                toDelete.push(image)
                logDebug(options, `${image.file} marked as bloat due to score`)
            }
        } catch (ex) {
            logError(options, `${image.file} - error processing bloat tags`, ex)
        }
    }

    deleteImages(options, toDelete, "bloat")
}

/**
 * Delete unsafe images (violent, adult, medical and/or racy). Here we do not count spoof messages.
 * @param options Program options.
 * @param images Scanned images.
 */
export async function deleteUnsafe(options: Options, images: ImageResult[]) {
    const unsafeTags = ["explicit-adult", "explicit-violence", "explicit-medical", "explicit-racy"]
    const toDelete: ImageResult[] = []

    // Minimum safe single / total scores to consider.
    // Anything above these values is considered unsafe.

    const singleScore = 0.89
    const totalScore = 1.52

    // Iterate passed images to detect the unsafe ones.
    for (let image of images) {
        try {
            let imgTotalScore = 0

            // Detect violence and adult content.
            const isAdult = parseFloat(image.tags["explicit-adult"]) > singleScore
            const isViolence = parseFloat(image.tags["explicit-violence"]) > singleScore

            for (let ut of unsafeTags) {
                if (!image.tags[ut]) {
                    image.tags[ut] = "0"
                }

                imgTotalScore += parseFloat(image.tags[ut])
            }

            if (isAdult || isViolence || imgTotalScore > totalScore) {
                toDelete.push(image)
                logDebug(options, `${image.file} marked as unsafe, total score ${imgTotalScore}`)
            }
        } catch (ex) {
            logError(options, `${image.file} - error processing unsafe tags`, ex)
        }
    }

    deleteImages(options, toDelete, "unsafe")
}

/**
 * Move scanned images to the specified folder.
 * @param options Program options.
 * @param images Scanned images.
 */
export async function moveImages(options: Options, images: ImageResult[]) {
    const targetFolder = options.move
    logDebug(options, `Will move ${images.length} scanned images to: ${targetFolder}`)

    try {
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, {recursive: true})
        }
    } catch (ex) {
        logError(options, `Error creating target folder: ${targetFolder}`, ex)
        return
    }

    // Iterate passed images to move them.
    for (let image of images) {
        try {
            if (!fs.existsSync(image.file)) {
                logDebug(options, `${image.file} does not exist, will not move`)
                continue
            }

            const targetFile = path.join(targetFolder, image.file)
            const folder = path.dirname(targetFile)

            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, {recursive: true})
            }

            fs.renameSync(image.file, targetFolder)
        } catch (ex) {
            logError(options, `${image.file} - error moving image file`, ex)
        }
    }
}
