# raziloComponent Gulp Compile Tool


Turn your raziloComponent application/components into 3 distributable files for templates, style and script.


## What is This For?


This gulp module will allow you to use gulp to compile your raziloComponent application, plus all dependencies into 3 files to be included in main HTML file. It takes raziloComponent files (which are very close to native web components),
and bundles them along with raziloComponent and raziloBind into 3 simple distributable files (build for dev builds, deploy for minified builds), these can be used as so. Note: we have polyfills loaded that we rely on too.


```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<!-- <title>raziloComponent Application Demo</title> -->
		<title>Test</title>

		<!-- Polyfill native API's if missing -->
		<script type="text/javascript" src="node_modules/webcomponentsjs/lite.js"></script>
		<script type="text/javascript" src="node_modules/promise-polyfill/promise.min.js"></script>
		<script type="text/javascript" src="node_modules/proxy-oo-polyfill/proxy-oo-polyfill.js"></script>

		<!-- Import Distributable Template, Style and Logic -->
		<link type="text/razilo" rel="import" href="./build/distributable.html">
		<link type="text/css" rel="stylesheet" href="./build/distributable.css">
		<script type="text/javascript" src="./build/distributable.js"></script>
	</head>
    <body>
		<my-app></my-app>
    </body>
</html>
```


## How Do I Install It?


You install it using npm. From your project root...


```bash
npm install gulp-razilocomponent
```


If you have an issue with gulp command not being available, you need to ensure you have gulp installed globally too (as well as locally for each project root)


## How Do I Use It?


You need to first create a gulpfile.js in your project root, you can use this module in any way you see fit with gulp, but to get you going, I have included a typical gulp file below.

This gulp file has a build for dev building, a deploy for production minified building and a watcher to do live building on file changes. You will need to install all dependencies to use this gulp file as is. They have
not been included in the package dependencies as your gulp file is up to you.

razilocomponent-gulp package must be the second step, after the first step which is to set your source. When then compile the razilo components before passing it on to the next step.

The main thing here is to ntoice that there are three commands to send into razilocomponent-gulp, these tell the tool which 'thing' we are building, as we will always build 3 seperate distributable files.

1) 'script' - build distributable js from all ES6 component scripts
2) 'style' - build distributable css from all scss component styles
3) 'template' - build distributable html from all html component templates


### add imports first

```javascript
var gulp = require('gulp');
var rename = require("gulp-rename");
var browserify = require('gulp-browserify');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var vulcanize = require('gulp-vulcanize');
var watch = require('gulp-watch');
var util = require('gulp-util');
var razilo = require('gulp-razilocomponent');

/**************************************************/
/* Build into distributable, development versions */
/**************************************************/

gulp.task('build', ['build-script', 'build-style', 'build-template']);

gulp.task('build-script', function() {
	gulp.src('./src/my-app.razilo.html')
		.pipe(razilo('script'))
		.pipe(browserify({transform: ['babelify']}))
		.on('error', function(err) { console.log(err); util.beep(); this.emit('end'); })
		.pipe(rename('distributable.js'))
		.pipe(gulp.dest('./build/'));
});

gulp.task('build-style', function() {
	gulp.src('./src/my-app.razilo.html')
		.pipe(razilo('style'))
		.pipe(sass({errLogToConsole: true, outputStyle: 'expanded'}).on('error', sass.logError))
		.pipe(rename('distributable.css'))
		.pipe(gulp.dest("./build/"));
});

gulp.task('build-template', function() {
	gulp.src('./src/my-app.razilo.html')
		.pipe(razilo('template'))
		.pipe(vulcanize())
		.pipe(rename('distributable.html'))
		.pipe(gulp.dest('./build/'));
});

/********************************************/
/* Build then Watch for changes and rebuild */
/********************************************/

gulp.task('watch', ['build'], function() {
	gulp.watch([
		'./src/**/*.html'
	], ['build-script', 'build-style', 'build-template']);
});

/*****************************************/
/* Deploy into compreseed distributables */
/*****************************************/

gulp.task('deploy', function() {
	gulp.src('./src/my-app.razilo.html')
		.pipe(razilo('script'))
		.pipe(browserify({transform: ['babelify']}))
		.pipe(rename('distributable.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./deploy/'));

	gulp.src('./src/my-app.razilo.html')
		.pipe(razilo('style'))
		.pipe(sourcemaps.init())
		.pipe(sass({errLogToConsole: true, outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(rename('distributable.min.css'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("./deploy/"));

	gulp.src('./src/my-app.razilo.html')
		.pipe(razilo('template'))
		.pipe(vulcanize())
		.pipe(rename('distributable.min.html'))
		.pipe(gulp.dest('./deploy/'));
});
```


## What Happens Next?


Well your distributables will be created, choose to use build for developing (with watch to build on change) and deploy for production.


At present there is no source map for JS compile errors from babel, gulp babelify is no longer maintained so a move to babelify raw will happen, at such time we will introduce error catching
for babel with the same razilocomponent-gulp module. This will allow us to relate build errors to actual component files. Until then, make do ;)
