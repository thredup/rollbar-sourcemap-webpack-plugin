# Next.js Example

This example show how to use `rollbar-sourcemap-webpack-plugin` with [Next.js](http://nextjs.org/).

The pertinent files in this example:

* `examples/next-js/next.config.js`
    * We generate the sourcemaps using a custom webpack config and set an environment variable of `NEXT_BUILD_ID`. Lastly, we configure the `RollbarSourcemapPlugin` webpack plugin with our Rollbar access token, `NEXT_BUILD_ID`, and `publicPath`. `publicPath` is the domain of your website with a path of `/_next/` which is where the Next scripts live when deployed.
* `examples/next-js/pages/_document.js`
    * We initialize Rollbar as outlined [in their docs](https://docs.rollbar.com/docs/browser-js). Here we also include our Rollbar access token and additionally set the `code_version` which is `process.env.NEXT_BUILD_ID`. This should automatically be the same value that we setup above in our `next.config.js`
