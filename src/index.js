import React from 'react';
import ReactDOM from 'react-dom';
import Detect from './components/Detect';

const Root = () => (
  <React.Fragment>
    <Detect />
  </React.Fragment>
);

ReactDOM.render(<Root />, document.getElementById('root'));
