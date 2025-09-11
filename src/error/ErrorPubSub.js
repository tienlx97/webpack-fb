/**
 * ErrorPubSub
 *
 * A lightweight publish-subscribe system for error handling.
 * It normalizes errors, caches recent ones, and distributes them to registered listeners.
 * Acts as the central hub between:
 *
 *  - Error sources: window.onerror, unhandledrejection, ErrorBoundary, ErrorGuard
 *  - Error consumers: ErrorPoster, ErrorBrowserConsole, custom listeners
 *
 * Changelog:
 * - 09/12/2024
 */
import removeFromArray from 'fbjs/lib/removeFromArray';

import { ErrorBrowserConsole } from './ErrorBrowserConsole';
import { ErrorGuardState } from './ErrorGuardState';
import { ErrorNormalizeUtils } from './ErrorNormalizeUtils';

/** @constant {string} REACT_GUARD_LABEL Special marker when a React component stack is detected */
const REACT_GUARD_LABEL = '<global.react>';

/** @type {any[]} Public append-only history of published errors (kept for legacy API parity) */
const publishedHistory = [];

/** @type {Array<(error: any, source: string) => void>} Registered subscriber callbacks */
const subscribers = [];

/** @type {any[]} Recent normalized errors for replaying to new listeners */
const recentNormalizedErrors = [];

/** @type {boolean} Flag to prevent recursive publish loops */
let isPublishing = false;

/** @constant {number} RECENT_CACHE_LIMIT Max number of normalized errors cached for replay */
const RECENT_CACHE_LIMIT = 50;

export const ErrorPubSub = {
  /** Public access to the full published history (legacy API support) */
  history: publishedHistory,

  /**
   * Register a listener for error events.
   * By default, the listener will immediately receive all cached recent errors.
   *
   * @param {(error: any, source: string) => void} listener
   *        Callback function invoked with the normalized error and its logging source.
   * @param {boolean} [skipReplay=false]
   *        If true, the listener will NOT receive past cached errors.
   *
   * @example
   * ErrorPubSub.addListener((error, source) => {
   *   console.log('Error:', error, 'Source:', source);
   * });
   */
  addListener: (listener, replay) => {
    // (replay === undefined || replay === null) && (replay = false);
    const shouldSkipReplay = replay ?? false;
    subscribers.push(listener);

    // Replay recent errors if requested
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
   * Add a high-priority listener at the beginning of the subscriber list.
   * Useful when you need to handle/report errors before any other listener.
   *
   * @param {(error: any, source: string) => void} listener
   *
   * @example
   * ErrorPubSub.unshiftListener((err) => {
   *   console.warn('Priority handler:', err);
   * });
   */
  unshiftListener: (listener) => {
    subscribers.unshift(listener);
  },

  /**
   * Remove a previously registered listener.
   *
   * @param {(error: any, source: string) => void} listener
   *
   * @example
   * const handler = (e) => console.log(e);
   * ErrorPubSub.addListener(handler);
   * ErrorPubSub.removeListener(handler);
   */
  removeListener: (listener) => {
    removeFromArray(subscribers, listener);
  },

  /**
   * Normalize a raw error-like value and report it.
   * Internally calls `reportNormalizedError` after normalization.
   *
   * @param {any} rawError The raw error object or value to be normalized.
   *
   * @example
   * try {
   *   throw new Error('Something broke');
   * } catch (err) {
   *   ErrorPubSub.reportError(err);
   * }
   */
  reportError: (rawError) => {
    const normalized = ErrorNormalizeUtils.normalizeError(rawError);
    ErrorPubSub.reportNormalizedError(normalized);
  },

  /**
   * Publish a normalized error to all subscribers.
   *
   * Responsibilities:
   *  - Attach guard info (`guardList`) for debugging.
   *  - Insert `<global.react>` label if React stack frames are present.
   *  - Attach `deferredSource` from ErrorGuardState if missing.
   *  - Cache error for replay to late subscribers.
   *  - Notify all listeners safely.
   *
   * @param {any} nError The normalized error object.
   * @returns {boolean} `true` if published successfully, `false` if skipped due to recursion.
   *
   * @example
   * const err = ErrorNormalizeUtils.normalizeError(new Error('Boom!'));
   * ErrorPubSub.reportNormalizedError(err);
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

// Default: log all errors to the browser console
ErrorPubSub.addListener(ErrorBrowserConsole.errorListener);
