/**
 * Changelog:
 * - 06/09/2025
 */

import { ERROR_BROWSER_CONSOLE_MESSAGE } from './__DYNAMIC__';

/**
 * Tracks whether we've already logged a non-fatal error.
 * Prevents console spam by suppressing duplicate logs.
 * @type {boolean}
 */
let hasLoggedError = false;

/**
 * Utility for logging errors to the browser console.
 * - Ensures **fatal errors** are always logged.
 * - Logs the **first non-fatal error** once, then suppresses further ones.
 * - Guides developers to use the internal debug tooling.
 */
export const ErrorBrowserConsole = {
  /**
   * Logs caught errors to the browser console.
   *
   * @param {Object} errorEvent - Event-like object describing the error.
   * @param {string} errorEvent.type - Error severity ("fatal", "error", "warn", etc.).
   * @param {string} errorEvent.message - Human-readable error message.
   *
   * @example
   * ErrorBrowserConsole.errorListener({
   *   type: 'fatal',
   *   message: 'Unhandled promise rejection',
   * });
   */
  errorListener: (errorEvent) => {
    const { console } = window;

    // Prefer console method matching the event type; fallback to console.error
    const logType = console[errorEvent.type] ? errorEvent.type : 'error';

    // Always log fatal errors; log the first non-fatal error, then suppress further logs
    if (errorEvent.type === 'fatal' || (logType === 'error' && !hasLoggedError)) {
      console.error('ErrorUtils caught an error:\n\n' + errorEvent.message + ERROR_BROWSER_CONSOLE_MESSAGE);

      // Mark that we've logged the first non-fatal error
      hasLoggedError = true;
    }
  },
};
