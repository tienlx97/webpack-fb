/* eslint-disable max-params */
/**
 * Changelog:
 * - 09/09/2025
 */

import { FBLogger } from './FBLogger';

/**
 * Logs an unrecoverable violation and **throws** an error.
 *
 * @param {string} msg - The violation message to log.
 * @param {string} projectName - The logger/project name for attribution.
 * @param {{ error?: Error }} [attached] - Optional object containing an existing error to attach.
 * @param {{ categoryKey?: string, blameToPreviousFrame?: number }} [opts] - Optional settings.
 *
 * @returns {never} Always throws, never returns.
 *
 * @example
 * try {
 *   unrecoverableViolation(
 *     "Unexpected null response from API",
 *     "DataService",
 *     { error: existingError },
 *     { categoryKey: "user_profile", blameToPreviousFrame: 2 }
 *   );
 * } catch (e) {
 *   console.error("Caught unrecoverable error:", e);
 * }
 */
export function unrecoverableViolation(message, projectName, attached = {}, opts = {}) {
  // Normalize errObj then extract the raw Error
  // attached  = attached  === undefined ? {} : attached ;
  // const attachedError = attached.error;

  // Acquire a logger for the given project
  let fbLogger = FBLogger(projectName);

  // If we have an Error, attach it; otherwise blame the caller frame
  let logger = attached.error ? fbLogger.catching(attached.error) : fbLogger.blameToPreviousFrame();

  // Optionally climb additional frames for better attribution
  const frameDepth = opts.blameToPreviousFrame ?? 0;
  for (let i = 0; i < frameDepth; i++) {
    logger = logger.blameToPreviousFrame();
  }

  // Optionally add a category key for grouping
  if (opts.categoryKey !== null) {
    logger = logger.addToCategoryKey(opts.categoryKey);
  }

  // Log + throw (never returns)
  return logger.mustfixThrow(message);
}
