/**
 * Changelog:
 * - 09/09/2025
 */

import { FBLogger } from './FBLogger';

/**
 * Log a must-fix when an API/function is used unexpectedly in Comet.
 *
 * - Doubles `blameToPreviousFrame()` so attribution points at the real caller,
 *   not this helper.
 * - Emits a MUSTFIX so the issue is surfaced and grouped under `comet_infra`.
 *
 * @param {string} apiName - The API or function name that was used unexpectedly.
 * @returns {void}
 */
export function unexpectedUseInComet(apiName) {
  // Message explaining that the usage is unsupported in Comet
  const message = `${apiName} called unexpectedly. This is not supported in Comet!`;

  // Attribute blame to the caller (two frames up) and log as must-fix
  FBLogger('comet_infra').blameToPreviousFrame().blameToPreviousFrame().mustfix(message);
}
