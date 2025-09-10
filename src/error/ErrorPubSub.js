/**
 * Changelog:
 * - 09/12/2024
 */

import removeFromArray from 'fbjs/lib/removeFromArray';

import { ErrorBrowserConsole } from './ErrorBrowserConsole';
import { ErrorGuardState } from './ErrorGuardState';
import { ErrorNormalizeUtils } from './ErrorNormalizeUtils';

// Marker used when a React component stack is present
const REACT_GUARD_LABEL = '<global.react>';

// Public, append-only history (kept for API parity)
const publishedHistory = [];

// Registered subscribers
const subscribers = [];

// Ring buffer for recently normalized errors (replayed to late subscribers)
const recentNormalizedErrors = [];

// Re-entrancy guard to avoid recursive publish loops
let isPublishing = false;

// Max cached normalized errors to replay to late listeners
const RECENT_CACHE_LIMIT = 50;

export const ErrorPubSub = {
  // Expose history to preserve original API
  history: publishedHistory,

  /**
   * Register a listener.
   * If `replay = true`, the listener receives only future errors.
   * If `replay = false` (default), it is replayed the recent cache first.
   *
   * @param {(err:any, source:string)=>void} listener
   * @param {boolean} [replay=false]
   */
  addListener: (listener, replay) => {
    // (replay === undefined || replay === null) && (replay = false);
    const shouldSkipReplay = replay ?? false;
    subscribers.push(listener);

    if (!shouldSkipReplay) {
      recentNormalizedErrors.forEach((nError) => {
        listener(
          nError,
          nError.loggingSource !== null && nError.loggingSource !== undefined ? nError.loggingSource : 'DEPRECATED',
        );
      });
    }
    // replay ||
    //   recentNormalizedErrors.forEach((nError) =>
    //     listener(
    //       nError,
    //       nError.loggingSource !== null && nError.loggingSource !== undefined ? nError.loggingSource : 'DEPRECATED',
    //     ),
    //   );
  },

  /**
   * Add a listener at the front of the list (higher priority).
   * @param {(err:any, source:string)=>void} listener
   */
  unshiftListener: (listener) => {
    subscribers.unshift(listener);
  },

  /**
   * Remove a previously registered listener.
   * @param {(err:any, source:string)=>void} listener
   */
  removeListener: (listener) => {
    removeFromArray(subscribers, listener);
  },

  /**
   * Normalize a raw error-like value and publish it.
   * @param {any} rawError
   */
  reportError: (rawError) => {
    const normalized = ErrorNormalizeUtils.normalizeError(rawError);
    ErrorPubSub.reportNormalizedError(normalized);
  },

  /**
   * Publish an already-normalized error to all subscribers.
   * Adds guard/context info and caches it for late subscribers.
   * @param {any} nError
   * @returns {boolean} whether publish occurred
   */
  reportNormalizedError: (nError) => {
    if (isPublishing) {
      return false;
    }

    // Build guard list from current guard stack
    const guardList = ErrorGuardState.cloneGuardList();
    if (nError.componentStackFrames) {
      guardList.unshift(REACT_GUARD_LABEL);
    }

    if (guardList.length > 0) {
      nError.guardList = guardList;
    }

    // Attach deferred source if missing
    if (!nError.deferredSource) {
      const deferredSource = ErrorGuardState.findDeferredSource();

      if (deferredSource !== null && deferredSource !== undefined) {
        nError.deferredSource = ErrorNormalizeUtils.normalizeError(deferredSource);
      }
    }

    // Maintain a bounded cache for replay
    if (recentNormalizedErrors.length > RECENT_CACHE_LIMIT) {
      // Remove a middle entry to limit churn (keeps head/tail reasonably fresh)
      recentNormalizedErrors.splice(RECENT_CACHE_LIMIT / 2, 1);
    }

    // Record in public history (original behavior preserved)
    recentNormalizedErrors.push(nError);

    // Notify listeners (defensively)
    isPublishing = true;

    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](
          nError,
          nError.loggingSource !== null && nError.loggingSource !== undefined ? nError.loggingSource : 'DEPRECATED',
        );
      } catch {
        // Swallow listener errors to avoid breaking the pubsub
      }
    }

    isPublishing = false;

    return true;
  },
};

// Default console listener
ErrorPubSub.addListener(ErrorBrowserConsole.errorListener);
