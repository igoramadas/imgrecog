# IMGRecog

This is a small Node.js tool to scan and tag images using [Google Vision](https://cloud.google.com/vision), [Clarifai](https://clarifai.com) and [Sightengine](https://sightengine.com).

## Features

- Supports 3 different computer vision APIs: Google Vision, Clarifai and Sightengine
- Results (JSON) are handled as simple tags with a tag name and score (from 0 to 1)
- Can detect objects, labels, landmarks, logos, brands and unsafe content
- Actions to delete or move images according to certain criterias
- Can be used via the command line or programatically

### But why?

Because (as of December 2020) there are no other Node.js based tools that allow you to easily parse and tag images using more than "free" 1 service. Two is better than one, and three is better than two.

IMGRecog was made by the developer to automate the cleanup tasks of his incoming photos (camera and social media, mostly). Mostly to get rid of bloat and NSFW images. But you can use this tool to whatever suits you best.

### What about TensorFlow?

There are tons of great libraries and tools out there doing computer vision with TensorFlow, and the point here is not to reinvent the wheel. Search for "tensorflow mobilenet" and you'll find loads. Furthermore, adding TensorFlow as a direct dependecy increases the total package by more than 500%.

For now, IMGRecog will focus solely on remote APIs.

## Setup

To install globally on your machine please use:

    $ npm install imgrecog -g

Or to install locally on your current project:

    $ npm install imgrecog --save

### Using the Google Vision API

You'll need to download your Google Cloud Vision API credentials file from the Google Cloud Console. If you need help please follow [these instructions](https://cloud.google.com/vision/docs/auth).

Set the path to the credentials file using the `googleKeyfile` option, or via the command line arg `--glgkeyfile`.

### Using the Clarifai API

If you want to process images with the Clarifai API, please get the API key for your app on the [Portal](https://portal.clarifai.com). Set it via the option `clarifaiKey`, or via the command line arg `--clakey`.

### Using the Sightengine API

If you want to process images with the Sightengine API, please get your API user and secret from your [Dashboard](https://dashboard.sightengine.com/api-credentials). Set them via the options `sightengineUser` and `sightengineSecret`, or via the command line args `--steuser` and `--stesecret`.

## Command line usage

    $ imgrecog -[options] --[actions] folders

Detect logos in the current directory, using Google Vision, credentials from auth.json file:

    $ imgrecog --logos --glgkeyfile ./auth.json .

Detect unsafe images under the user's home folder, using Clarifai and Sightengine:

    $ imgrecog --unsafe --clakey "123" --steuser "abc" --stesecret "abc1234" ~/

Detect and delete images unlikely to have a beach, trasversing the user's home folder, loading options from the imgrecog.options.json file:

    $ imgrecog -d --labels --landmarks --filter "beach < 0.5" ~/

Detect everything on camera and downloads folder, limiting to 15k API calls, and then move porn and bloat images to the trash folder:

    $ imgrecog --all --deep \
               --glgkeyfile "mycredentials.json" \
               --clakey "123" \
               --steuser "abc" \
               --stesecret "abc1234" \
               --limit 15000 \
               --filter "is-bloat, is-porn" \
               --move ~/trash \
               ~/camera ~/downloads

Dry run with the results from a previous execution.

    $ imgrecog --dry --move --filter "is-bloat"

For help and the full list of options, ask for help:

    $ imgrecog --help

## Importing as a library

```javascript
import ImgRecog from "imgrecog"
// const ImgRecog = require("imgrecog").default

const options = {
    folders: ["/home/user1/photos", "/home/user2/photos"],
    limit: 5000,
    unsafe: true
    // more options...
}

const processor = new ImgRecog(options)
await processor.run()

console.dir(processor.results)
```

## Loading options

IMGRecog will look for a `imgrecog.options.json` file on the following places:

- where the tool is installed
- current user's home folder
- current executing directory

If not found, it will assume all the default options.

When running from the command line, options should be passed as arguments or via environment variables with the "IMGRECOG_" prefix (examples: `IMGRECOG_LIMIT`, `IMGRECOG_VERBOSE` etc).

## Options

### console

Enable or disable logging to the console. Enabled by default when using via the command line, but not when using it as a library / programatically.

### extensions *`-e`*

File extensions should be scanned. Defaults to common image files: `"png", "jpg", "jpeg", "gif", "bmp"`

### output *`-o`*

Full path to the output file with the scanning results. Defaults to `imgrecog.results.json` on the current folder.

### limit *`-l`*

Limit API calls to the Google Vision API, as a safe $$ precaution. Defaults to `1000` calls per API / execution.

### parallel *`-p`*

How many files can be processed in parallel. Defaults to `5`.

### deep *`-d`*

Include subfolders when scanning. Defaults to `false`.

### verbose *`-v`*

Activate verbose mode with extra logging. Defaults to `false`.

### dry *`--dry`*

Dry run, if you set this to true it will parse the existing results instead of running the detection process again. Useful to test filters and actions.

## Authentication

### googleKeyfile *`--glgkeyfile`*

Path to the credentials keyfile used to authenticate with the Google. Defaults to none (disable Google Vision).

### clarifaiKey *`--clakey`*

API key to be used with the Clarifai API. Defaults to none (disable Clarifai).

### sightengineUser *`--steuser`*

API user to be used with the Sightengine API. Defaults to none (disable Sightengine).

### sightengineSecret *`--stesecret`*

API secret to be used for the Sightengine API. Defaults to none (disable Sightengine).

## Detection features

### objects *`--objects`*

Detect objects and things on the scanned images.

### labels *`--labels`*

Detect labels and general tags on the scanned images.

### landmarks *`--landmarks`*

Detect landmarks and famous locations on the scanned images.

### logos *`--logos`*

Detect logos and brands on the scanned images.

### unsafe *`--unsafe`*

Detect unsafe images with explicit content (adult, violence, medical, racy, spoof).

### all *`--all`*

Shortcut to enable all detections via the command line.

## Actions

### filter *`--filter`*

Tag based filter to be applied on the image results, mandatory if you want to use the `move` or `delete` actions below. Multiple conditions can be defined, separated by comma. Examples:

- `summer` - summer images
- `summer, !beach` - summer images, but no definetely no beach
- `summer > 0.93, beach < 0.5` - same as above, but using specific scores
- `is-porn, is-bloat` - images that are categorized as porn or bloat

Note that spaces are ignored.

### move *`--move`*

Move the images that match the filter, replicating their original path. For example if you set move to `/var/photos/scanned`, then an image `/home/someuser/photos/dsc123.jpg` will be moved to `/var/photos/scanned/home/someuser/photos/dsc123.jpg`.

### delete *`--delete`*

Delete the images that match the filter.

## Interpreting results

After the scanning has finished, the JSON results will be saved to the specified `output` path. By default, this is the file "imgrecog.results.json" on the current directory.

Each scanning result has the following schema:

- file - the full path to the scanned image file
- size - fize size in bytes
- tags - map of tags and scores for the scanned image
- error - list of errors (field will be ommited if no errors occurred)

## Need help?

Post an issue [here](https://github.com/igoramadas/imgrecog/issues).
