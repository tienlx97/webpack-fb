import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import dotenv from 'dotenv';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

export default (env, { mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = !isProduction;

  return {
    mode,
    target: 'web',
    entry: path.join(__dirname, 'src', 'index.jsx'),

    resolve: {
      extensions: fileExtensions.map((ext) => '.' + ext).concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
      alias: {
        // add your aliases here if needed, e.g. '@': path.resolve(__dirname, 'src'),
        '@fb-utils': path.resolve(__dirname, 'src/utils'),
        '@fb-contexts': path.resolve(__dirname, 'src/contexts'),
        '@fb-error': path.resolve(__dirname, 'src/error'),
        '@fb-placeholder': path.resolve(__dirname, 'src/placeholder'),
        '@fb-hooks': path.resolve(__dirname, 'src/hooks'),
        '@fb-layout': path.resolve(__dirname, 'src/layout'),
        '@fb-text': path.resolve(__dirname, 'src/text'),
        '@fb-theme': path.resolve(__dirname, 'src/theme'),
        '@fb-keyboard': path.resolve(__dirname, 'src/keyboard'),
        '@fb-dump': path.resolve(__dirname, 'src/dump'),
        '@fb-platform': path.resolve(__dirname, 'src/platform'),
        '@fb-image': path.resolve(__dirname, 'src/image'),
        '@fb-toast': path.resolve(__dirname, 'src/toast'),
        '@fb-icons': path.resolve(__dirname, 'src/icons'),
        '@fb-event-interaction': path.resolve(__dirname, 'src/event-interaction'),
        '@fb-focus': path.resolve(__dirname, 'src/focus'),
        '@fb-pressable': path.resolve(__dirname, 'src/pressable'),
        '@fb-link': path.resolve(__dirname, 'src/link'),
        '@fb-button': path.resolve(__dirname, 'src/button'),
        '@fb-network': path.resolve(__dirname, 'src/network'),
        '@fb-dialog': path.resolve(__dirname, 'src/dialog'),
        '@fb-glimmer': path.resolve(__dirname, 'src/glimmer'),
        '@fb-process-ring': path.resolve(__dirname, 'src/process-ring'),
        '@fb-input': path.resolve(__dirname, 'src/input'),
        '@fb-card': path.resolve(__dirname, 'src/card'),
        '@fb-collapse': path.resolve(__dirname, 'src/collapse'),
        '@fb-switch': path.resolve(__dirname, 'src/switch'),
        '@fb-pivot-link': path.resolve(__dirname, 'src/pivot-link'),
        '@fb-badge': path.resolve(__dirname, 'src/badge'),
        '@fb-contextual': path.resolve(__dirname, 'src/contextual'),
        '@fb-constants': path.resolve(__dirname, 'src/constants'),
        '@fb-cell': path.resolve(__dirname, 'src/cell'),
        '@fb-view': path.resolve(__dirname, 'src/view'),
        '@fb-menu': path.resolve(__dirname, 'src/menu'),
        '@fb-tooltip': path.resolve(__dirname, 'src/tooltip'),
        '@FB-COMPONENT': path.resolve(__dirname, 'src/FB-COMPONENT'),
        '@FB-CONTEXTS': path.resolve(__dirname, 'src/FB-CONTEXTS'),
        '@fb-list': path.resolve(__dirname, 'src/list'),
        '@fb-relay': path.resolve(__dirname, 'src/relay'),
        '@fb-lazy-load': path.resolve(__dirname, 'src/lazy-load'),
        '@fb-callout': path.resolve(__dirname, 'src/callout'),
        '@fb-graphql': path.resolve(__dirname, 'src/__GRAPHQL__'),
        '@fb-accordion': path.resolve(__dirname, 'src/accordion'),
        '@fb-form': path.resolve(__dirname, 'src/form'),
        '@fb-unit': path.resolve(__dirname, 'src/unit'),
        '@fb-slider': path.resolve(__dirname, 'src/slider'),
        '@fb-audio': path.resolve(__dirname, 'src/audio'),
        '@fb-sticker': path.resolve(__dirname, 'src/sticker'),
      },
      fallback: {
        path: 'path-browserify',
        fs: false,
        os: 'os-browserify/browser',
        crypto: 'crypto-browserify',
        buffer: 'buffer/',
        stream: 'stream-browserify',
      },
    },

    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'js/[name].[contenthash].js',
      chunkFilename: 'js/[name].[contenthash].js',
      assetModuleFilename: 'assets/[hash][ext][query]',
      publicPath: '/',
    },

    module: {
      rules: [
        {
          test: /\.?(js|jsx)$/,
          exclude: /node_modules/,
          use: [
            { loader: 'source-map-loader' },
            {
              loader: 'babel-loader',
              options: { configFile: path.join(__dirname, 'babel.config.js') },
            },
          ],
        },
        {
          test: /\.(ts|tsx)?$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[name]__[local]__[hash:base64:5]',
                },
                sourceMap: isDevelopment,
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: { plugins: ['postcss-preset-env'] },
              },
            },
          ],
        },
        { test: /\.(woff|woff2|eot|ttf|otf)$/i, type: 'asset/resource' },
        {
          test: /\.(png|jp(e*)g|gif|webp|avif)$/,
          use: {
            loader: 'file-loader',
            options: { name: 'images/[name].[ext]' },
          },
        },
        {
          test: /\.svg$/,
          use: [{ loader: '@svgr/webpack', options: { native: false } }],
        },
      ],
    },

    cache: true,

    plugins: [
      new MiniCssExtractPlugin({ filename: 'styles/[name].[contenthash].css' }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'public', 'index.html'),
        inject: true,
        minify: isProduction,
      }),
      new CleanWebpackPlugin({ verbose: false }),

      new webpack.ProgressPlugin(),
      new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(mode) }),

      new CopyPlugin({ patterns: [{ from: './src/assets', to: '' }] }),

      isDevelopment && new ReactRefreshWebpackPlugin(),

      ...(env?.analyze
        ? [
            new BundleAnalyzerPlugin({
              analyzerHost: 'localhost',
              analyzerPort: 3006,
              reportTitle: 'Template - Analyze Bundle Sizes',
            }),
          ]
        : []),
    ].filter(Boolean),

    optimization: {
      minimize: isProduction,
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: -10,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: { compress: { drop_console: isProduction } },
        }),
      ],
    },

    performance: {
      maxEntrypointSize: Infinity,
      maxAssetSize: 1024 ** 2,
    },

    devtool: isProduction ? 'source-map' : 'inline-source-map',

    devServer: {
      devMiddleware: {
        publicPath: `http://localhost:${process.env.PORT || 4000}/`,
        writeToDisk: true,
      },
      port: process.env.PORT || 4000,
      hot: true,
      historyApiFallback: true,
      static: { directory: path.resolve(__dirname, 'build') },
      headers: { 'Access-Control-Allow-Origin': '*' },
    },

    stats: { errorDetails: true },
  };
};
