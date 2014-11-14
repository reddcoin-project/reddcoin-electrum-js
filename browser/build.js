var bitcoreBuild = require('../node_modules/bitcore/browser/build');
var fs = require('fs');
var browserify = require('browserify');
var config = require('../configuration');

function build() {
    var doBitcore = true,
        doBitcore = false,
        bitcoreOpts = {
            submodules : config.bitcoreModules,
            dontminify : true
//            dontminify : false
        };

    if(doBitcore){
        process.chdir('node_modules/bitcore');
        var bitcoreBundle = bitcoreBuild.createBitcore(bitcoreOpts);

        process.chdir('../../');
        //output bitcore
        bitcoreBundle.pipe(fs.createWriteStream('browser/bitcore.js'));
    }

    console.log("Building Electrum");
    var b = browserify();
    b.require('./electrum.js', {expose:'electrum'});
    b.exclude('bitcore');

//    b.transform({
//        global: true
//    }, 'uglifyify');

    b.bundle().pipe(fs.createWriteStream('browser/electrum.js'));
}

if(process.mainModule.filename.indexOf('build.js') > 0){
    build();
}


module.exports = build;