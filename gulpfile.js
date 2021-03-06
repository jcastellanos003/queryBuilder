/* jshint camelcase: false */
'use strict';

var gulp = require('gulp'),
    prefix = require('gulp-autoprefixer'),
    ngConstant = require('gulp-ng-constant-fork'),
    jshint = require('gulp-jshint'),
    proxy = require('proxy-middleware'),
    es = require('event-stream'),
    flatten = require('gulp-flatten'),
    del = require('del'),
    url = require('url'),
    fs = require('fs'),
    runSequence = require('run-sequence'),
    protractor = require("gulp-protractor").protractor,
    args   = require('yargs').argv,
    sass = require('gulp-sass'),
    sourceMaps = require('gulp-sourcemaps'),
    inject = require('gulp-inject'),
    exec = require('child_process').exec,
    injectString = require('gulp-inject-string'),
    rename =  require('gulp-rename'),
    webpack = require('gulp-webpack'),
    tsc = require('gulp-typescript'),
    tslint = require('gulp-tslint'),
    browserSync = require('browser-sync'),
    superstatic = require('superstatic');

var Server = require('karma').Server;

var yeoman = {
    app: 'src/main/webapp/',
    dist: 'src/main/webapp/dist/',
    test: 'src/test/javascript/spec/',
    tmp: '.tmp/',
    port: 9000,
    apiPort: 13160,
    liveReloadPort: 35729
};

var tsConfig = {
    files: yeoman.app + 'scripts/app/**/*.ts',
    typings: 'typings/**/*.d.ts',
    srcDist: yeoman.app + 'scripts/app/',
    specSrc: yeoman.test + '**/*.ts',
    specDist: yeoman.test + 'app/typeScript'
};

var parsedSVNRevision = getRevisionFromEnv();
/**
 * Usage:
 * run gulp build --production to obtain the optimized production version.
 */
gulp.task('build', ['ngconstant'], function () {
    if(args.production || args.profile == "prod") {
        runSequence('clean','webpack:prod');
    }  else {
        runSequence('clean', 'webpack:dev');
    }

});

/** Run test once and exit **/

gulp.task('test', function (done) {
    runSequence('compile-ts','compile-specs-ts', 'runKarma');
});

gulp.task('runKarma', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('debugTest', function (done) {
    runSequence('compile-ts','compile-specs-ts','debugKarma');
});
gulp.task('debugKarma', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: false,
        autoWatch: true
    }, done).start();
});

gulp.task('clean', function (cb) {
    del([yeoman.dist], cb);
});

gulp.task('clean:tmp', function (cb) {
    del([yeoman.tmp], cb);
});

//------------------------------------------------------
// UI Build
//------------------------------------------------------
gulp.task('build:ui', ['sass:dev']);

//------------------------------------------------------------------------
// Finish UI Tasks
//------------------------------------------------------------------------
gulp.task('getRevision', function (cb) {
    if(!parsedSVNRevision){
        return exec('svn info', parseFromSVNfunc(cb));
    }else{
        cb();
    }
});

gulp.task('ngconstant', ['getRevision'], function () {
    var profile = args.profile || 'UNK.';
    parsedSVNRevision = parsedSVNRevision || "UNK.";
    return ngConstant({
        dest: 'app.constants.js',
        name: 'cmswebclientApp',
        deps: false,
        noFile: true,
        interpolate: /\{%=(.+?)%\}/g,
        wrap: '/* jshint quotmark: false */\n"use strict";\n// DO NOT EDIT THIS FILE, EDIT THE GULP TASK NGCONSTANT SETTINGS INSTEAD WHICH GENERATES THIS FILE\n{%= __ngModule %}',
        constants: {
            REVISION: parsedSVNRevision,
            ENV: profile,
            VERSION: parseVersionFromBuildGradle()
        }
    }).pipe(gulp.dest(yeoman.app + 'scripts/app/'));
});

gulp.task('jshint', function () {
    return gulp.src(['gulpfile.js', yeoman.app + 'scripts/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', function () {
    runSequence('test', 'build');
});

gulp.task('compile-ts', function() {
     var tsProject = tsc.createProject(__dirname + '/tsconfig.json');
    var tsResult = gulp.src([tsConfig.files, tsConfig.typings])
                       .pipe(sourceMaps.init())
                       .pipe(tsc(tsProject));

    return tsResult.js
                   .pipe(sourceMaps.write('.'))
                   .pipe(gulp.dest(tsConfig.srcDist));
});

gulp.task('compile-specs-ts', ['clean-spec-ts'], function() {
     var tsProject = tsc.createProject(__dirname + '/tsconfig.json');
     var tsResult = gulp.src([tsConfig.specSrc, tsConfig.typings])
                       .pipe(sourceMaps.init())
                       .pipe(tsc(tsProject));

    return tsResult.js
                   .pipe(sourceMaps.write('.'))
                   .pipe(gulp.dest(tsConfig.specDist));
});

gulp.task('clean-spec-ts', function (cb) {
  var typeScriptGenFiles = [
                              tsConfig.specDist + '/**/*.js',
                              tsConfig.specDist + '/**/*.js.map',
                           ];

  // delete the files
  del(typeScriptGenFiles, cb);
});

gulp.task('serve', ['build'], function() {
    //gulp.watch([tsConfig.files, yeoman.app + 'scripts/app/**/*.js'], function(){});

    browserSync({
        port: 3000,
        file: ['index.html', '**/*.js'],
        injectChanges: true,
        logFileChanges: false,
        logLevel: 'silent',
        notify: true,
        reloadDelay: 0,
        proxy: {
            target: 'localhost:13160',
            middleware: superstatic({debug: false})
        }
    });
});

// ===============
// Webpack TASKS
// ===============

//Creating a single instance for dev to allow caching
var webpackDevConfig = Object.create(require('./webpack.config.js'));
webpackDevConfig.debug = true;
webpackDevConfig.devtool = "source-map";
webpackDevConfig.cache = true;

//Development build
gulp.task("webpack:dev", ['compile-ts'], function(callback) {
    console.info("Webpack building DEV bundle...");
    gulp.src('')
        .pipe(webpack(webpackDevConfig))
        .pipe(gulp.dest(webpackDevConfig.output.path));
});

gulp.task('defaultCompile', function() {
    gulp.watch(tsConfig.files, ['compile-ts']);
});

gulp.task('defaultTestCompile', function() {
    gulp.watch(tsConfig.specSrc, ['compile-specs-ts']);
});

/**
 * Usage:
 * Use webpack:watch --reload to to enable live reload with file watching.
 *
 * ##For Debugging in IntelliJ:
 * 1) Go to "Run" -> "Edit Configurations..."
 * 2) Add a new run config (By clicking on +), look out for "JavaScript Debug"
 * 3) You will see a window to setup the "Javascript Debug config":
 *    on URL Use: http://localhost:13160/
 *    After doing that you will see in the box bellow a list of files appear with two columns:
 *    File/Directory  |  Remote URL
 *    Choose the folder that is the root of your project and double click on the column "Remote URL":
 *    webpack:///.
 * 4) After that you can do your Debugging in intelliJ as usual using the "Javascript Debug" config you just created.
 *
 *
 *
 * **/
gulp.task("webpack:watch", function(callback) {

    webpackDevConfig.watch = true;

    if(args.reload) {
        var LiveReloadPlugin = require('webpack-livereload-plugin');
        webpackDevConfig.plugins = webpackDevConfig.plugins.concat(
            new LiveReloadPlugin({appendScriptTag: true})
        );
    }

    gulp.src('src/main/webapp/**/*.js')
        .pipe(webpack(webpackDevConfig))
        .pipe(gulp.dest(webpackDevConfig.output.path));

});

//Production build
gulp.task("webpack:prod", function(callback) {
    var prodConfig = Object.create(require('./webpack.config.js'));
    var wp = require('webpack');

    //Adding optimization plugins
    prodConfig.plugins = prodConfig.plugins.concat(
        new wp.DefinePlugin({
            "process.env": {
                "NODE_ENV": JSON.stringify("production")
            }
        }),
        new wp.optimize.DedupePlugin(),
        new wp.optimize.UglifyJsPlugin()
    );

    gulp.src('')
        .pipe(webpack(prodConfig))
        .pipe(gulp.dest(prodConfig.output.path));

});

// ===============
// END: Webpack TASKS
// ===============

// ===============
// PROTRACTOR TASKS
// ===============f

var seleniumServerJar = null;
var seleniumArgs = null;
var chromeDriver = null;

gulp.task('getSelenium', function(cb){
    exec('node ./node_modules/selenium-standalone/bin/selenium-standalone install --version=2.45.0', function (err, stdout, stderr) {
        if (err){return cb(err);}
        else{
            var seleniumServerVersionRegex = /([0-9.]+)-server.jar/;
            var chromDriverVersionRegex = /([0-9.\-a-z]+)-chromedriver/;
            var ieDriverVersionRegex = /([0-9.\-a-z]+)-IEDriverServer.exe/;
            var seleniumServerVersion = seleniumServerVersionRegex.exec(stdout)[1];
            var chromeDriverVersion = chromDriverVersionRegex.exec(stdout)[1];
            var chromeDriverPath = chromDriverVersionRegex.exec(stdout)[1];
            var ieDriverVersion = ieDriverVersionRegex.exec(stdout)[1];
            var ieDriverPath = "./node_modules/selenium-standalone/.selenium/iedriver/" + ieDriverVersion + "-IEDriverServer.exe"
            var chromeDriverPath = "./node_modules/selenium-standalone/.selenium/chromedriver/" + chromeDriverVersion + "-chromedriver"

            seleniumServerJar = "seleniumServerJar: './../../../node_modules/selenium-standalone/.selenium/selenium-server/" + seleniumServerVersion + "-server.jar',"
            seleniumArgs = "seleniumArgs: ['-Dwebdriver.ie.driver=" + ieDriverPath + "', '-Dwebdriver.chrome.driver=" + chromeDriverPath + "'],"
            chromeDriver = "chromeDriver: '" + chromeDriverPath + "',"
            cb();
        }
    });
});

gulp.task('setupProtractor', ['getSelenium'], function(){
    var baseUrl = args['baseUrl'] || 'http://127.0.0.1:13160';
    return gulp.src("src/test/javascript/protractor.config.js.template")
        .pipe(injectString.after('// seleniumConfig', '\n' + seleniumServerJar + '\n'))
        .pipe(injectString.after('// seleniumConfig', '\n' + seleniumArgs + '\n'))
        .pipe(injectString.after('// seleniumConfig', '\n' + chromeDriver + '\n'))
        .pipe(injectString.before('//baseUrl', "'" + baseUrl + "';"))
        .pipe(rename("protractor.config.js"))
        .pipe(gulp.dest("src/test/javascript/"));
});

gulp.task('protractor', ['setupProtractor'], function(){
    return gulp.src(["./src/tests/javascript/e2e/**/*.js"])
        .pipe(protractor({
            configFile: "src/test/javascript/protractor.config.js",
        }))
        .on('error', function(e) { throw e })
});

// ====================
// END PROTRACTOR TASKS
// ====================


var endsWith = function (str, suffix) {
    return str.indexOf('/', str.length - suffix.length) !== -1;
};
// Returns the second occurrence of the version number
var parseVersionFromBuildGradle = function () {
    var versionRegex = /^version\s*=\s*[',"]([^',"]*)[',"]/gm; // Match and group the version number
    var buildGradle = fs.readFileSync('build.gradle', 'utf8');
    return versionRegex.exec(buildGradle)[1];
};
function parseFromSVNfunc(cb){
    return function parseFromSVN(err, stdout, stderr) {
        if(err){
            parsedSVNRevision = "";
            cb();
        }else{
            var revRegexp = /Revision: (\d+)/;
            parsedSVNRevision = stdout.match(revRegexp)[1];
            cb(err);
        }
    }
}
function getRevisionFromEnv(){
    return process.env.SVN_REVISION || "";
}
