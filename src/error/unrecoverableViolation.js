/* eslint-disable max-params */
/**
 * Changelog:
 * - 09/09/2025
 */

import { FBLogger } from './FBLogger';

/**
 * Logs an unrecoverable violation and **throws** an error.
 *
 * - Uses `FBLogger` to report a **must-fix** issue.
 * - If an `errObj` is provided, it attaches the existing error to preserve the stack trace.
 * - Otherwise, it blames the previous frame so the caller is properly attributed.
 * - Optionally adds a `categoryKey` for error grouping.
 * - Finally, it throws the error created by `FBLogger.mustfixThrow()`.
 *
 * @param {string} msg - The violation message to log.
 * @param {string} projectName - The logger/project name for attribution.
 * @param {{ categoryKey?: string }} [category] - Optional category for grouping.
 * @param {{ error?: Error }} [errObj] - Optional object containing an existing error to attach.
 *
 * @returns {never} Always throws, never returns.
 *
 * @example
 * try {
 *   unrecoverableViolation(
 *     "Unexpected null response from API",
 *     "DataService",
 *     { categoryKey: "user_profile" },
 *     { error: existingError }
 *   );
 * } catch (e) {
 *   console.error("Caught unrecoverable error:", e);
 * }
 */
export function unrecoverableViolation(message, projectName, errObj, options) {
  // Normalize errObj then extract the raw Error
  errObj = errObj === undefined ? {} : errObj;
  const attachedError = errObj.error;

  // Acquire a logger for the given project
  let logger = FBLogger(projectName);

  // If we have an Error, attach it; otherwise blame the caller frame
  logger = attachedError ? logger.catching(attachedError) : logger.blameToPreviousFrame();

  // Optionally climb additional frames for better attribution
  const extraBlames = (options?.blameToPreviousFrame ?? 0) | 0; // coerce to int
  for (let i = 0; i < extraBlames; i++) {
    logger = logger.blameToPreviousFrame();
  }

  // Optionally add a category key for grouping
  const categoryKey = options?.categoryKey;
  if (categoryKey !== null) {
    logger = logger.addToCategoryKey(categoryKey);
  }

  // Log as must-fix and throw (never returns)
  return logger.mustfixThrow(message);
}
