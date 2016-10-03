var path = require('path');
var webpack = require('webpack');

var JSPATH = './src/main/webapp/scripts/';
var DISTPATH = './src/main/webapp/dist/';

module.exports = {
    entry: {
        vendor: JSPATH + "app/vendor.js",
        app:    JSPATH + "app/app.js"
    },
    global: true,
    resolve: {
        root: path.resolve(JSPATH + 'app/'),
        extensions: ['', '.js', '.json', '.ts'],
        alias: {
            libs:  path.resolve(JSPATH + 'libs')
        }
    },
    output: {
        path: path.resolve(DISTPATH),
        filename: "[name].js",
        publicPath: '/dist/'
    },
    plugins: [
        new webpack.ProvidePlugin({
            moment: "moment"
        })
    ],
    sassLoader: {
        includePaths: [
            path.resolve(__dirname, JSPATH + '/libs'),
            path.resolve(__dirname, JSPATH + '/app/layout/assets/scss'),
            path.resolve(__dirname, './node_modules')
        ]
    },
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.html$/,
                loaders: [
                    'html'
                ]
            },
            {
                test: /\.(css|scss|sass)$/,
                loaders: ["style", "css?sourceMap", "sass?sourceMap"]
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    'file?hash=sha512&digest=hex&name=[hash].[ext]'
                ]
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            },
            // required for bootstrap icons
            { test: /\.eot/, loader: 'url-loader?limit=100000&mimetype=application/vnd.ms-fontobject' },
            { test: /\.woff2/, loader: 'url-loader?limit=100000&mimetype=application/font-woff2' },
            { test: /\.woff/, loader: 'url-loader?limit=100000&mimetype=application/font-woff' },
            { test: /\.ttf/, loader: 'url-loader?limit=100000&mimetype=application/font-ttf' }
        ]
    },
    node: {
        net: 'empty'
    }
};
