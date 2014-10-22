var hdAccount    = require("./HdAccount"),
    instantiable = require("../attributes/Instantiable"),
    stampit      = require('stampit');

module.exports = {
    account : function (index, masterPrivateKey) {
        var account = stampit.compose(instantiable, hdAccount).create();
        account.instantiate(index, masterPrivateKey);
        return account;
    }
};


