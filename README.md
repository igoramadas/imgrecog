# IMGRecog.js

This is a small Node.js tool to scan and tag images using a local [MobileNet](https://github.com/tensorflow/models/tree/master/research/slim/nets/mobilenet) model, and the [Google Vision](https://cloud.google.com/vision/docs) and [Sightengine](https://sightengine.com) APIs.

The MobileNet model is relatively good for very basic use cases, like detecting websites, things and shapes on images. But it's not particularly effective to tag images with explicit content )

## Features

- basic tags can be detected using the local and offline TensorFlow / MobileNet model
- support for the Google Vision and Sightengine APIs to boost the image recognition features
- results (JSON) are handled as simple tags with a tag name and score (from 0 to 1)
- can detect objects, labels, landmarks, logos, brands and unsafe content
- actions to delete or move images according to certain criterias
- can be used via the command line or programatically

## Setup

To install globally on your machine please use:

    $ npm install -g imgrecog.js

Or to install locally on your current project:

    $ npm install imgrecog.js --save

### Using the Google Vision API

You'll need to download your Google Cloud Vision API credentials file from the Google Cloud Console. If you need help please follow [these instructions](https://cloud.google.com/vision/docs/auth).

Save the credentials file as `imgrecog.auth.json`. The tool will look for it in the following places:

- where the tool is installed
- current user's home folder
- current executing directory

### Using the Sightengine API

If you wish to complement the results with Sightengine, please get your API user and secret from your [Dashboard](https://dashboard.sightengine.com/api-credentials). Set them via the options `sightengineUser` and `sightengineSecret`, or via the command line args `--steuser` and `--stesecret`.

## Usage

    $ imgrecog.js -[options] --[actions] folders

Detect logos on images in the current directory:

    $ imgrecog.js --logos .

Delete unsafe and bloat images on user's home directory:

    $ imgrecog.js --delunsafe --delbloat ~/

Detect everything, high API limits, and then move images to the "processed" folder.

    $ imgrecog.js --deep --objects --labels --logos --landmarks --unsafe --limit 999999 --move ~/photos/processed ~/photos/camera

For help and the full list of options, ask for help:

    $ imgrecog.js --help

## Options

The tool will look for a `imgrecog.options.json` file on the following places:

- where the tool is installed
- current user's home folder
- current executing directory

If not found, it will assume all the default options.

When running from the command line, all options should be passed as arguments, or via environment variables with the "IMGRECOG_" prefix (examples: `IMGRECOG_LIMIT`, `IMGRECOG_VERBOSE` etc).

### extensions *`-e`*

 File extensions should be scanned. Defaults to common image files: `"png", "jpg", "jpeg", "gif", "bmp"`

### output *`-o`*

Full path to the output file with the scanning results. Defaults to `imgrecog.results.json` on the current folder.

### limit *`-l`*

Limit API calls to the Google Vision API, as a safe $$ precaution. Defaults to `1000` calls per execution.

### parallel *`-p`*

How many tasks can be executed in parallel. Defaults to `4`.

### deep *`-d`*

Include subfolders when scanning. Defaults to `false`.

### verbose *`-v`*

Activate verbose mode with extra logging. Defaults to `false`.

### authfile *`--auth`*

 Path to the credentials file to authenticate with the Google Vision API. Defaults to `imgrecog.auth.json` on common folders.

### sightengineUser *`--steuser`*

 API user to be used for the Sightengine API. Defaults to none (disable Sightengine).

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

## Actions

### deleteBloat *`--delbloat`*

This will delete images:

- smaller than 50 KB
- having a very high score for any of the tags: "meme", "photo caption", "screenshot", "website", "explicit-spoof", plus a high conbined score  counting the tags "advertising", "document", "map", "text"

### deleteUnsafe *`--delunsafe`*

This will delete images:

- having a very high score for any of the tags: "explicit-adult", "explicit-violence", plus a high combined score also counting the tags "explicit-racy", "explicit-medical"

### move *`--move`*

This will move all the scanned images to the specified folder, replicating their original path. For example if you set move to `/var/photos/scanned`, then an image `/home/someuser/photos/dsc123.jpg` will be moved to `/var/photos/scanned/home/someuser/photos/dsc123.jpg`.

## Real world use cases

Coming soon...
