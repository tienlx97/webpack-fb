/**
 * Changelog:
 * - 06/09/2025
 */

import React, { PureComponent } from 'react';

import { getReactElementDisplayName } from '@fb-utils/getReactElementDisplayName';

import { ErrorPubSub } from './ErrorPubSub';
import { ErrorSerializer } from './ErrorSerializer';
import { getErrorSafe } from './getErrorSafe';

/**
 * Resolve a readable display name for (the first) child element.
 * If multiple children are passed, we use the first one.
 */
function getReactDisplayName(children) {
  const firstChild = React.Children.count(children) > 1 ? React.Children.toArray(children)[0] : children;
  return getReactElementDisplayName(firstChild);
}

/**
 * Props for ErrorBoundary.
 * @typedef {Object} ErrorBoundaryProps
 * @property {(error: any) => void}    [augmentError]  Mutate/enrich the error before reporting.
 * @property {{messageFormat?: string, messageParams?: any[]}|Object} [context] Additional context merged into the error.
 * @property {string}                  [description="base"] Short label for where the boundary sits.
 * @property {(error:any, moduleName:string)=>void} [onError] Callback when an error is caught.
 * @property {(error:any, moduleName:string)=>React.ReactNode} [fallback] Rendered when an error is present.
 * @property {number}                  [forceResetErrorCount=0] Increment to reset error state.
 * @property {React.ReactNode}         [children]
 */

/**
 * State for ErrorBoundary.
 * @typedef {Object} ErrorBoundaryState
 * @property {any}    error       Normalized error object (or null).
 * @property {string} moduleName  Display name of the first child for attribution.
 */

/**
 * ErrorBoundary
 *
 * A React error boundary that:
 *  - Normalizes thrown values via `getErrorSafe`
 *  - Aggregates component stack + context with `ErrorSerializer`
 *  - Publishes errors to `ErrorPubSub`
 *  - Renders an optional `fallback(error, moduleName)`
 *  - Can be reset by bumping `forceResetErrorCount`
 */
export class ErrorBoundary extends PureComponent {
  /** @type {Required<Pick<ErrorBoundaryProps, 'forceResetErrorCount'>>} */
  // eslint-disable-next-line react/sort-comp
  static defaultProps = {
    forceResetErrorCount: 0,
  };

  /**
   * React lifecycle: transform an error into state.
   * We normalize the thrown value so downstream code can assume an Error-like shape.
   */
  static getDerivedStateFromError = function (error) {
    return {
      error: getErrorSafe(error),
    };
  };

  /** @param {ErrorBoundaryProps} props */
  constructor(props) {
    super(props);

    /** @type {ErrorBoundaryState} */
    this.state = {
      error: null,
      moduleName: getReactDisplayName(this.props.children),
    };

    // Suppress React’s default error logging to avoid noisy console output.
    // NOTE: This can make bugs harder to find if you rely on console errors.
    this.suppressReactDefaultErrorLoggingIUnderstandThisWillMakeBugsHarderToFindAndFix = true;
  }

  /**
   * Allow external reset by incrementing `forceResetErrorCount`.
   * When it changes and we currently show an error, clear it.
   */
  componentDidUpdate(prevProps) {
    if (
      this.state.error &&
      this.props.forceResetErrorCount &&
      this.props.forceResetErrorCount !== prevProps.forceResetErrorCount
    ) {
      this.setState({
        error: null,
      });
      return;
    }
  }

  /**
   * React error boundary hook with component stack info.
   * We enrich and publish the normalized error, then notify `onError`.
   */
  componentDidCatch(e, errorInfo) {
    const { componentStack } = errorInfo;
    const { augmentError, onError } = this.props;

    // Prepare context: default message if none provided
    let { context = {}, description = 'base' } = this.props;

    if (!context.messageFormat) {
      context.messageFormat = 'caught error in module %s (%s)';
      context.messageParams = [this.state.moduleName, description];
    }

    const { error, moduleName } = this.state;

    if (!error) {
      return;
    }

    // Attach boundary provenance + caller-provided context
    ErrorSerializer.aggregateError(error, {
      componentStack,
      loggingSource: 'ERROR_BOUNDARY',
    });

    ErrorSerializer.aggregateError(error, context);

    // Let caller mutate/enrich the error (e.g., add metadata)
    if (typeof augmentError === 'function') {
      try {
        augmentError(error);
      } catch {
        // Avoid throwing during error handling
      }
    }

    // Publish to the error bus
    ErrorPubSub.reportError(error);

    // Notify consumer
    if (typeof onError === 'function') {
      try {
        onError(error, moduleName);
      } catch {
        // Swallow to avoid secondary errors
      }
    }
  }

  render() {
    const { error, moduleName } = this.state;
    if (error) {
      const { fallback } = this.props;
      // If a fallback renderer is provided, call it with (error, moduleName)
      return fallback ? fallback(error, moduleName) : null;
    }

    // No error → render children (or null)
    return this.props.children ?? null;
  }
}
