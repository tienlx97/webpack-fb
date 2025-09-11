import React, { useContext, useMemo } from 'react';

import { BaseThemeConfigContext } from '@fb-contexts/BaseThemeConfigContext';
import { BaseThemeDisplayModeContext } from '@fb-contexts/BaseThemeDisplayModeContext';

import { useCurrentDisplayMode } from './useCurrentDisplayMode';

/**
 * @typedef {{ type: 'VARIABLES', dark: Record<string,string|number>, light: Record<string,string|number> } |
 *           { type: 'CLASSNAMES', dark: string, light: string }} ThemeConfig
 */

/**
 * @param {{
 *   children: (classObj: { $$css: true, theme: string } | null, cssVars: Record<string, string | number>) => React.ReactNode,
 *   config?: ThemeConfig,
 *   displayMode?: 'dark' | 'light'
 * }} props
 */
function BaseThemeProvider({ children, config, displayMode }) {
  const baseThemeConfig = useContext(BaseThemeConfigContext);

  const currentDisplayMode = useCurrentDisplayMode();
  const _currentDisplayMode = displayMode ?? currentDisplayMode;

  const themeClassObject = useMemo(() => {
    let themeClass;

    if (config && config.type === 'CLASSNAMES') {
      themeClass = _currentDisplayMode === 'dark' ? config.dark : config.light;
    } else {
      themeClass = _currentDisplayMode === 'dark' ? baseThemeConfig.darkClassName : baseThemeConfig.lightClassName;
    }

    return themeClass
      ? {
          $$css: !0,
          theme: themeClass,
        }
      : null;
  }, [config, baseThemeConfig.darkClassName, baseThemeConfig.lightClassName, _currentDisplayMode]);

  // Compute the theme configuration value for the context
  const themeConfigValue = useMemo(() => {
    if (!config) {
      return baseThemeConfig;
    }

    if (config.type === 'VARIABLES') {
      return {
        ...baseThemeConfig,
        darkVariables: {
          ...baseThemeConfig.darkVariables,
          ...config.dark,
        },
        lightVariables: {
          ...baseThemeConfig.lightVariables,
          ...config.light,
        },
      };
    }

    if (config.type === 'CLASSNAMES') {
      return {
        ...baseThemeConfig,
        darkClassName: config.dark,
        lightClassName: config.light,
      };
    }

    return baseThemeConfig;
  }, [config, baseThemeConfig]);

  // Convert theme variables to CSS variables
  const themeVariables = useMemo(() => {
    const variables = _currentDisplayMode === 'dark' ? themeConfigValue.darkVariables : themeConfigValue.lightVariables;

    return convertToCssVariables(variables);
  }, [_currentDisplayMode, themeConfigValue]);

  return (
    <BaseThemeConfigContext.Provider value={themeConfigValue}>
      <BaseThemeDisplayModeContext.Provider value={_currentDisplayMode}>
        {children(themeClassObject, themeVariables)}
      </BaseThemeDisplayModeContext.Provider>
    </BaseThemeConfigContext.Provider>
  );
}

// Helper function to convert theme variables into CSS variables
function convertToCssVariables(variables) {
  const cssVariables = {};
  Object.keys(variables).forEach((key) => {
    cssVariables[`--${key}`] = variables[key];
  });
  return cssVariables;
}

export { BaseThemeProvider };
