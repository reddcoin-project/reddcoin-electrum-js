var stampit = require('stampit');

var AbstractWallet = stampit().enclose(function () {
    var addresses = [];

    this.addSimpleAddress = function (address) {
        addresses.push(address);
    };

    this.getSimpleAddresses = function () {
        return addresses;
    };

    this.isDeterministic = function () {
        return false;
    };
});

module.exports = AbstractWallet;