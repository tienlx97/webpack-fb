import React, { unstable_LegacyHidden as UnstableLegacyHidden } from 'react';

import { CometDarkModeStateProvider } from '@fb-theme/CometDarkModeStateProvider';

import { Example } from './Example';

export const App = () => {
  console.log({ UnstableLegacyHidden });

  return (
    <CometDarkModeStateProvider>
      <Example />
    </CometDarkModeStateProvider>
  );
};
