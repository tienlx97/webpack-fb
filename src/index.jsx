import React from 'react';
import ReactDOM from 'react-dom';

import './css/app.css';

import stylex from '@stylexjs/stylex';

const styles = stylex.create({
  root: {
    fontSize: '20px',
    fontWeight: 600,
  },
});

const rootElement = document.getElementById('root');

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(<div className={stylex(styles.root)}>1234</div>);
}
