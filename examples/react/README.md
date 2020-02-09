# React Example

A minimal single page app with webpack build.
The app includes a local Express server that serves an index.html.
The build is meant to mimic a production build in that js bundles and sourcemaps are uploaded to AWS S3. You will need AWS and Rollbar accounts. To run the example:

## Setup

### Build the plugin

See the [Contributors Guide](../../CONTRIBUTING.md)

## Build and run the app

1. Copy the .env.examples to a new file `cp .env.examples .env`
1. Enter AWS and Rollbar settings in .env
1. `$ npm run build`
1. `$ npm start`
1. Open [http://localhost:8000](http://localhost:8000/)

When the example app is loaded in a browser, the app will throw an error, which will be sent to Rollbar.
You should be able to log in to Rollbar and see the error with stacktrace with line numbers that map to the original source.
