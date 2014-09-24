var stampit = require('stampit');

var AbstractWallet = stampit().enclose(function(){
    var addresses = [];

    this.addAddress = function(address){
        addresses.push(address);
    };

    this.getAddresses = function(){
        return addresses;
    };

    this.isDeterministic = function(){
        return false;
    };
});

module.exports = AbstractWallet;