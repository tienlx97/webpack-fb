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

  constructor(props) {
    super(props);

    this.state = {
      error: null,
      moduleName: getReactDisplayName(this.props.children),
    };

    this.suppressReactDefaultErrorLoggingIUnderstandThisWillMakeBugsHarderToFindAndFix = true;
  }

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

  componentDidCatch(e, errorInfo) {
    const { componentStack } = errorInfo;
    let { augmentError, context = {}, description = 'base', onError } = this.props;

    if (!context.messageFormat) {
      context.messageFormat = 'caught error in module %s (%s)';
      context.messageParams = [this.state.moduleName, description];
    }

    const { error, moduleName } = this.state;

    if (error) {
      ErrorSerializer.aggregateError(error, {
        componentStack,
        loggingSource: 'ERROR_BOUNDARY',
      });

      ErrorSerializer.aggregateError(error, context);

      if (typeof augmentError === 'function') {
        augmentError(error);
      }

      ErrorPubSub.reportError(error);

      if (typeof onError === 'function') {
        onError(error, moduleName);
      }
    }
  }

  render() {
    const { error, moduleName } = this.state;
    if (error) {
      const { fallback } = this.props;
      return fallback ? fallback(error, moduleName) : null;
    }
    return this.props.children ?? null;
  }
}
