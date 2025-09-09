/**
 * Changelog:
 * - 09/09/2025
 */

import { ErrorMetadata } from './ErrorMetadata';
import { FBLogMessage } from './FBLogMessage';

export function FBLogger(projectName, occurAt) {
  const fbLogMessage = new FBLogMessage(projectName);
  return occurAt ? fbLogMessage.event(projectName + '.' + occurAt) : fbLogMessage;
}

FBLogger.addGlobalMetadata = function (key, value, context) {
  ErrorMetadata.addGlobalMetadata(key, value, context);
};
