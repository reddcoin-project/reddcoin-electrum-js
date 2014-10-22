var abstract     = require("./AbstractWallet"),
    bip32        = require("./Bip32HdWallet"),
    instantiable = require("../attributes/Instantiable"),
    stampit      = require('stampit');

module.exports = {
    standardWallet : function () {
        //return abstract.create();
        return stampit.compose(instantiable, abstract, bip32).create();
    }
};


