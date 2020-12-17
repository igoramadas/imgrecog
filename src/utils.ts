// UTILS

/**
 * Helper to log errors according to the verbose option.
 * @param value
 */
export function logError(message: string, ex: Error, verbose: boolean) {
    if (verbose) {
        console.error(message)
        console.error(ex)
    } else {
        console.error(message, ex.toString())
    }
}

/**
 * Helper to check if the passed value has an actual value.
 * @param value The value to be checked.
 */
export function hasValue(value: any): boolean {
    return value !== null && typeof value != "undefined"
}
