// ACTIONS

import {logDebug, logError, logInfo} from "./utils"
import fs = require("fs")
import path = require("path")

/**
 * Delete images according to the filter
 * @param options Program options including a valid filter.
 * @param images Images to be deleted.
 */
export async function deleteImages(options: Options, images: ImageResult[]) {
    for (let image of images) {
        try {
            if (fs.existsSync) {
                fs.unlinkSync(image.file)
                logInfo(options, `${image.file} - deleted`)
            }
        } catch (ex) {
            logError(options, `${image.file} - error deleting`, ex)
        }
    }
}

/**
 * Move images according to the filter.
 * @param options Program options including a valid filter.
 * @param images Images to be moved.
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
            logError(options, `${image.file} - error moving file`, ex)
        }
    }
}
