var stampit = require('stampit'),
    config  = require('../../configuration.js'),
    crypto  = require('crypto');

var AbstractWallet = stampit().enclose(function () {
    var addresses = [],
    toHash = function(password){

        var pw = config.password;
        return crypto.pbkdf2Sync(password, pw.salt, pw.iterations, pw.keylen).toString('hex');
    };

    this.passwordHash = false;

    this.setPassword = function (password) {
        this.passwordHash = toHash(password);
    };

    this.passwordIsCorrect = function (password) {
        return this.passwordHash === toHash(password);
    };

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