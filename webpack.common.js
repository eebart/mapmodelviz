const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

const extractPlugin = new ExtractTextPlugin({ filename: '[name].css' });

module.exports = {
  entry: {
    app: './src/index.js'
  },
  module: {
    rules: [
      { /* Javascript Babel */
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }]
      },
      { /* HTML */
        test: /\.(html)$/,
        use: {
          loader: 'html-loader',
          options: {
            attrs: [':data-src']
          }
        }
      },
      { /* SASS */
        test: /\.scss$/,
        include: [path.resolve(__dirname, 'src', 'style')],
        use: extractPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ],
          fallback: 'style-loader'
        })
      },
    ]
  },
  resolve: {
    alias: {
      configsrc$: path.resolve(__dirname, './src/config.js')
    }
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'GeoSpatial Model Visualization',
      template: 'src/index.html'
    }),
    new webpack.ProvidePlugin({
     $: "jquery",
     jQuery: "jquery",
     Popper: ['popper.js', 'default'],
     config: ['configsrc', 'default']
   }),
   extractPlugin,
   new CopyWebpackPlugin([
      { from: './src/assets/', to: 'assets/' }
    ], {}),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
};
