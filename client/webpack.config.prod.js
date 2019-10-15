const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const path = require("path");

module.exports = {
  mode: "production",

  entry: "./src/main.js",

  devtool: "none",

  output: {
    filename: "[contenthash].[name].js",
    pathinfo: false
  },

  stats: {
    children: false,
    modules: false
  },

  optimization: {
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})]
  },

  module: {
    rules: [
      {
        test: /\.(html|svelte)$/,
        exclude: [/index.html/],
        use: {
          loader: "svelte-loader",
          options: {
            emitCss: true
          }
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "index.html",
      templateParameters: {
        apiUrl: "%%API_URL%%"
      },
      favicon: "assets/favicon.png"
    }),
    new MiniCssExtractPlugin({
      filename: "[contenthash].[name].css"
    })
  ]
};
