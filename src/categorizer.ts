// CATEGORIZER

import {logError, logInfo} from "./utils"

/**
 * Image categorized.
 */
export class Categorizer {
    description: "Categorize results based on its tags"

    /**
     * Parse the image result to get extra tags. All tags categorized
     * here will have the prefix "is-".
     * @param options Program options.
     * @param image Image result to be parsed.
     */
    parse = (options: Options, image: ImageResult): any => {
        const result: any = {}
        const tags = Object.keys(this.is)

        // Iterate tags definitions and check the image against each one of them.
        for (let tag of tags) {
            const score = this.is[tag](options, image)
            if (score) result[`is-${tag}`] = score
        }

        return result
    }

    // Custom tag definitions.
    is = {
        /** Images that are too small, or not very relevant on the context of photos. */
        bloat: (options: Options, image: ImageResult): number => {
            try {
                if (!image.tags) return 0

                // Images smaller than 40KB are automatically considered bloat.
                if (image.details.size && image.details.size < 40000) {
                    logInfo(options, `${image.file}: is bloat, size < 40KB`)
                    return 1
                }

                const imgTags = Object.keys(image.tags)
                const bloatTags = ["meme", "photo-caption", "screenshot", "website", "world-wide-web", "explicit-spoof", "template"]
                const extraTags = ["picture-frame", "advertising", "document", "text", "logo-facebook", "logo-twitter", "logo-instagram", "logo-whatsapp"]
                const highScore = 0.91
                const minScore = 0.71
                const totalScore = 3.55

                // Get relevant bloat (main) and extra tags.
                const hasHighScore = imgTags.filter((t) => bloatTags.includes(t) && image.tags[t] >= highScore).length > 0
                const arrBloat = imgTags.filter((t) => bloatTags.includes(t) && image.tags[t] >= minScore)
                const arrExtra = imgTags.filter((t) => extraTags.includes(t) && image.tags[t] >= minScore)

                // At least 2 bloat tags, and one having a high score?
                if (hasHighScore && arrBloat.length >= 2) {
                    logInfo(options, `${image.file}: is bloat, at least 2 tags found`)
                    return 1
                }

                // At least 1 bloat tag and 2 extra tags found?
                if (hasHighScore && arrBloat.length >= 1 && arrExtra.length >= 2) {
                    logInfo(options, `${image.file}: is bloat, at least 1 tag with extra similar tags found`)
                    return 1
                }

                const bloatScore = arrBloat.map((t) => image.tags[t]).reduce((a, b) => a + b, 0)
                const extraScore = arrExtra.map((t) => image.tags[t]).reduce((a, b) => a + b, 0)

                // Total score of found bloat tags is high?
                if (bloatScore + extraScore >= totalScore) {
                    logInfo(options, `${image.file}: is bloat, too many tags found`)
                    return 1
                }
            } catch (ex) {
                logError(options, `${image.file} - error processing bloat tags`, ex)
            }

            return 0
        },

        /** Pornographic and erotic images. */
        porn: (options: Options, image: ImageResult): number => {
            try {
                if (!image.tags) return 0

                const imgTags = Object.keys(image.tags)
                const pornTags = ["explicit-adult", "nude", "erotic", "porn", "sexual"]
                const extraTags = ["explicit-medical", "sexual", "organ", "adult"]
                const highScore = 0.91
                const minScore = 0.71
                const totalScore = 2.84

                // Get relevant porn tags.
                const hasHighScore = imgTags.filter((t) => pornTags.includes(t) && image.tags[t] >= highScore).length > 0
                const arrPorn = imgTags.filter((t) => pornTags.includes(t) && image.tags[t] >= minScore)
                const arrExtra = imgTags.filter((t) => extraTags.includes(t) && image.tags[t] >= minScore)

                // At least 2 porn tags, and one having a high score?
                if (hasHighScore && arrPorn.length >= 2) {
                    logInfo(options, `${image.file}: is porn, at least 2 tags found`)
                    return 1
                }

                // At least 1 porn tag and 2 extra tags found?
                if (hasHighScore && arrPorn.length >= 1 && arrExtra.length >= 2) {
                    logInfo(options, `${image.file}: is porn, at least 1 tag with extra similar tags found`)
                    return 1
                }

                const pornScore = arrPorn.map((t) => image.tags[t]).reduce((a, b) => a + b, 0)
                const extraScore = arrExtra.map((t) => image.tags[t]).reduce((a, b) => a + b, 0)

                // Total score of found porn tags is high?
                if (pornScore + extraScore >= totalScore) {
                    logInfo(options, `${image.file}: is porn, too many tags found`)
                    return 1
                }
            } catch (ex) {
                logError(options, `${image.file} - error processing bloat tags`, ex)
            }

            return 0
        }
    }
}

export default new Categorizer()
