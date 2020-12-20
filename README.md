# IMGRecog.js

This is a small Node.js tool to scan and tag images using the Google Vision and Sightengine APIs.

## Features

- uses Google Vision API by default, can be complemented with the Sightengine API
- detect objects, labels, landmarks, logos and unsafe content
- all results are handled as simple tags with a tag name and tag score (from 0 to 1)
- aditional actions to delete or move images
- results are saved as a single JSON file
- can be used via the command line or programatically

## Setup

To install globally on your machine please use:

    $ npm install -g imgrecog.js

Or to install locally on your current project:

    $ npm install imgrecog.js --save

You'll need to download your Google Cloud Vision API credentials file from the Google Cloud Console. If you need help please follow [these instructions](https://cloud.google.com/vision/docs/auth).

Save the credentials file as `imgrecog.auth.json`. The tool will look for it in the following places:

- where the tool is installed
- current user's home folder
- current executing directory

## Usage

    $ imgrecog.js -[options] --[actions] folders

### Examples

Detect logos on the current directory:

    $ imgrecog.js --logos .

Detect and delete unsafe images on /var/photos and /user/photos:

    $ imgrecog.js -del-unsafe /var/photos /user/photos

Delete unsafe, and delete bloat images on user's home directory:

    $ imgrecog.js --unsafe -del-bloat ./~

For help and the full list of options, ask for help:

    $ imgrecog.js --help

## Options

The tool will look for a `imgrecog.options.json` file on the following places:

- where the tool is installed
- current user's home folder
- current executing directory

If not found, it will assume all the default options.

When running from the command line, all options must be passed as arguments.

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
