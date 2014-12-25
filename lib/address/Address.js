var stampit      = require('stampit'),
    instantiable = require("../attributes/Instantiable"),
    encryptable  = require("../attributes/Encryptable"),
    mediator     = require("../network/mediator"),
    bitcore      = bitcore || require('bitcore'),
    BitcoreAddress = bitcore.Address,
    coinUtil = bitcore.util,
    networks = bitcore.networks,
    WalletKey    = bitcore.WalletKey;

var Address = stampit().enclose(function () {
    var that = this,
        transactions = [],
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
    this.name  = 0;
    this.isUsed = false;
    this.isChange = false;
    this.address = 0;
    this.accountIndex = false;

    this.createFromWalletKey = function (wKey) {
        this.instantiating();

        data.priv = wKey.priv;
        data.pub = wKey.pub;
        data.addr = wKey.addr;

        this.address = wKey.addr;
        this.name = wKey.addr;

        mediator.event.emit('addressCreated', this);
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

    this.create = function (key, password, keyType) {
        var type = keyType || "priv",
            wKey = new WalletKey(),
            obj = {},
            walletKey;

        if(type == 'priv'){
            obj[type] = key;
            wKey.fromObj(obj);
            walletKey = wKey.storeObj();

            walletKey.priv = this.encrypt(walletKey.priv, password);
        }
        else {

            var pubKeyHash = coinUtil.sha256ripe160(new Buffer(key, 'hex'));
            var addr = new BitcoreAddress(networks['livenet'].addressVersion, pubKeyHash);

            walletKey = {
                priv : '',
                pub  : key,
                addr : addr.toString()
            };
        }

        this.createFromWalletKey(walletKey);
    };

    this.setPrivateKey = function(key){
        data.priv = key;
    };

    this.toObject = function(){
        var obj = JSON.parse(JSON.stringify(this));
        obj.data = data;
        obj.transactionStatus = transactionStatus;
        return obj;
    };

    this.toString = function (attribute) {
        if(attribute !== undefined){
            return data[attribute];
        }
        return data.addr;
    };

});

module.exports = {

    createPrivate : function (privateKey, password, accountIndex) {
        var address = stampit.compose(instantiable, encryptable, Address).create();

        address.create(privateKey, password, 'priv', encrypt);
        address.accountIndex = accountIndex;
        return address;
    },

    createPublic : function (publicKey, accountIndex, isChange) {
        var address = stampit.compose(instantiable, encryptable, Address).create();
        address.create(publicKey, '', 'pub');
        address.accountIndex = accountIndex;
        address.isChange = isChange;
        return address;
    },

    fromObject : function(addressObject){
        var address = stampit.compose(instantiable, encryptable, Address).create();
        address.createFromWalletKey( {
            "priv": addressObject.data.priv,
            "pub": addressObject.data.pub,
            "addr": addressObject.data.addr
        });

        address.name = addressObject.name;
        address.confirmed = addressObject.confirmed;
        address.unconfirmed = addressObject.unconfirmed;
        address.accountIndex = addressObject.accountIndex;
        address.isChange     = addressObject.isChange;

        address.needsTransactionUpdate(addressObject.transactionStatus);

        return address;
    }
//
//    createFromWalletKey : function (wKey) {
//        var address = stampit.compose(instantiable, Address).create();
//        address.createFromWalletKey(wKey);
//        return address;
//    }
};