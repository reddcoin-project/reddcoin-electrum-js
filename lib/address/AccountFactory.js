var hdAccount = require("./HdAccount");
var instantiable = require("../attributes/Instantiable");
var stampit = require('stampit');

module.exports = {
    account : function(index, masterPrivateKey){
        var account = stampit.compose(instantiable, hdAccount).create();
        account.instantiate(index, masterPrivateKey);
        return account;
    }
};


