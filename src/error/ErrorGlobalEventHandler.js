/**
 * Changelog:
 * - 06/09/2025
 */

import { err } from './err';
import { getErrorSafe } from './getErrorSafe';

const onError = typeof window === 'undefined' ? '<self.onerror>' : '<window.onerror>';

let errorPubSub = null;

function listener(errEvent) {
  const newError = errEvent.error ? getErrorSafe(errEvent.error) : err(errEvent.message || '');

  if (!newError.fileName && errEvent.filename) newError.fileName = errEvent.filename;

  if (!newError.line && errEvent.lineno) newError.line = errEvent.lineno;

  if (!newError.column && errEvent.colno) newError.column = errEvent.colno;

  newError.guardList = [onError];
  newError.loggingSource = 'ONERROR';

  errorPubSub || errorPubSub === undefined ? undefined : errorPubSub.reportError(newError);
}

export const ErrorGlobalEventHandler = {
  setup: (ePubSub) => {
    if (typeof window.addEventListener !== 'function') {
      return;
    }
    if (errorPubSub) {
      return;
    }
    errorPubSub = ePubSub;
    window.addEventListener('error', listener);
  },
};
