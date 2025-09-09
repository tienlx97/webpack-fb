/**
 * Changelog:
 * - 09/09/2025
 */

import { ErrorMetadata } from './ErrorMetadata';
import { FBLogMessage } from './FBLogMessage';

/**
 * Creates an FBLogger instance for a given project.
 *
 * - Wraps the `FBLogMessage` class.
 * - If `occurAt` is provided, automatically attaches an event tag
 *   in the form of `<projectName>.<occurAt>` for better attribution.
 *
 * @param {string} projectName - The name of the project or logging category.
 * @param {string} [occurAt] - Optional sub-event or context name.
 * @returns {FBLogMessage} A configured logger instance.
 *
 * @example
 * // Simple logger without events
 * const logger = FBLogger("PaymentService");
 * logger.mustfix("Critical failure in API");
 *
 * // Logger with an attached event tag
 * const loggerWithEvent = FBLogger("PaymentService", "CreateOrder");
 * loggerWithEvent.info("Order creation started");
 */
export function FBLogger(projectName, occurAt) {
  const fbLogMessage = new FBLogMessage(projectName);

  // If occurAt provided → attach an event tag to the logger
  return occurAt ? fbLogMessage.event(`${projectName}.${occurAt}`) : fbLogMessage;
}

/**
 * Adds global metadata for all logs.
 *
 * Global metadata will automatically be attached to **every FBLogger instance**
 * and included in all serialized error payloads.
 *
 * @param {string} key - Metadata key.
 * @param {string|number|boolean} value - Metadata value.
 * @param {string} [context] - Optional context or namespace for the metadata.
 *
 * @example
 * FBLogger.addGlobalMetadata("build_version", "1.2.3");
 * FBLogger.addGlobalMetadata("device", "iPhone 15 Pro");
 */
FBLogger.addGlobalMetadata = function (key, value, context) {
  ErrorMetadata.addGlobalMetadata(key, value, context);
};
