const { DefinePlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const config = {
  apiUrl: "http://localhost:8000"
};

module.exports = {
  mode: "development",

  entry: "./src/main.js",

  devServer: {
    inline: true,
    hot: true,
    open: true,
    port: 8080,
    stats: "minimal",

    historyApiFallback: {
      disableDotRule: true,
      rewrites: [{ from: /^[^.]*$/, to: "/index.html" }]
    }
  },

  devtool: "cheap-module-inline-source-map",

  output: {
    publicPath: "/"
  },

  module: {
    rules: [
      {
        test: /\.(html|svelte)$/,
        exclude: [/index.html/],
        use: {
          loader: "svelte-loader"
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },

  plugins: [
    new DefinePlugin({
      __API_URL__: JSON.stringify(config.apiUrl)
    }),

    new HtmlWebpackPlugin({
      template: "index.html",
      templateParameters: {
        apiUrl: config.apiUrl
      }
    })
  ]
};
