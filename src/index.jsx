import React from 'react';
import ReactDOM from 'react-dom';

import { CometErrorLogging } from '@fb-error/CometErrorLogging';

import { App } from './App';

import './css/app.css';

const rootElement = document.getElementById('root');

if (!rootElement.innerHTML) {
  // eslint-disable-next-line import/no-named-as-default-member
  const root = ReactDOM.createRoot(rootElement);

  CometErrorLogging.init();

  root.render(<App />);
}
