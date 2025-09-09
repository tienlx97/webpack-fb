/**
 * Changelog:
 * - 09/09/2025
 */

/**
 * TAAL opcodes (lightweight tracing markers).
 * Used to annotate errors with where they originated from.
 */
export const TAALOpcode = {
  PREVIOUS_FILE: 1, // Previous source file in the call chain
  PREVIOUS_FRAME: 2, // Previous stack frame (most recent caller)
  PREVIOUS_DIR: 3, // Previous directory/module
  FORCED_KEY: 4, // Force-join key when aggregating errors
};
