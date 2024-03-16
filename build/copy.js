import gulp from 'gulp';
import paths from '../mconfig.json' with { type: "json" };
import error from './error.js';

function copy() {
    return gulp
        .src([`./node_modules/loconative-scroll/assets/scripts/scroll/vendors/*`])
        .on('error', function(err) {
            error(this, err);
        })
        .pipe(gulp.dest(`${paths.scripts.src}/scroll/vendors`));
}

export default copy;
