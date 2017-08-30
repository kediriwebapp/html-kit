var $           = require('gulp-load-plugins')();
var gulp        = require('gulp');
var panini      = require('panini');
var browser     = require('browser-sync');
var rimraf      = require('rimraf');
var sequence    = require('run-sequence');
var pump        = require('pump');

var PORT = 8080;

var PATHS = {
    assets: [
        'src/assets/**/*',
        '!src/assets/{!images,js,scss}/**/*'
    ],
    sass: [
        'bower_components/font-awesome/scss'
    ],
    fonts: [
        'bower_components/font-awesome/fonts/**/*'
    ],
    javascript: [
        'bower_components/jquery/dist/jquery.slim.min.js',
        'bower_components/popper.js/dist/umd/popper.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'src/assets/js/**/*.js'
    ]
}

gulp.task('clean', (done) => {
    rimraf('dist', done);
})

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
gulp.task('copy:fonts', () => {
    gulp.src(PATHS.fonts)
        .pipe(gulp.dest('dist/assets/fonts'))
})

gulp.task('pages:reset', (cb) => {
    panini.refresh();
    gulp.run('pages');
    cb();
})

gulp.task('pages', () => {
    gulp.src('src/pages/**/*.html')
        .pipe(panini({
            root: 'src/pages/',
            layouts: 'src/layouts/',
            partials: 'src/partials/',
            helpers: 'src/helpers/',
            data: 'src/data/'
        }))
        .pipe(gulp.dest('dist'));
})

gulp.task('sass', () => {
    return gulp.src('src/assets/scss/bootstrap.scss')
        .pipe($.sass({
            includePaths: PATHS.sass,
            outputStyle: 'compressed'
        }).on('error', $.sass.logError))
        .pipe($.concat('app.css'))
        .pipe(gulp.dest('dist/assets/css'))
})

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', (cb) => {
    pump([
            gulp.src(PATHS.javascript),
            $.concat('app.js'),
            // $.uglify(),
            gulp.dest('dist/assets/js')
        ],
        cb
    );
})

// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task('images', () => {
    return gulp.src('src/assets/images/**/*')
        .pipe($.imagemin())
        .pipe(gulp.dest('dist/assets/images'));
})

gulp.task('build', (done) => {
    sequence('clean', ['pages', 'copy:fonts', 'sass', 'javascript', 'images'], done);
})

gulp.task('server', () => {
    browser.init({
        server: 'dist',
        port: PORT
    });
})

gulp.task('default', ['build', 'server'], () => {
    gulp.watch(['src/pages/**/*.html',], ['pages', browser.reload]);
    gulp.watch(['src/{layouts,partials,helpers,data}/**/*.html'], ['pages:reset', browser.reload]);
    gulp.watch(['src/assets/scss/**/*.scss'], ['sass', browser.reload]);
    gulp.watch(['src/assets/js/**/*.js'], ['javascript', browser.reload]);
    gulp.watch(['src/assets/images/**/*'], ['images', browser.reload]);
})