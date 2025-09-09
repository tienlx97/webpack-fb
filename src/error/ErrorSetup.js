/**
 * ErrorSetup
 *
 * Wires up global error listeners (window.onerror / unhandledrejection),
 * subscribes to ErrorPubSub, and forwards normalized errors to ErrorPoster.
 *
 * Changelog:
 * - 09/12/2024
 */

import { ErrorGlobalEventHandler } from './ErrorGlobalEventHandler';
import { ErrorPoster } from './ErrorPoster';
import { ErrorPubSub } from './ErrorPubSub';
import { ErrorUnhandledRejectionHandler } from './ErrorUnhandledRejectionHandler';

/**
 * @typedef {Object} PreSetupOptions
 * @property {boolean} [ignoreOnError]                 - If true, do NOT install window.onerror handler.
 * @property {boolean} [ignoreOnUnahndledRejection]    - If true, do NOT install unhandledrejection handler.
 *                                                     *Note: property name appears misspelled; kept for compatibility.*
 */

/**
 * Install global error handlers unless explicitly disabled.
 *
 * - onerror → ErrorGlobalEventHandler.setup(ErrorPubSub)
 * - unhandledrejection → ErrorUnhandledRejectionHandler.setup(ErrorPubSub)
 *
 * @param {PreSetupOptions} [opts]
 * @returns {void}
 */
function preSetup(opts) {
  // If opts missing or ignoreOnError !== true → install onerror handler
  if (!opts || opts.ignoreOnError !== true) {
    ErrorGlobalEventHandler.setup(ErrorPubSub);
  }

  // If opts missing or ignoreOnUnahndledRejection !== true → install unhandledrejection handler
  // (kept original key spelling to preserve behavior)
  if (!opts || opts.ignoreOnUnahndledRejection !== true) {
    ErrorUnhandledRejectionHandler.setup(ErrorPubSub);
  }
}

/**
 * @typedef {Object.<string, any>} LogProps
 * Arbitrary static properties appended to every error payload (e.g., appId, client_revision, etc.).
 */

/**
 * @callback LogFunction
 * @param {Object} payload - Final payload created by ErrorPoster.createErrorPayload plus injected fields.
 * @returns {void}
 */

/**
 * @callback ContextSupplier
 * @returns {Object.<string, any>} - Dynamic fields (e.g., session/web_session_id) merged into LogProps per event.
 */

/**
 * Subscribes to ErrorPubSub and forwards each normalized error to ErrorPoster.postError,
 * after merging static `props` with dynamic `context()` (if provided).
 *
 * @param {LogProps} props           - Static, per-app/per-page logging properties.
 * @param {LogFunction} logFunc      - Sink function that actually ships the payload (e.g., network logger).
 * @param {ContextSupplier} [context]- Optional supplier that returns per-event dynamic fields.
 * @returns {void}
 */
function setup(props, logFunc, context) {
  ErrorPubSub.addListener((err) => {
    // Pull dynamic fields on demand (if provided)
    const dynamic = (typeof context === 'function' ? context() : {}) || {};

    // Merge static props + dynamic context for this event
    const appendProps = { ...props, ...dynamic };

    // Let ErrorPoster decide sampling, blocklist, and payload assembly
    ErrorPoster.postError(err, appendProps, logFunc);
  });
}

export const ErrorSetup = {
  setup,
  preSetup,
};

// /**
//  * Changelog:
//  * - 09/12/2024
//  */

// import { ErrorGlobalEventHandler } from './ErrorGlobalEventHandler';
// import { ErrorPoster } from './ErrorPoster';
// import { ErrorPubSub } from './ErrorPubSub';
// import { ErrorUnhandledRejectionHandler } from './ErrorUnhandledRejectionHandler';

// function preSetup(obj) {
//   if (!obj || obj.ignoreOnError !== true) {
//     ErrorGlobalEventHandler.setup(ErrorPubSub);
//   }

//   if (!obj || obj.ignoreOnUnahndledRejection !== true) {
//     ErrorUnhandledRejectionHandler.setup(ErrorPubSub);
//   }
// }

// function setup(props, logFunc, context) {
//   ErrorPubSub.addListener((err) => {
//     let e = context && context !== undefined ? context() : {};
//     // Combine props and context properties
//     let appendProps = {
//       ...props,
//       ...(e || {}),
//     };

//     ErrorPoster.postError(err, appendProps, logFunc);
//   });
// }

// export const ErrorSetup = {
//   setup,
//   preSetup,
// };
