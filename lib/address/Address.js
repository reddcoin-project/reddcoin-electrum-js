var stampit = require('stampit');
var instantiable = require("../attributes/Instantiable");
var bitcore = bitcore || require('bitcore');
var WalletKey = bitcore.WalletKey;

var Address = stampit().enclose(function () {
    var data = {
        priv : '',
        pub  : '',
        addr : ''
    };

    this.createFromWalletKey = function (wKey) {
        this.instantiating();

        data.priv = wKey.priv;
        data.pub = wKey.pub;
        data.addr = wKey.addr;
    };

    this.create = function (privateKey) {
        var wKey = new WalletKey();

        wKey.fromObj({ priv : privateKey});

        this.createFromWalletKey(wKey.storeObj());
    };

    this.toString = function(){
        return data.addr;
    }

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