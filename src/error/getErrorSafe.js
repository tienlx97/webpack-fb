/**
 * Changelog:
 * - 09/09/2025
 */
import { err } from './err';
import { TAALOpcode } from './TAALOpcode';

const reExnId = 'RE_EXN_ID';

/**
 * Safely convert any thrown value into a proper Error-like object.
 * - If `obj` is not a plain object or lacks a string `message`, this wraps it
 *   in a normalized error created by `err(...)`.
 * - If `obj` already looks like an Error with a string message and is extensible,
 *   it is returned as-is.
 * - All synthesized errors get a TAAL blame hint: PREVIOUS_FRAME.
 *
 * @param {*} obj - The thrown value (could be anything: string, number, object, Error, etc.)
 * @returns {Error|Object} A normalized Error-like object, or the original one if acceptable.
 */
export const getErrorSafe = (obj) => {
  let newErr = null;

  // Case 1: Non-object thrown (string, number, boolean, null, undefined)
  if (!obj || typeof obj !== 'object') {
    newErr = err('Non-object thrown: %s', String(obj));
  } else {
    // Case 2: Object-like thrown
    if (Object.prototype.hasOwnProperty.call(obj, reExnId)) {
      // Likely a ReScript exception wrapper
      // NOTE: This currently stringifies `err` (the factory), not `obj`.
      // Probably intended: JSON.stringify(obj). Left unchanged to preserve behavior.
      newErr = err('Rescript exception thrown: %s', JSON.stringify(err));
    } else {
      // If it doesn't have a string message, treat as non-error object
      if (typeof obj.message !== 'string') {
        newErr = err('Non-error thrown: %s, keys: %s', String(obj), JSON.stringify(Object.keys(obj).sort()));
      } else {
        // If it's an Error-like but is non-extensible, wrap with a safer error
        if (Object.isExtensible && !Object.isExtensible(obj)) {
          newErr = err('Non-extensible thrown: %s', String(obj.message));
        }
      }
    }
  }

  // If we synthesized a new error, attach a TAAL blame hint and return it
  if (newErr) {
    newErr.taalOpcodes = newErr.taalOpcodes || [];
    newErr.taalOpcodes.push(TAALOpcode.PREVIOUS_FRAME);
    return newErr;
  }
  // Otherwise, return the original object (already safe enough)
  return obj;
};
