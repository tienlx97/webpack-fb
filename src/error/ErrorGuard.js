/**
 * ErrorGuard
 *
 * A utility module that wraps functions with error-handling and reporting mechanisms.
 * It ensures:
 *   • Errors are safely caught.
 *   • Errors are normalized, serialized, and published consistently.
 *   • Functions are not double-wrapped using the __isMetaErrorGuarded flag.
 *
 * Changelog:
 * - 09/12/2024
 */

import { ErrorConfig } from './ErrorConfig';
import { ErrorGuardState } from './ErrorGuardState';
import { ErrorNormalizeUtils } from './ErrorNormalizeUtils';
import { ErrorPubSub } from './ErrorPubSub';
import { ErrorSerializer } from './ErrorSerializer';
import { getErrorSafe } from './getErrorSafe';

const ANONYMOUS_GUARD = '<anonymous guard>';
let isGuardGlobalEnabled = false;

/**
 * Safely executes a function within an error guard.
 *
 * @param {Function} func - The target function to execute.
 * @param {*} context - The `this` context for the function.
 * @param {Array} args - The arguments passed to the function.
 * @param {Object} [options] - Guard configuration options.
 * @param {string} [options.name] - Optional custom guard name.
 * @param {*} [options.deferredSource] - Additional source info for debugging.
 * @param {string} [options.project="ErrorGuard"] - Project name for error reporting.
 * @param {string} [options.errorType] - Categorizes the type of error.
 * @param {Function} [options.onError] - Callback when a raw error occurs.
 * @param {Function} [options.onNormalizedError] - Callback after error normalization.
 * @returns {*} Returns the result of the function or handles errors internally.
 */
// eslint-disable-next-line max-params
function applyWithGuard(func, context, args, options) {
  // If duplicate guards should be skipped and the function is already guarded, execute directly
  if (ErrorConfig.config.skipDupErrorGuard && '__isMetaErrorGuarded' in func) {
    return func.apply(context, args);
  }

  // Push guard info into stack for tracking and debugging
  ErrorGuardState.pushGuard({
    name: (options && options.name) || (func.name ? 'func_name:' + func.name : null) || ANONYMOUS_GUARD,
    deferredSource: options && options.deferredSource,
  });

  // If skipping global guards, execute directly without try/catch
  if (isGuardGlobalEnabled) {
    try {
      return func.apply(context, args);
    } finally {
      ErrorGuardState.popGuard();
    }
  }

  try {
    // Execute function normally
    return Function.prototype.apply.call(func, context, args);
  } catch (rawError) {
    try {
      const opt = options || {};
      const deferredSource = opt.deferredSource;
      const onRawError = opt.onError;
      const onNormalizedError = opt.onNormalizedError;

      // Normalize error safely
      const safeError = getErrorSafe(rawError);

      // Build metadata for serialization
      const serializeMeta = {
        deferredSource,
        loggingSource: 'GUARDED',
        project: opt.project || 'ErrorGuard',
        type: opt.errorType,
      };

      // Aggregate error for grouping/reporting
      ErrorSerializer.aggregateError(safeError, serializeMeta);

      // Normalize error into a consistent structure
      const normalized = ErrorNormalizeUtils.normalizeError(safeError);

      // If safeError is null, attach debugging info
      if (safeError === null && func) {
        normalized.extra[func.toString().substring(0, 100)] = 'function';
        if (args && args.length) {
          normalized.extra[Array.from(args).toString().substring(0, 100)] = 'args';
        }
      }

      // Attach guard stack snapshot for better traceability
      normalized.guardList = ErrorGuardState.cloneGuardList();

      // Call error callbacks if provided
      if (onRawError) {
        onRawError(safeError);
      }
      if (onNormalizedError) {
        onNormalizedError(normalized);
      }

      // Publish normalized error for subscribers/logging
      ErrorPubSub.reportNormalizedError(normalized);
    } catch {
      // Ignore secondary errors that occur during error handling
    }
  } finally {
    // Always pop guard info to prevent stack leaks
    ErrorGuardState.popGuard();
  }
}

/**
 * Wraps a function with an error guard.
 *
 * @template {Function} T
 * @param {T} func - The function to wrap.
 * @param {Object} [options] - Guard configuration options.
 * @param {string} [options.name] - Custom guard name.
 * @param {*} [options.deferredSource] - Extra source data.
 * @param {string} [options.project] - Project/module name for reporting.
 * @param {string} [options.errorType] - Categorizes the error.
 * @param {Function} [options.onError] - Callback for raw error events.
 * @param {Function} [options.onNormalizedError] - Callback for normalized errors.
 * @returns {T} Returns a new function wrapped with error protection.
 */
function guard(func, options) {
  function guardedFunction() {
    // eslint-disable-next-line no-invalid-this
    return applyWithGuard(func, this, arguments, options);
  }

  // Mark the function as guarded to avoid double wrapping
  guardedFunction.__isMetaErrorGuarded = true;

  // Preserve metadata if the original function had it
  if (func.__SMmeta) {
    guardedFunction.__SMmeta = func.__SMmeta;
  }

  return guardedFunction;
}

/**
 * Checks if the current execution is inside a guarded context.
 *
 * @returns {boolean} True if inside a guard; otherwise false.
 */
function inGuard() {
  return ErrorGuardState.inGuard();
}

/**
 * Enables or disables global guard skipping.
 *
 * When enabled:
 *   • Functions execute without try/catch for better performance.
 *   • Guard stack tracking still works.
 *
 * @param {boolean} isEnabled - Whether to enable skipping.
 */
function skipGuardGlobal(isEnabled) {
  isGuardGlobalEnabled = isEnabled;
}

export const ErrorGuard = {
  skipGuardGlobal,
  inGuard,
  guard,
  applyWithGuard,
};

// /**
//  * Changelog:
//  * - 09/12/2024
//  */

// import { ErrorConfig } from './ErrorConfig';
// import { ErrorGuardState } from './ErrorGuardState';
// import { ErrorNormalizeUtils } from './ErrorNormalizeUtils';
// import { ErrorPubSub } from './ErrorPubSub';
// import { ErrorSerializer } from './ErrorSerializer';
// import { getErrorSafe } from './getErrorSafe';

// const ANONYMOUS_GUARD = '<anonymous guard>';
// let isGuardGlobalEnabled = false;

// /**
//  * The ErrorGuard module in your code provides a mechanism for managing and handling errors
//  * that occur during the execution of JavaScript functions. It is designed to help catch, handle,
//  * and report errors in a controlled and consistent manner,
//  * especially in scenarios where errors might occur but shouldn't break the entire application.
//  * Here's a breakdown of what each part of the code does:
//  */
// // eslint-disable-next-line complexity, max-params
// function applyWithGuard(func, context, args, options) {
//   if (ErrorConfig.config.skipDupErrorGuard && '__isMetaErrorGuarded' in func) {
//     return func.apply(context, args);
//   }

//   ErrorGuardState.pushGuard({
//     name: (options ? options.name ?? null : null) || (func.name ? 'func_name:' + func.name : null) || ANONYMOUS_GUARD,
//     deferredSource: options?.deferredSource,
//   });

//   if (isGuardGlobalEnabled) {
//     try {
//       return func.apply(context, args);
//     } finally {
//       ErrorGuardState.popGuard();
//     }
//   }

//   try {
//     return Function.prototype.apply.call(func, context, args);
//   } catch (error) {
//     try {
//       context = options !== null && options !== void 0 ? options : {};
//       let e = context.deferredSource;
//       const f = context.onError;
//       context = context.onNormalizedError;
//       const sError = getErrorSafe(error);
//       e = {
//         deferredSource: e,
//         loggingSource: 'GUARDED',
//         project:
//           (e = options === null || options === void 0 ? void 0 : options.project) !== null && e !== void 0
//             ? e
//             : 'ErrorGuard',
//         type: options === null || options === void 0 ? void 0 : options.errorType,
//       };
//       ErrorSerializer.aggregateError(sError, e);
//       options = ErrorNormalizeUtils.normalizeError(sError);

//       sError === null &&
//         func &&
//         ((options.extra[func.toString().substring(0, 100)] = 'function'),
//         args !== null && args.length && (options.extra[Array.from(args).toString().substring(0, 100)] = 'args'));
//       options.guardList = ErrorGuardState.cloneGuardList();
//       f && f(sError);
//       context && context(options);
//       ErrorPubSub.reportNormalizedError(options);
//       // eslint-disable-next-line no-unused-vars
//     } catch (handlingError) {}
//   } finally {
//     ErrorGuardState.popGuard();
//   }
// }

// function guard(func, options) {
//   function guardedFunction(...args) {
//     // eslint-disable-next-line no-invalid-this
//     return applyWithGuard(func, this, args, options);
//   }

//   guardedFunction.__isMetaErrorGuarded = true;
//   func.__SMmeta && (guardedFunction.__SMmeta = func.__SMmeta);

//   return guardedFunction;
// }

// function inGuard() {
//   return ErrorGuardState.inGuard();
// }

// function skipGuardGlobal(isEnabled) {
//   isGuardGlobalEnabled = isEnabled;
// }

// export const ErrorGuard = {
//   skipGuardGlobal,
//   inGuard,
//   guard,
//   applyWithGuard,
// };
