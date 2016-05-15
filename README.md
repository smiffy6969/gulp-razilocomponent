# raziloComponent Gulp Compile Tool


Compiles the data from a raziloComponent into compatible content for babel, sass and vulcanize to compile.


## Dev Build Example


```javascript
gulp.task('build', function() {
	gulp.src('./src/components/test/app-test.razilo.html')
		.pipe(razilo('script'))
		.pipe(browserify({transform: ['babelify']}))
		.on('error', function(err) { console.log(err); util.beep(); this.emit('end'); })
		.pipe(rename('distributable.js'))
		.pipe(gulp.dest('./src/components/test/'));

	gulp.src('./src/components/test/app-test.razilo.html')
		.pipe(razilo('style'))
		.pipe(sass({errLogToConsole: true, outputStyle: 'expanded'}).on('error', sass.logError))
		.pipe(rename('distributable.css'))
		.pipe(gulp.dest('./src/components/test/'));

	gulp.src('./src/components/test/app-test.razilo.html')
		.pipe(razilo('template'))
		.pipe(vulcanize())
		.pipe(rename('distributable.html'))
		.pipe(gulp.dest('./src/components/test/'));
});
```

## Deploy Build Example

```javascript
gulp.task('deploy', function() {
	gulp.src('./src/index.razilo.html')
		.pipe(razilo('script'))
		.pipe(browserify({transform: ['babelify']}))
		.pipe(rename('distributable.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./deploy/'));

	gulp.src('./src/index.razilo.html')
		.pipe(razilo('style'))
		.pipe(sourcemaps.init())
		.pipe(sass({errLogToConsole: true, outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(rename('distributable.min.css'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("./deploy/"));

	gulp.src('./src/index.razilo.html')
		.pipe(razilo('template'))
		.pipe(vulcanize())
		.pipe(rename('distributable.min.html'))
		.pipe(gulp.dest('./deploy/'));
});
```

## Watch Example


```javascript
gulp.task('watch', ['build'], function() {
	gulp.watch([
		'./src/**/*.razilo.html'
	], ['build']);
});
```
