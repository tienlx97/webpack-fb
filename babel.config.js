// babel.config.mjs (or .js with "type":"module" in package.json)
import styleXPlugin from '@stylexjs/babel-plugin';
import reactStrictPreset from 'react-strict-dom/babel-preset';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  const isDev = api.env('development');

  return {
    presets: [
      // gate this if you only want for web:
      [reactStrictPreset, { debug: true, dev: isDev, rootDir: __dirname }],
      ['@babel/preset-env'],
      ['@babel/preset-react', { development: isDev }],
    ],
    plugins: [
      ['babel-plugin-react-compiler', { target: '18' }],
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      [
        styleXPlugin,
        {
          // useCSSLayers: true,
          dev: process.env.NODE_ENV === 'development',
          test: process.env.NODE_ENV === 'test',
          runtimeInjection: false,
          treeshakeCompensation: true,
          unstable_moduleResolution: {
            type: 'commonJS',
            rootDir: __dirname,
          },
        },
      ],
      // ESM-safe: just pass the plugin string; no require.resolve
      isDev && 'react-refresh/babel',
    ].filter(Boolean),
  };
}
