var stampit      = require('stampit'),
    instantiable = require("../attributes/Instantiable"),
    bitcore      = bitcore || require('bitcore'),
    WalletKey    = bitcore.WalletKey;

var Address = stampit().enclose(function () {
    var transactions = [],
        baseTransaction = {
            hash   : '',
            height : 0
        },
        transactionStatus = null,
        data = {
            priv : '',
            pub  : '',
            addr : ''
        };

    this.confirmed = 0;
    this.unconfirmed = 0;

    this.createFromWalletKey = function (wKey) {
        this.instantiating();

        data.priv = wKey.priv;
        data.pub = wKey.pub;
        data.addr = wKey.addr;
    };

    this.needsTransactionUpdate = function (txStatus) {
        if(transactionStatus === txStatus){
            return false;
        }

        transactionStatus = txStatus;
        return true;
    };

    this.addTransactions = function (trs) {

        trs.forEach(function (transaction) {
            var hash = transaction.tx_hash;
            transactions[hash] = transaction;
        });
        throw new Error("Add transactions to address is deprecated.");
    };

    this.create = function (privateKey) {
        var wKey = new WalletKey();

        wKey.fromObj({priv : privateKey});

        this.createFromWalletKey(wKey.storeObj());
    };

    this.toString = function (attribute) {
        if(attribute !== undefined){
            return data[attribute];
        }
        return data.addr;
    };

});

module.exports = {

    create : function (privateKey) {
        var address = stampit.compose(instantiable, Address).create();
        address.create(privateKey);
        return address;
    },

    createFromWalletKey : function (wKey) {
        var address = stampit.compose(instantiable, Address).create();
        address.createFromWalletKey(wKey);
        return address;
    }
};