/* eslint-disable max-params */
/**
 * Changelog:
 * - 09/09/2025
 */

import { FBLogger } from './FBLogger';

/**
 * Log a recoverable violation: either as a must-fix error or as a debug-only breadcrumb.
 *
 * Behavior:
 * - If an `options.error` is provided, attach it via `.catching(error)` so stack/metadata are preserved.
 * - Otherwise, blame the previous frame so the log points at the caller, not this helper.
 * - If `extra.categoryKey` is provided, add it for grouping/dedup.
 * - If `extra.trackOnly` is true, emit as DEBUG (doesn't page/alert); else emit MUSTFIX.
 *
 * @param {string} errorMessage                      - Message to log.
 * @param {string} loggerIdentifier                  - Logger category/project for FBLogger.
 * @param {{ error?: Error }} [options={}]           - Optional bag with a raw Error to attach.
 * @param {{ categoryKey?: string, trackOnly?: boolean }} [extra] - Extra controls for categorization/verbosity.
 * @returns {null} Always returns null (recoverable path).
 */
export function recoverableViolation(errorMessage, loggerIdentifier, options = {}, extra) {
  const { error } = options;

  // Create category logger
  let logger = FBLogger(loggerIdentifier);

  // Attach raw error if provided; otherwise attribute blame to the caller frame
  logger = error ? logger.catching(error) : logger.blameToPreviousFrame();

  // Add category key if provided (BUGFIX: previously passed `error` by mistake)
  if (extra && extra.categoryKey) {
    logger = logger.addToCategoryKey(extra.categoryKey);
  }

  // Track-only means record as debug; otherwise escalate as must-fix
  const trackOnly = !!(extra && extra.trackOnly);

  if (trackOnly) {
    logger.debug(errorMessage);
  } else {
    logger.mustfix(errorMessage);
  }

  return null;
}
