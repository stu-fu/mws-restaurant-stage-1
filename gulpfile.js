var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
let autoprefixer = require('gulp-autoprefixer');
let resizer = require('gulp-images-resizer');

// CSS - Minify
gulp.task('css-min', function () {
	gulp.src('css/*.css')
		.pipe(cssmin())
        .pipe(autoprefixer({
            browsers: ['last 8 versions'],
            cascade: false
        }))
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

// Images - Resize
gulp.task('images', function() {
    return gulp.src('img/*')
        .pipe(resizer({
            format: "jpg",
            width: "50%"
        }))
    .pipe(gulp.dest('img/min'));
});


gulp.task('default', ['css-min', 'handle-scripts', 'images'], function() { });