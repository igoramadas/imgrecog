// TYPES

/**
 * Program options.
 */
interface Options {
    /** Dry run, will only process results from imgrecog.results.json. */
    dryRun?: boolean
    /** List of folders to be scanned. */
    folders?: string[]
    /** Valid file extensions. */
    extensions?: string[]
    /** Full path to the output file, default is imgrecog.results.json. */
    output?: string
    /** Limit amount of calls to the Vision API. Default is 1000. */
    limit?: number
    /** How many images should be scanned in parallel? Default is 5. */
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
    /** Shortcut to enable all detection features. */
    all?: boolean
    /** Filter used to delete or move images after they have been processed. */
    filter?: string
    /** After the scanning has finished, move all images that passes the filter. Depends on a valid "filter". */
    move?: string
    /** After the scanning has finished, delete all images that passes the filter. Depends on a valid "filter". */
    delete?: boolean
}

/**
 * Image tags and details taken from the scanning results.
 */
interface ImageResult {
    /** Full path to the image file. */
    file: string
    /** Tags and scores. */
    tags?: {[id: string]: number}
    /** File size. */
    size?: number
    /** Any error(s) ocurred during the image processing? */
    error?: any
}
