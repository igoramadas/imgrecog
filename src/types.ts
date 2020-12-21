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
    /** Limit amount of calls to the Vision API. Default is 1000. */
    limit?: number
    /** How many images should be scanned in parallel? Default is 4. */
    parallel?: number
    /** Deep, also scan subfolders. */
    deep?: boolean
    /** Activate extra logging. */
    verbose?: boolean
    /** Log output to the console? When calling via command line this is true by default. */
    console?: boolean
    /** Path to the credentials file to be used for the authentication with Google Vision. */
    googleKeyfile?: string
    /** Clarifai API key. */
    clarifaiKey?: string
    /** Sightengine API user. */
    sightengineUser?: string
    /** Sightengine API secret. */
    sightengineSecret?: string
    /** Detect objects and things on the scanned images. */
    objects?: boolean
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
    file: string
    /** Tags and scores. */
    tags?: {[id: string]: string}
    /** File properties, mostly taken out of the EXIF tags.  */
    details?: {[id: string]: number | string}
}
