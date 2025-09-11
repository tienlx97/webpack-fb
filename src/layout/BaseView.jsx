/**
 * Changelog:
 * - 11/09/2025
 */

import React from 'react';

import { testID } from '@fb-utils/testID';

import { LegacyHidden } from './LegacyHidden';

import stylex from '@stylexjs/stylex';

const styles = stylex.create({
  hidden: {
    display: 'none',
  },
  root: {
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 0,
  },
});

/**
 * @typedef {Object} BaseViewProps
 * @property {React.ReactNode} [children] - The content to render inside the container.
 * @property {boolean} [hidden] - If true, hides the view (applies `display: none`).
 * @property {string} [testid] - Optional test ID used for automated testing.
 * @property {boolean} [suppressHydrationWarning] - React hydration mismatch suppression.
 * @property {React.Ref<HTMLElement>} [ref] - Optional ref for the root DOM element.
 * @property {any} [xstyle] - StyleX style or array of styles applied to the root.
 * @property {Record<string, any>} [restProps] - Additional props passed down to the underlying `div`.
 */

/**
 * BaseView - A flexible container component built on `LegacyHidden`.
 *
 * @param {BaseViewProps} props - Component props.
 * @returns {JSX.Element} The rendered view.
 */
const BaseView = (props) => {
  const { children, suppressHydrationWarning, testid, xstyle, ref, ...restProps } = props;

  const isHidden = props.hidden === true;

  return (
    <LegacyHidden
      htmlAttributes={{
        ...restProps,
        ...testID(testid),
        className: stylex(styles.root, xstyle, isHidden && styles.hidden),
      }}
      mode={isHidden ? 'hidden' : 'visible'}
      ref={ref}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
    </LegacyHidden>
  );
};

BaseView.displayName = 'BaseView';

export { BaseView };
