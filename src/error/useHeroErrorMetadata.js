/**
 * Changelog:
 * - 09/12/2024
 */

import { useCallback, useContext } from 'react';

import { QPLEvent } from '@fb-utils/QPLEvent';

import { HeroCurrentInteractionForLoggingContext } from '@fb-contexts/HeroCurrentInteractionForLoggingContext';
import { HeroInteractionContext } from '@fb-contexts/HeroInteractionContext';

import { InteractionTracingMetrics } from '@fb-placeholder/InteractionTracingMetrics';

import { ErrorMetadata } from './ErrorMetadata';

/**
 * Custom React hook for attaching Hero interaction metadata to an error.
 *
 * @returns {(error: any) => void} - Callback that augments `error.metadata`.
 */
export function useHeroErrorMetadata() {
  const currentInteractionContext = useContext(HeroCurrentInteractionForLoggingContext);
  const heroInteractionContext = useContext(HeroInteractionContext.Context);
  const pageletStack = heroInteractionContext.pageletStack;

  return useCallback(
    (errorInfo) => {
      let errorMetadata = errorInfo.metadata || new ErrorMetadata();
      errorInfo.metadata = errorMetadata;

      const interactionUUID = currentInteractionContext.current?.interactionUUID;

      if (interactionUUID) {
        const interactionMetrics = InteractionTracingMetrics.get(interactionUUID);

        if (pageletStack) {
          errorMetadata.addEntry('COMET_INFRA', 'INTERACTION_PAGELET_STACK', pageletStack.join(','));
        }

        if (interactionMetrics && !interactionMetrics.qplAction) {
          if (interactionMetrics.qplEvent) {
            errorMetadata.addEntry(
              'COMET_INFRA',
              'INTERACTION_QPL_EVENT',
              String(QPLEvent.getMarkerId(interactionMetrics.qplEvent)),
            );
          }

          if (interactionMetrics.tracePolicy) {
            errorMetadata.addEntry('COMET_INFRA', 'INTERACTION_TRACE_POLICY', interactionMetrics.tracePolicy);
          }
        }
      }
    },
    [currentInteractionContext, pageletStack],
  );
}
