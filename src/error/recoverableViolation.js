/* eslint-disable max-params */
/**
 * Changelog:
 * - 09/09/2025
 */

import { FBLogger } from './FBLogger';

/**
 * Log a recoverable violation and return `null`.
 *
 * - If `attached.error` exists, keep original stack via `.catching`.
 * - Otherwise, blame the previous frame so attribution points to the caller.
 * - `opts.categoryKey` groups/dedups on the server.
 * - If `opts.trackOnly` is true, emit as debug; else as must-fix.
 *
 * @param {string} msg
 * @param {string} projectName
 * @param {{ error?: Error }} [attached={}]
 * @param {{ categoryKey?: string, trackOnly?: boolean }} [opts]
 * @returns {null}
 */
export function recoverableViolation(msg, projectName, attached = {}, opts) {
  const { error } = attached;

  // Create category logger
  let fbLogger = FBLogger(projectName);

  // Attach raw error if provided; otherwise attribute blame to the caller frame
  let logger = error ? fbLogger.catching(error) : fbLogger.blameToPreviousFrame();

  // Add category key if provided (BUGFIX: previously passed `error` by mistake)
  if (opts?.categoryKey) {
    logger = logger.addToCategoryKey(opts.categoryKey);
  }

  // Track-only means record as debug; otherwise escalate as must-fix
  const trackOnly = !!opts?.trackOnly;

  if (trackOnly) {
    logger.debug(msg);
  } else {
    logger.mustfix(msg);
  }

  return null;
}
