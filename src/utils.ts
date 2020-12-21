// UTILS

import logger = require("anyhow")
logger.setup()

/**
 * Helper to log debugging information (only when verbose is true).
 * @param options Program options.
 * @param message Message to be logged.
 */
export function logDebug(options: Options, message: string) {
    if (!options.console || !options.verbose) return

    logger.debug(message)
}

/**
 * Helper to log important info.
 * @param options Program options.
 * @param message Message to be logged.
 */
export function logInfo(options: Options, message: string) {
    if (!options.console) return

    logger.info(message)
}

/**
 * Helper to log warnings.
 * @param options Program options.
 * @param message Message to be logged.
 */
export function logWarn(options: Options, message: string) {
    if (!options.console) return

    logger.warn(message)
}

/**
 * Helper to log errors according to the verbose option. If console logging
 * is disable on options, it will throw the passed error instead.
 * @param options Program options.
 * @param message Message to be logged.
 * @param ex Exception object to be logged.
 */
export function logError(options: Options, message: string, ex: Error) {
    if (!options.console) {
        ex.message = `${message} | ${ex.message}`
        throw ex
    }

    if (options.verbose) {
        logger.error(message)
        logger.error(ex)
    } else {
        logger.error(message, ex.toString())
    }
}

/**
 * Helper to check if the passed value has an actual value.
 * @param value The value to be checked.
 */
export function hasValue(value: any): boolean {
    return value !== null && typeof value != "undefined"
}

/**
 * Helper to get a normalized tag name.
 * @param value Label or description.
 */
export function normalizeTag(value: string): string {
    return value.toLowerCase().trim().replace(/ /gi, "-")
}

/**
 * Helper to get a score with 3 decimal places.
 * @param value Label or description.
 */
export function normalizeScore(value: number): string {
    if (value < 0.001) return null
    else return value.toFixed(3)
}

/**
 * Detet the EXIF tags of the passed image.
 * @param options Program options.
 * @param filepath Image file to be scanned.
 */
export async function getEXIF(options: Options, filepath: string): Promise<any> {
    return new Promise((resolve) => {
        const processor = (err, data) => {
            try {
                if (err) {
                    if (err.toString().indexOf("No Exif segment") >= 0) {
                        logDebug(options, `${filepath} has no EXIF data`)
                        return resolve(null)
                    }

                    logError(options, `${filepath} - can't extract EXIF data`, err)
                    return resolve(null)
                }

                const details = {}

                // Properties to be taken from the EXIF data.
                let makeModel = []
                let imageDate = null

                // Get properties from the "image" data.
                if (data.image) {
                    if (data.image.Make) makeModel.push(data.image.Make)
                    if (data.image.Model) makeModel.push(data.image.Model)
                    if (data.image.ModifyDate) imageDate = data.image.ModifyDate
                }

                // Get properties from the "exif" data.
                if (data.exif) {
                    if (data.exif.DateTimeOriginal) imageDate = data.exif.DateTimeOriginal
                }

                // Append properties.
                details["make-model"] = makeModel.join(" ")
                details["original-date"] = imageDate

                logDebug(options, `${filepath}: ${Object.values(details).join(", ")}`)

                return resolve(details)
            } catch (ex) {
                logError(options, `${filepath} - can't extract EXIF data`, ex)
                return resolve(null)
            }
        }

        // Get EXIF data.
        const ExifImage = require("exif").ExifImage
        new ExifImage({image: filepath}, processor)
    })
}
