var hdAccount    = require("./HdAccount"),
    instantiable = require("../attributes/Instantiable"),
    encryptable  = require("../attributes/Encryptable"),
    stampit      = require('stampit');

module.exports = {
    account : function (index, info) {
        var account = stampit.compose(instantiable, encryptable, hdAccount).create();
        account.instantiate(index, info);
        return account;
    },
    fromObject : function (index, accountObject) {
        var account = stampit.compose(instantiable, encryptable, hdAccount).create();
        account.fromObject(index, accountObject);
        return account;
    }
};


