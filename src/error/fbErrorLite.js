/**
 * Changelog:
 * - 09/09/2025
 */

/**
 * TAAL opcodes (lightweight tracing markers).
 * Used to annotate errors with where they originated from.
 */
const TAALOpcode = {
  PREVIOUS_FILE: 1, // Previous source file in the call chain
  PREVIOUS_FRAME: 2, // Previous stack frame (most recent caller)
  PREVIOUS_DIR: 3, // Previous directory/module
  FORCED_KEY: 4, // Force-join key when aggregating errors
};

/**
 * Create a lightweight error with formatting support and TAAL opcodes.
 *
 * Features:
 * - Ensures an error stack is generated.
 * - Stores the original message format in `messageFormat`.
 * - Stores any additional arguments as `messageParams` (stringified).
 * - Adds a TAAL opcode hint to indicate stack tracing preference.
 *
 * @param {string} messageFormat - The message format string.
 * @param {...any} params - Dynamic values to attach to the error.
 * @returns {Error & {
 *   messageFormat: string,
 *   messageParams: string[],
 *   taalOpcodes: number[]
 * }} Augmented Error object.
 */
function createFormattedError(messageFormat, ...params) {
  // Create a new error instance
  const error = new Error(messageFormat);

  // Some JS engines lazily build `.stack` → force generate it if missing
  if (error.stack === void 0) {
    try {
      throw error;
    } catch {
      // Ignore — we only needed the throw to populate the stack
    }
  }

  // Store the unformatted message
  error.messageFormat = messageFormat;

  // Convert params to strings for consistent downstream formatting
  error.messageParams = params.map((param) => String(param));

  // Attach TAAL opcode metadata → signals where this error originated
  error.taalOpcodes = [TAALOpcode.PREVIOUS_FRAME];

  return error;
}

export const fbErrorLite = {
  err: createFormattedError,
  TAALOpcode,
};
