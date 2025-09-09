/* eslint-disable complexity */
/**
 * Changelog:
 * - 09/09/2025
 */

import { err } from './err';
import { getErrorSafe } from './getErrorSafe';

// Store the global error reporter and setup status
let errorReporter = null;
let isSetup = false;

/**
 * Handle unhandled promise rejections
 * @param {PromiseRejectionEvent} event - The unhandledrejection event object.
 */
function handleUnhandledRejection(event) {
  // Exit if the error reporter is not set
  if (!errorReporter) {
    return;
  }

  let reporter = errorReporter;
  let originalError = event.reason;
  let normalizedError = getErrorSafe(originalError);
  let errorName = null;
  let keys = [];

  // --- Step 1. Extract extra information if the original error differs from the normalized one ---
  if (originalError !== normalizedError && typeof originalError === 'object' && originalError) {
    // Take up to 3 keys for naming purposes
    keys = Object.keys(originalError).sort().slice(0, 3);

    // Use messageFormat if message is missing
    if (typeof originalError.message !== 'string' && typeof originalError.messageFormat === 'string') {
      originalError.message = originalError.messageFormat;
      normalizedError = getErrorSafe(originalError);
    }

    // --- Step 2. Handle different message formats ---
    if (typeof originalError.message !== 'string' && typeof originalError.errorMsg === 'string') {
      const msg = originalError.errorMsg;

      // Handle HTML documents
      if (/^\s*\<!doctype/i.test(msg)) {
        const match = /<title>([^<]+)<\/title>(?:(?:.|\n)*<h1>([^<]+)<\/h1>)?/im.exec(msg);
        normalizedError = match
          ? err('HTML document with title="%s" and h1="%s"', match[1] || '', match[2] || '')
          : err('HTML document sanitized');
      }
      // Handle XML documents
      else if (/^\s*<\?xml/i.test(msg)) {
        normalizedError = err('XML document sanitized');
      }
      // Otherwise, just treat errorMsg as the message
      else {
        originalError.message = msg;
        normalizedError = getErrorSafe(originalError);
      }
    }

    // --- Step 3. Decide on the error name ---
    if (normalizedError !== originalError && typeof originalError.name === 'string') {
      errorName = originalError.name;
    } else if (typeof originalError.name !== 'string') {
      if (typeof originalError.errorCode === 'string') {
        errorName = `UnhandledRejectionWith_errorCode_${originalError.errorCode}`;
      } else if (typeof originalError.error === 'number') {
        errorName = `UnhandledRejectionWith_error_${originalError.error}`;
      }
    }
  }

  // --- Step 4. Set error name and logging source ---
  normalizedError.loggingSource = 'ONUNHANDLEDREJECTION';
  try {
    normalizedError.name =
      normalizedError === originalError && errorName
        ? errorName
        : originalError.name ||
          (keys.length
            ? `UnhandledRejectionWith_${keys.join('_')}`
            : `UnhandledRejection_${originalError ? typeof originalError : 'null'}`);
  } catch {}

  // --- Step 5. Improve stack trace ---
  try {
    let stack = originalError?.stack || normalizedError.stack || err('').stack;
    normalizedError.stack = `${normalizedError.name}: ${normalizedError.message}\n${stack
      .split('\n')
      .slice(1)
      .join('\n')}`;
  } catch {}

  // --- Step 6. Add promise-specific stack traces if available ---
  try {
    const promise = event.promise;
    if (promise && typeof promise.settledStack === 'string') {
      normalizedError.stack += `\n    at <promise_settled_stack_below>\n${promise.settledStack}`;
    }

    if (promise && typeof promise.createdStack === 'string') {
      normalizedError.stack += `\n    at <promise_created_stack_below>\n${promise.createdStack}`;
    }
  } catch {}

  // --- Step 7. Report the error and prevent browser warnings ---
  reporter.reportError(normalizedError);
  event.preventDefault();
}

/**
 * Set up the global unhandled promise rejection listener
 * @param {Object} reporter - The error reporter that handles reporting errors.
 */
function setupUnhandledRejectionListener(reporter) {
  errorReporter = reporter;

  // Only register once
  if (typeof window.addEventListener === 'function' && !isSetup) {
    isSetup = true;
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }
}

// Export the unhandled rejection handler
export const ErrorUnhandledRejectionHandler = {
  onunhandledrejection: handleUnhandledRejection,
  setup: setupUnhandledRejectionListener,
};
