import React from 'react';

import { CometDarkModeStateProvider } from '@fb-theme/CometDarkModeStateProvider';

import { Example } from './Example';

export const App = () => {
  return (
    <CometDarkModeStateProvider>
      <Example />
    </CometDarkModeStateProvider>
  );
};
