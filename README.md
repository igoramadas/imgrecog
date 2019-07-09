# IMGRecog.js

This is a Node.js command line utility to process and tag images using the Google Vision API. It will parse all image files on the specified folder(s) and create a .tags containing all tags and a score, in JSON format.

More info at https://github.com/igoramadas/imgrecog.js

## Setup

To install please use NPM:

    $ sudo npm install -g imgrecog.js

Then download your Google Cloud Vision API credentials file from the Google Cloud Console. If you need help please follow [these instructions](https://cloud.google.com/vision/docs/auth).

Save the credentials file as `imgrecog.auth.json`. The tool will look for it the following locations:

* where the tool is installed
* current user's home folder
* current executing directory

## Usage

    $ imgrecog.js [options] [folders]

### Examples

Detect logos on the current directory.

    $ imgrecog.js -logos

Detect everything on the some user's home folder.

    $ imgrecog.js -all /home/someuser

Detect and delete unsafe images on /var/photos

    $ imgrecog.js -safe -delete-unsafe /var/photos

For docs and more samples, please execute:

    $ imgrecog.js -help
