import { unstable_Activity as Activity, useState } from 'react';

import Sidebar from './Sidebar';

export function App() {
  const [isShowingSidebar, setIsShowingSidebar] = useState(true);

  return (
    <>
      <Activity mode={isShowingSidebar ? 'visible' : 'hidden'}>
        <Sidebar />
      </Activity>

      <main>
        <button onClick={() => setIsShowingSidebar(!isShowingSidebar)}>Toggle sidebar</button>
        <h1>Main content</h1>
      </main>
    </>
  );
}
