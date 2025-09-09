/**
 * Changelog:
 * - 09/12/2024
 */

import { TAALOpcode } from './TAALOpcode';

/**
 * TAAL (Trace Attribution And Logging)
 *
 * Utility for attaching blame information to an Error object.
 * TAAL opcodes tell the logging system where the **actual cause** of the error originated.
 * This is used internally by FBLogger and other error-reporting tools.
 */
export const TAAL = {
  /**
   * Attribute this error to the **previous source file**.
   * @param {Error} error - The error to update.
   * @returns {Error} The same error, with updated TAAL opcodes.
   */
  blameToPreviousFile(error) {
    error.taalOpcodes = error.taalOpcodes ?? [];
    error.taalOpcodes.push(TAALOpcode.PREVIOUS_FILE);
    return error;
  },

  /**
   * Attribute this error to the **previous stack frame**.
   * @param {Error} error - The error to update.
   * @returns {Error} The same error, with updated TAAL opcodes.
   */
  blameToPreviousFrame(error) {
    error.taalOpcodes = error.taalOpcodes ?? [];
    error.taalOpcodes.push(TAALOpcode.PREVIOUS_FRAME);
    return error;
  },

  /**
   * Attribute this error to the **previous directory or module**.
   * @param {Error} error - The error to update.
   * @returns {Error} The same error, with updated TAAL opcodes.
   */
  blameToPreviousDirectory(error) {
    error.taalOpcodes = error.taalOpcodes ?? [];
    error.taalOpcodes.push(TAALOpcode.PREVIOUS_DIR);
    return error;
  },
};
