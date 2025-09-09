/**
 * Changelog:
 * - 09/09/2025
 */

import { TAALOpcode } from './TAALOpcode';

/**
 * Create a standardized Error object with:
 * - A formatted message.
 * - Stringified message parameters.
 * - A generated stack trace (if missing).
 * - A TAAL opcode marker for proper blame attribution.
 *
 * @param {string} message - The main error message format string.
 * @param {...any} params  - Optional parameters for interpolation/debugging.
 * @returns {Error & {
 *   messageFormat: string,
 *   messageParams: string[],
 *   taalOpcodes: number[]
 * }} An enhanced Error object.
 *
 * @example
 * throw err("Failed to fetch user %s at %s", userId, endpoint);
 */
export function err(message, ...params) {
  // Create a standard JS Error
  const error = new Error(message);

  // Ensure the stack trace exists (some environments lazily create it)
  if (error.stack === undefined) {
    try {
      throw error;
    } catch {
      // No-op: purpose is just to force stack capture
    }
  }

  // Attach a raw message format (before substitution)
  error.messageFormat = message;

  // Normalize parameters into string format for consistent serialization
  error.messageParams = params.map((param) => String(param));

  // Attach TAAL opcode metadata for trace attribution
  error.taalOpcodes = [TAALOpcode.PREVIOUS_FRAME];

  return error;
}
