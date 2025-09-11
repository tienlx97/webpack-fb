import React, { use } from 'react';

import { CometDarkModeContext } from '@fb-contexts/CometDarkModeContext';

export const Example = () => {
  const { onDarkModeToggle } = use(CometDarkModeContext);

  return (
    <div>
      <button onClick={onDarkModeToggle}>Toggle Dark Mode</button>
    </div>
  );
};
