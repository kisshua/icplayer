var supportedAddons = ["PseudoCode_Console"];

var entry = {};

supportedAddons.forEach(function (element) {
  entry[element] = "./addons/" + element + "/src_webpack/presenter.js";
});

var debug = false;
var webpack = require('webpack');
var path = require('path');



module.exports = {
  context: __dirname,
  devtool: debug ? "inline-sourcemap" : false,
  entry: entry,
  output: {
    path: __dirname,
    filename: "addons/[name]/src/presenter.js"
  },
  plugins: debug ? [] : [
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        use: 'babel-loader?presets[]=es2015'
      }
    ]
  }
};

