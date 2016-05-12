// require('babel-register');

// if (!process.env.NODE_ENV) {
//   process.env.NODE_ENV = 'development';
// }

// if (process.env.NODE_ENV === 'development') {
//   module.exports = require('./development');
// } else {
//   module.exports = require('./production');
// }

import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 8000;
const index = path.join(__dirname, '../dist/index.html');

app.use((req, res) => res.sendFile(index));

app.listen(port, function(error) {
  if (error) {
    return console.error(error); // eslint-disable-line no-console
  }
  console.info(`==> Listening on port ${port}`); // eslint-disable-line no-console
});
