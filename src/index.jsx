import React from 'react';
import ReactDOM from 'react-dom';

console.log({ ReactDOM });

const rootElement = document.getElementById('root');

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(<div>1234</div>);
}
