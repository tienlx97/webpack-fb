/**
 * Changelog:
 * - 08/01/2025
 */
import React from 'react';

import { CometErrorBoundary } from './CometErrorBoundary';
import { err } from './err';

/**
 * Helper component that throws an error when rendered.
 * - Used to trigger CometErrorBoundary intentionally.
 */
function ThrowErr({ errorMessage }) {
  throw err(errorMessage);
}

/**
 * A wrapper component that triggers a controlled recoverable error
 * and captures the **React component stack** via CometErrorBoundary.
 *
 * @param {Object} props
 * @param {string} props.errorMessage - The message to include in the thrown error.
 * @param {React.ReactNode} [props.fallback] - Optional fallback UI if error is caught.
 * @param {string} [props.projectName] - Project name for better error attribution.
 *
 * @example
 * <RecoverableViolationWithComponentStack
 *   errorMessage="Component crashed!"
 *   fallback={<div>Something went wrong</div>}
 *   projectName="MyProject"
 * />
 */
export const RecoverableViolationWithComponentStack = ({ errorMessage, fallback, projectName }) => {
  return (
    <CometErrorBoundary context={{ project: projectName, type: 'error' }} fallback={() => fallback ?? null}>
      <ThrowErr errorMessage={errorMessage} />
    </CometErrorBoundary>
  );
};

RecoverableViolationWithComponentStack.displayName = `RecoverableViolationWithComponentStack.react`;
