const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: "development",
  devtool: 'cheap-module-source-map',
  entry: './src/demo/index.tsx',
  output: {
    filename: 'index.js'
  },
  optimization: {
    minimize: false,
  },
  devServer: {
    open: true,
    hot: true,
    host: "localhost",
    port: 9000,
    historyApiFallback: true    
  },
  module: {
    rules: [
      {
        test: /\.(m|j)s$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ["ts-loader"],
     },      
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: "css-loader", options: { sourceMap: true } },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/,
        use: ['url-loader'],
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      }      
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/index.css'
    }),
    new HtmlWebpackPlugin({template: "./src/demo/index.html"}),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json']
  }
};