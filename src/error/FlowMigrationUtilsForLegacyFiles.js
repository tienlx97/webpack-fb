/**
 * Changelog:
 * - 09/12/2024
 */

import { FBLogger } from './FBLogger';

const projectName = 'flow_typing_for_legacy_code';

function invariantViolation(err) {
  FBLogger(projectName)
    .blameToPreviousFile()
    .event(projectName + '.bad_call')
    .mustfix(err);
  return new Error('[' + projectName + '] ' + err);
}

export const FlowMigrationUtilsForLegacyFiles = {
  invariantViolation,
};
