var bitcoreBuild = require('../node_modules/bitcore/browser/build');
var fs = require('fs');
var browserify = require('browserify');

function build() {
    var bitcoreOpts = {
            includeall : true,
            dontminify : true
        };

    process.chdir('node_modules/bitcore');
    var bitcoreBundle = bitcoreBuild.createBitcore(bitcoreOpts);

    process.chdir('../../');
    //output bitcore
    bitcoreBundle.pipe(fs.createWriteStream('browser/bitcore.js'));

    var b = browserify();
    b.require('./electrum.js', {expose:'electrum'});
    b.exclude('bitcore');
    b.bundle().pipe(fs.createWriteStream('browser/electrum.js'));
//    b.bundle().pipe(process.stdout);
}

build();
module.exports = build;