/**
 * Changelog:
 * - 06/09/2025
 */

import { err } from './err';
import { getErrorSafe } from './getErrorSafe';

/** Label recorded in guardList to indicate where the error originated. */
const ONERROR_GUARD = typeof window === 'undefined' ? '<self.onerror>' : '<window.onerror>';

/** Holds the pub/sub sink we’ll report into once set up. */
let errorPubSub = null;

/**
 * Global `error` event listener.
 * Normalizes the error and forwards it to ErrorPubSub (if configured).
 *
 * @param {ErrorEvent} evt
 */
function onWindowError(evt) {
  // Prefer the real Error object if present; otherwise synthesize from the message
  const normalized = evt.error ? getErrorSafe(evt.error) : err(evt.message || '');

  // Populate filename/line/column when missing from the Error
  if (!normalized.fileName && evt.filename) normalized.fileName = evt.filename;
  if (!normalized.line && evt.lineno) normalized.line = evt.lineno;
  if (!normalized.column && evt.colno) normalized.column = evt.colno;

  // Tag origin & logging source
  normalized.guardList = [ONERROR_GUARD];
  normalized.loggingSource = 'ONERROR';

  // BUGFIX: Only report if a pubsub sink exists
  // (the original conditional tried to call reportError when errorPubSub was null)
  if (errorPubSub && typeof errorPubSub.reportError === 'function') {
    errorPubSub.reportError(normalized);
  }
}

/**
 * Install a global `window.onerror` handler that publishes errors to the given pub/sub.
 * Safe to call multiple times; only the first call attaches the listener.
 *
 * @param {{ reportError: (e:any)=>void }} ePubSub
 */
export const ErrorGlobalEventHandler = {
  setup: (ePubSub) => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return; // not a browser environment
    }

    if (errorPubSub) {
      return; // already set up
    }

    errorPubSub = ePubSub;
    window.addEventListener('error', onWindowError);
  },
};
