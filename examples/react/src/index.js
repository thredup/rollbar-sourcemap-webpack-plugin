import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import rollbar from './rollbar';

window.Rollbar = rollbar;

render(<App />, document.getElementById('root'));
