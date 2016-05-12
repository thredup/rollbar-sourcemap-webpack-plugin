import React, { Component } from 'react';

class App extends Component {
  render() {
    try {
      throw new Error('Something went wrong');
    } catch (e) {
      window.Rollbar.error(e);
    }

    return (
      <div>RollbarSourceMapPlugin - React example</div>
    );
  }
}

export default App;
