const { DefinePlugin } = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const path = require("path");

const config = {
  apiUrl: "//api.recipes.elliotdavies.co.uk",
  googleClientId: "903217229000-ughnh1ecf7vr73qdbsu1imbiq7hn5mjk.apps.googleusercontent.com",
};

module.exports = {
  mode: "production",

  entry: "./src/main.js",

  devtool: "none",

  output: {
    publicPath: "/",
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

    new DefinePlugin({
      __API_URL__: JSON.stringify(config.apiUrl)
    }),

    new HtmlWebpackPlugin({
      template: "index.html",
      templateParameters: {
        apiUrl: config.apiUrl,
        googleClientId: config.googleClientId,
      },
      favicon: "assets/favicon.png"
    }),

    new MiniCssExtractPlugin({
      filename: "[contenthash].[name].css"
    })
  ]
};
