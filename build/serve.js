import browserSync from 'browser-sync';
import paths from '../mconfig.json' with { type: "json" };


export const server = browserSync.create();

function serve(done) {
    server.init({
        notify: false,
        server: {
            baseDir: paths.docs.dest,
            serveStaticOptions: {
                extensions: ['html']
            }
        },
        open: false,
        ghostMode: false
    });
    done();
}

export default serve;
