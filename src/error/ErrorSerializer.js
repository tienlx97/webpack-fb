/* eslint-disable complexity */
/**
 * Changelog:
 * - 09/12/2024
 */

import { ErrorMetadata } from './ErrorMetadata';

// Severity levels for error categorization
// Lower number = lower severity, higher number = more critical
const Severity = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

// Merge details from `sourceError` into `targetError`
// Ensures the target error has the most complete and accurate information.
function aggregateError(targetError, sourceError) {
  // If the target error object is frozen → cannot modify → stop immediately
  if (Object.isFrozen(targetError)) {
    return;
  }

  // Determine error severity:
  // If sourceError has a type and either targetError has none
  // or the source severity is higher → override targetError.type
  if (sourceError.type && (!targetError.type || Severity[targetError.type] > Severity[sourceError.type])) {
    targetError.type = sourceError.type;
  }

  // Merge metadata between source and target
  const sourceMetadata = sourceError.metadata;
  if (sourceMetadata) {
    const targetMetadata =
      targetError.metadata !== null && targetError.metadata !== undefined ? targetError.metadata : new ErrorMetadata();

    // Add all source metadata entries into target metadata
    sourceMetadata.addEntries(...sourceMetadata.getAll());
    targetError.metadata = targetMetadata;
  }

  // Copy over additional properties if they exist in the source error
  if (sourceError.project) targetError.project = sourceError.project;
  if (sourceError.errorName) targetError.errorName = sourceError.errorName;
  if (sourceError.componentStack) targetError.componentStack = sourceError.componentStack;
  if (sourceError.deferredSource) targetError.deferredSource = sourceError.deferredSource;
  if (sourceError.blameModule) targetError.blameModule = sourceError.blameModule;
  if (sourceError.loggingSource) targetError.loggingSource = sourceError.loggingSource;

  // Merge message formats and parameters
  let messageFormat = targetError.messageFormat || targetError.message;
  let messageParams = targetError.messageParams || [];

  // If the messages differ and source has its own format → append its message
  if (messageFormat !== sourceError.messageFormat && sourceError.messageFormat !== null) {
    messageFormat += ' [Caught in: ' + sourceError.messageFormat + ']';

    const params =
      sourceError.messageParams !== null && sourceError.messageParams !== undefined ? sourceError.messageParams : [];

    // Append source message params to the target error params
    messageParams.push.apply(messageParams, params);
  }

  targetError.messageFormat = messageFormat;
  targetError.messageParams = messageParams;

  // Combine forced keys if both exist, otherwise fallback to whichever is available
  const forcedKey =
    sourceError.forcedKey && targetError.forcedKey
      ? sourceError.forcedKey + '_' + targetError.forcedKey
      : sourceError.forcedKey
      ? sourceError.forcedKey
      : targetError.forcedKey;
  targetError.forcedKey = forcedKey;
}

// Replace placeholders (%s) in the message string with provided params.
// Example:
//   formatMessage("Hello %s, you have %s new messages", ["Ivy", 5])
//   → "Hello Ivy, you have 5 new messages"
function formatMessage(message, params) {
  let index = 0;
  let formattedMessage = String(message).replace(/%s/g, () => {
    return index < params.length ? params[index++] : 'NOPARAM';
  });

  // If there are leftover params not replaced in the string → append them at the end
  if (index < params.length) {
    return formattedMessage + ' PARAMS' + JSON.stringify(params.slice(index));
  }
  return formattedMessage;
}

// Converts an error object into a fully readable message string.
// Falls back to `error.message` if `messageFormat` is unavailable.
function toReadableMessage(error) {
  const message =
    error.messageFormat !== null && error.messageFormat !== undefined ? error.messageFormat : error.message;
  return formatMessage(message, error.messageParams || []);
}

// Converts message parameters into an array of strings.
function toStringParams(params) {
  return (params || []).map((param) => String(param));
}

// Exported utilities for error serialization and formatting.
export const ErrorSerializer = {
  aggregateError, // Merge multiple errors into one
  toReadableMessage, // Produce a human-readable error string
  toStringParams, // Normalize params into string format
};
