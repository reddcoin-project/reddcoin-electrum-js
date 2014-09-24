var stampit = require('stampit');

var Bip32HdWallet = stampit().enclose(function() {
    var mnemonicSeed;

    this.setMnemonicSeed = function(seed){
        mnemonicSeed = seed;
    };

    this.generateNewAddress = function(){
        return "newaddress";
    };

    this.isDeterministic = function(){
        return true;
    };

});

module.exports = Bip32HdWallet;