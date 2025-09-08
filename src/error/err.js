/**
 * Changelog:
 * - 06/09/2025
 */

import { TAALOpcode } from './TAALOpcode';

// Utility function to create a new error with formatted message
export function err(message, ...params) {
  let error = new Error(message);
  if (error.stack === undefined) {
    try {
      throw error;
    } catch {}
  }
  error.messageFormat = message;
  error.messageParams = params.map((param) => String(param));
  error.taalOpcodes = [TAALOpcode.PREVIOUS_FRAME];
  return error;
}
