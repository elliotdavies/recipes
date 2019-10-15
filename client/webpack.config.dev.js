const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",

  entry: "./src/main.js",

  devServer: {
    inline: true,
    hot: true,
    open: true,
    port: 8080,
    stats: "minimal"
  },

  devtool: "cheap-module-inline-source-map",

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
    new HtmlWebpackPlugin({
      template: "index.html",
      templateParameters: {
        apiUrl: "http://localhost:8000"
      }
    })
  ]
};
