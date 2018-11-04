var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
let autoprefixer = require('gulp-autoprefixer');
let resizer = require('gulp-images-resizer');
const webp = require('gulp-webp');
var concat = require('gulp-concat');

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
gulp.task('main-scripts', function() {
    return gulp.src(['js/register-worker.js', 'js/dbhelper.js', 'js/main.js'])
        .pipe(babel({ compact:true }))
        .pipe(concat('index.min.js'))
        .pipe(gulp.dest('js/min'))
});

// Global JS - Concatenate, babel, minify, and rename
gulp.task('res-scripts', function() {
    return gulp.src(['js/register-worker.js', 'js/dbhelper.js', 'js/restaurant_info.js'])
        .pipe(babel({ compact:true, minified:true, comments:false }))
        .pipe(concat('res.min.js'))
        .pipe(gulp.dest('js/min'))
});

// Images - Resize
gulp.task('images', function() {
    return gulp.src('img/*')
        .pipe(resizer({
            format: "jpg",
            width: "50%"
        }))
    .pipe(webp())
    .pipe(gulp.dest('img/min'));
});


gulp.task('default', ['css-min', 'main-scripts', 'res-scripts', 'images'], function() { });