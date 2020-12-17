// TYPES

/**
 * Program options.
 */
interface Options {
    /** List of folders to be scanned. */
    folders?: string[]
    /** Valid file extensions. */
    extensions?: string[]
    /** Full path to the output file, default is imgrecog.results.json. */
    output?: string
    /** Limit amount of identified images. Default is 1000. */
    limit?: number
    /** How many images should be scanned in parallel? Default is 2. */
    parallel?: number
    /** Activate extra logging. */
    verbose?: boolean
    /** Path to the credentials file to be used for the authentication on Google. */
    authfile?: string
    /** Detect labels and tags on the scanned images. */
    labels?: boolean
    /** Detect landmarks on scanned images. */
    landmarks?: boolean
    /** Detect logos and brands on scanned images. */
    logos?: boolean
    /** Detect adult, violent and generally unsafe images. */
    unsafe?: boolean
    /** Delete bloat images (memes, screenshots, spoof, websites etc). */
    deleteBloat?: boolean
    /** Delete unsafe images. */
    deleteUnsafe?: boolean
    /** After the scanning has finished, move all images to the specified folder. */
    move?: string
}

/**
 * Image tags and details taken from the scanning results.
 */
interface ImageResult {
    /** Full path to the image file. */
    path: string
    /** Tags and scores. */
    tags: {[id: string]: number}
}

/**
 * Likelyhood texts matched with a numeric score.
 */
enum Likelyhood {
    VERY_UNLIKELY = "0.05",
    UNLIKELY = "0.25",
    POSSIBLE = "0.55",
    LIKELY = "0.75",
    VERY_LIKELY = "0.95"
}
