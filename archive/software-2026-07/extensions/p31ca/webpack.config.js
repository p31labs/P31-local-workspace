const path = require("path");

const extensionConfig = {
  target: "node",
  mode: "development",
  entry: "./src/extension.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
    serialport: "commonjs serialport",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: { transpileOnly: true },
          },
        ],
      },
    ],
  },
  optimization: { minimize: false },
};

const webviewConfig = {
  target: "web",
  mode: "development",
  entry: path.resolve(__dirname, "../../frontend/src/main.jsx"),
  output: {
    path: path.resolve(__dirname, "dist", "webview"),
    filename: "bundle.js",
    publicPath: "",
  },
  devtool: "source-map",
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    // 1. Force Webpack to always look in the extension's node_modules first,
    // solving the "Module not found" errors for external npm packages.
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"],
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      vm: require.resolve("vm-browserify"),
    },
    // Aliases for internal paths can remain.
    alias: {
      constants: path.resolve(__dirname, "../../frontend/src/constants"),
      protocol: path.resolve(__dirname, "../../frontend/src/protocol"),
      useSync: path.resolve(__dirname, "../../frontend/src/hooks/useSync"),
      "mesh-client": path.resolve(
        __dirname,
        "../../frontend/src/api/mesh-client",
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx|mjs)$/,
        exclude: /node_modules/,
        // 2. Disable strict ESM import requirements (fixes the BREAKING CHANGE error)
        resolve: {
          fullySpecified: false,
        },
        use: {
          loader: "babel-loader",
          options: {
            // 3. Force Babel to use THESE exact settings, ignoring any
            // stray .babelrc files hiding in the ../../frontend directory.
            babelrc: false,
            configFile: false,
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
              [
                "@babel/preset-typescript",
                { isTSX: true, allExtensions: true },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};

module.exports = [extensionConfig, webviewConfig];
