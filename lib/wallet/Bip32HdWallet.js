var stampit         = require('stampit'),
    config          = require('../../configuration.js'),
    AccountFactory  = require('../address/AccountFactory'),
    TxBuilder       = require('./TxBuilder'),
    bitcore         = bitcore || require('bitcore'),
    BIP39           = bitcore.BIP39,
    HierarchicalKey = bitcore.HierarchicalKey;

var Bip32HdWallet = stampit().enclose(function () {
    var masterPublicKey = false,
        masterPrivateKey = false,
        txBuilder = false,
        accounts = [],

        getRootDerivation = function () {
            var hardened = "'";
            //something like: "m/44'/0'"
            return 'm/' + config.bip44.purpose + hardened + '/' + config.bip44.coin_type + hardened;
        };

    this.buildFromKeys = function (publicKey, privateKey) {
        this.instantiating("Build Wallet");
        //private key is optional, so lets keep it boolean if not provided.
        privateKey = privateKey || false;

        masterPublicKey = privateKey;
        masterPrivateKey = privateKey;

        txBuilder = TxBuilder.create();

        accounts.push(AccountFactory.account(0, masterPrivateKey));
    };

    this.buildFromSeed = function (seed) {
        //                                                                                                              @formatter:off
        var root             = new HierarchicalKey.seed(seed),
            rootXprv         = root.extendedPrivateKeyString(),
            rootDerivation   = getRootDerivation(),
            hkey             = new HierarchicalKey(rootXprv).derive(rootDerivation),
            masterPublicKey  = hkey.extendedPublicKeyString(),
            masterPrivateKey = hkey.extendedPrivateKeyString();
//                                                                                                                      @formatter:on
        this.buildFromKeys(masterPublicKey, masterPrivateKey);
    };

    this.getAccount = function (accountIndex) {
        var ai = accountIndex || 0;
        if (accounts[ai] === undefined) {
            throw new Error("Could not find account: " + ai);
        }
        return accounts[ai];
    };

    this.buildFromMnemonic = function (mnemonicSeed) {
        var seed = BIP39.mnemonic2seed(mnemonicSeed, '');
        this.buildFromSeed(seed);
    };

    this.getAddresses = function () {
        return accounts[0].getAddresses();
    };

    this.isDeterministic = function () {
        return true;
    };

    this.send = function(amount, to, monitor){
        var account = this.getAccount(0),
            utxos   = account.getUtxos(),
            addresses = this.getAddresses(),
            signedTransaction = txBuilder.createTransaction(amount, to, utxos, addresses);

        console.log(signedTransaction);
        return monitor.broadcastTransaction(signedTransaction);
    };

    this.getAddress = function(address, accountIndex){
        var account = this.getAccount(accountIndex);
        return account.getAddress(address);
    };

    this.hasFullTransaction = function(txHash, accountIndex){
        var account = this.getAccount(accountIndex);
        return account.hasFullTransaction(txHash);
    };

    this.getTransactions = function(accountIndex){
        var account = this.getAccount(accountIndex);
        return account.getTransactions();
    };

    this.addFullTransaction = function (hash, rawTx, accountIndex) {
        var account = this.getAccount(accountIndex);
        account.addFullTransaction(hash, rawTx);
    };

    this.addTransactions = function (address, transactions, accountIndex) {
        var account = this.getAccount(accountIndex);
        account.addTransactions(address, transactions);
    };

    this.setAddressBalance = function (address, confirmed, unconfirmed, accountIndex) {
        var account = this.getAccount(accountIndex);
        account.setAddressBalance(address, confirmed, unconfirmed);
    };

});

module.exports = Bip32HdWallet;