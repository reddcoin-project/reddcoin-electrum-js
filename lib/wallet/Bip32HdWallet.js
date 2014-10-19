var stampit = require('stampit');
var config = require('../../configuration.js');
var AccountFactory = require('../address/AccountFactory');
var bitcore = bitcore || require('bitcore');
var BIP39 = bitcore.BIP39;
var HierarchicalKey = bitcore.HierarchicalKey;


var Bip32HdWallet = stampit().enclose(function() {
    var masterPublicKey = false,
        masterPrivateKey = false,
        accounts = [],

        getRootDerivation = function(){
            var hardened = "'";
            //something like: "m/44'/0'"
            return 'm/' + config.bip44.purpose + hardened + '/' + config.bip44.coin_type + hardened;
        };

    this.buildFromKeys = function(publicKey, privateKey){
        this.instantiating("Build Wallet");
        //private key is optional, so lets keep it boolean if not provided.
        privateKey = privateKey || false;

        masterPublicKey  = privateKey;
        masterPrivateKey = privateKey;

        accounts.push(AccountFactory.account(0, masterPrivateKey));
    };

    this.buildFromSeed = function(seed){
        var root             = new HierarchicalKey.seed(seed),
            rootXprv         = root.extendedPrivateKeyString(),
            rootDerivation   = getRootDerivation(),
            hkey             = new HierarchicalKey(rootXprv).derive(rootDerivation),
            masterPublicKey  = hkey.extendedPublicKeyString(),
            masterPrivateKey = hkey.extendedPrivateKeyString();

        this.buildFromKeys(masterPublicKey, masterPrivateKey);
    };

    this.buildFromMnemonic = function(mnemonicSeed){
        var seed = BIP39.mnemonic2seed(mnemonicSeed, '');
        this.buildFromSeed(seed);
    };

    this.getAddresses = function(){
        return accounts[0].getAddresses();
    };

    this.isDeterministic = function(){
        return true;
    };

});

module.exports = Bip32HdWallet;