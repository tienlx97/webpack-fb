/**
 * Changelog:
 * - 11/09/2025
 */

import React from 'react';

import { BaseView } from '@fb-layout/BaseView';

import { BaseThemeProvider } from './BaseThemeProvider';

/**
 * BaseTheme
 * - Provides theme context via BaseThemeProvider
 * - Renders BaseView using a render-prop child from the provider
 */
export const BaseTheme = (props) => {
  const { config, displayMode, style, xstyle, ref, ...rest } = props;

  const renderChild = (internalClass, internalStyle) => (
    <BaseView {...rest} ref={ref} style={{ ...internalStyle, ...style }} xstyle={[internalClass, xstyle]} />
  );

  return (
    <BaseThemeProvider config={config} displayMode={displayMode}>
      {renderChild}
    </BaseThemeProvider>
  );
};
