import path from 'path';
import { fileURLToPath } from 'url';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import StylexPlugin from '@stylexjs/webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import dotenv from 'dotenv';
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

      new StylexPlugin({
        filename: 'styles.[contenthash].css',
        dev: mode === 'development',
        runtimeInjection: false,
        classNamePrefix: 'x',
        unstable_moduleResolution: {
          type: 'commonJS',
          rootDir: __dirname,
        },
        useCSSLayers: true,
        babelConfig: { plugins: ['@babel/plugin-transform-private-methods'] },
      }),

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
