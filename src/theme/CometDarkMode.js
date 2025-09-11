import ExecutionEnvironment from 'fbjs/lib/ExecutionEnvironment';

import { gkx } from '@fb-utils/gkx';

import { CometDarkModeRootClass } from './CometDarkModeRootClass';
import { CometDarkModeSetting } from './CometDarkModeSetting';

// eslint-disable-next-line no-unused-vars
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

// eslint-disable-next-line no-unused-vars
const CONTEXT = {
  product: 'COMET',
};
let currentSetting = CometDarkModeSetting.initialSetting;
const listeners = new Set();

function getDarkModeSetting() {
  return !gkx[22823] ? 'DISABLED' : currentSetting;
}

function saveDarkModeSetting(newSetting, { onRevert }) {
  if (!ExecutionEnvironment.canUseDOM) {
    return;
  }

  let previousSetting = currentSetting;
  if (previousSetting === newSetting) {
    return;
  }

  updateSetting(newSetting);
}

function updateSetting(newSetting) {
  currentSetting = newSetting;
  let updatedSetting = getDarkModeSetting();

  listeners.forEach((callback) => {
    return callback(updatedSetting);
  });

  if (gkx[22823]) {
    CometDarkModeRootClass.updateDarkModeRootClass(updatedSetting);
  }
}

function initDarkMode() {
  CometDarkModeRootClass.updateDarkModeRootClass(getDarkModeSetting());
  if (window.matchMedia) {
    //
  }
}

function onDarkModeChange(callback) {
  listeners.add(callback);
  return function () {
    listeners['delete'](callback);
  };
}

function getDarkModePreference() {
  return getDarkModeSetting() === 'ENABLED';
}

export const CometDarkMode = {
  toggleDarkModeRootClass: CometDarkModeRootClass.toggleDarkModeRootClass,
  updateDarkModeRootClass: CometDarkModeRootClass.updateDarkModeRootClass,
  onDarkModeChange,
  getDarkModeSetting,
  getDarkModePreference,
  saveDarkModeSetting,
  initDarkMode,
};
