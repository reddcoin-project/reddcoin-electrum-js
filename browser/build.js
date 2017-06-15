var bitcoreBuild = require('../node_modules/reddcore/browser/build');
var fs = require('fs');
var browserify = require('browserify');
var config = require('../configuration');
var path = require('path');

function build() {

    var doBitcore = false,
        bitcoreOpts = {
            submodules : config.bitcoreModules,
            dontminify : false
        };

    process.chdir('../');

    if(doBitcore){

        process.chdir('../node_modules/reddcore');
        var bitcoreBundle = bitcoreBuild.createBitcore(bitcoreOpts);

        //output bitcore
        bitcoreBundle.pipe( fs.createWriteStream(path.join(__dirname, 'bitcore.js')) );

    }

    console.log("Building Electrum");

    var b = browserify();

        b.require('./electrum.js', { expose:'electrum' });
        b.exclude('reddcore');

        b.transform({
            global: true
        }, 'uglifyify');

        b.bundle().pipe(
            fs.createWriteStream( path.join(__dirname, 'electrum.js') )
        );

}

if(process.mainModule.filename.indexOf('build.js') > 0){
    build();
}


module.exports = build;