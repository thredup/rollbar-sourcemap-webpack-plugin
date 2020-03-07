# Next.js Example

This is a basic Next.js app (created via `npm init next-app`).

The pertinent files in this PR:

* `examples/next-js/next.config.js`
    * We generate the sourcemaps using a custom webpack config and then generate a `codeVersion`. In this case, `codeVersion` is the git revision which we then set globally via `process.env.GIT_REVISION`. This `codeVersion` can be any unique value between each build (each build of your application that you deploy to your server should have a unique `codeVersion`). Lastly, we configure the `RollbarSourcemapPlugin` webpack plugin with our Rollbar access token, `codeVersion`, and `publicPath`. `publicPath` is the domain of your website with a path of `/_next/` which is where the Next scripts live when deployed.
* `examples/next-js/pages/_document.js`
    * We initialize Rollbar as outlined [in their docs](https://docs.rollbar.com/docs/browser-js). Here we also include our Rollbar access token and additionally set the `code_version` which is `process.env.GIT_REVISION`. This should automatically be the same value that we setup above in our `next.config.js`

