/**
 * Changelog:
 * - 06/09/2025
 */

import React, { forwardRef, useCallback, useContext } from 'react';

import { HeroCurrentInteractionForLoggingContext } from '@fb-contexts/HeroCurrentInteractionForLoggingContext';

import { InteractionTracingMetricsCore } from '@fb-placeholder/InteractionTracingMetricsCore';

import { ErrorBoundary } from './ErrorBoundary';
import { ErrorMetadata } from './ErrorMetadata';
import { useHeroErrorMetadata } from './useHeroErrorMetadata';
import { useHeroFailTrigger } from './useHeroFailTrigger';

/**
 * Returns a stable callback that logs Hero interaction failure when a boundary catches an error.
 * - If `failOnCometErrorBoundaryEnabled === 1`, it triggers a fail.
 * - It also annotates the interaction as failed if enabled or already annotated.
 */
function handleErrorLogging() {
  const heroContext = useContext(HeroCurrentInteractionForLoggingContext);
  const triggerFail = useHeroFailTrigger();

  return useCallback(
    (error) => {
      let interactionUUID = heroContext?.current?.interactionUUID;

      if (!interactionUUID) return;

      const interactionMetrics = InteractionTracingMetricsCore.get(interactionUUID);
      const failOnCometErrorBoundaryEnabled = interactionMetrics?.annotations?.['int']?.failOnCometErrorBoundaryEnabled;

      if (failOnCometErrorBoundaryEnabled === 1) {
        triggerFail({ error });
      }

      // Add annotation for failure
      if (
        failOnCometErrorBoundaryEnabled === 1 ||
        interactionMetrics?.annotations?.['int']?.failOnCometErrorBoundaryAnnotated === 1
      ) {
        InteractionTracingMetricsCore.addAnnotationInt(interactionUUID, 'failedOnCometErrorBoundary', 1);
      }
    },
    [heroContext, triggerFail],
  );
}

/**
 * @typedef CometErrorBoundaryProps
 * @property {(error: Error, extra?: any) => void} [onError]      - Called when a child throws.
 * @property {(error: any) => void}               [augmentError] - Mutates/enriches the error before reporting.
 * @property {'fatal'|'error'|'warn'|'info'}      [type]          - Optional error type to stamp onto the error.
 * @property {React.ReactNode}                    [fallback]      - UI to render on error.
 * @property {React.ReactNode}                    [children]      - Boundary children.
 */

/**
 * A thin wrapper around `ErrorBoundary` that:
 * - Integrates with Hero interaction logging.
 * - Adds Hero metadata to errors.
 * - Optionally stamps `type` and a `COMET_INFRA` marker.
 */
const cometErrorBoundary = (props, ref) => {
  const { augmentError, onError, type, ...restProps } = props;

  // Hook that attaches hero-related metadata to the error
  const errorMetadata = useHeroErrorMetadata();

  // Stable logger that integrates with Hero metrics
  const logError = handleErrorLogging();

  /**
   * TODO: Remove on 06/09/2025
   * Wraps consumer `onError` so we can log to Hero first.
   */
  const handleErrorCallback = useCallback(
    (error, additionalData) => {
      logError(error);
      onError?.(error, additionalData);
    },
    [onError, logError],
  );

  /**
   * Augments the error with:
   * - consumer’s augmentation,
   * - hero metadata,
   * - explicit `type` (if provided),
   * - and a `COMET_INFRA` boundary marker in metadata.
   */
  const augmentErrorCallback = useCallback(
    (error) => {
      augmentError?.(error);
      errorMetadata(error);

      if (type) {
        error.type = type;
        let metadata = error.metadata ?? new ErrorMetadata();
        error.metadata = metadata;
        metadata.addEntry('COMET_INFRA', 'EXPLICITLY_MARKED_ERROR_BOUNDARY', 'true');
      }
    },
    [augmentError, errorMetadata, type],
  );

  return (
    <ErrorBoundary
      {...restProps}
      onError={handleErrorCallback}
      augmentError={augmentErrorCallback}
      fallback={props.fallback}
      ref={ref}
    />
  );
};

export const CometErrorBoundary = forwardRef(cometErrorBoundary);

CometErrorBoundary.displayName = 'CometErrorBoundary';
