var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var babel = require('gulp-babel');

gulp.task('css-min', function () {
	gulp.src('css/*.css')
		.pipe(cssmin())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('css/min'));
});

// Global JS - Concatenate, babel, minify, and rename
gulp.task('handle-scripts', function() {
    return gulp.src('js/*.js')
        .pipe(babel({ compact:true }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('js/min'))
});


gulp.task('default', ['css-min', 'handle-scripts'], function() { });