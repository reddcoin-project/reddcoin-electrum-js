var stampit = require('stampit'),
    config  = require('../../configuration.js'),
    crypto  = require('crypto');

var Encryptable = stampit().enclose(function () {
    var algorithm = 'aes256',
        getKey = function(password){
            return password + config.password.salt
        };



    this.encrypt = function (data, password) {
        var cipher = crypto.createCipher(algorithm, getKey(password));
        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    };

    this.decrypt = function(data, password){
        var decipher = crypto.createDecipher(algorithm, getKey(password));
        return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
    }
});

module.exports = Encryptable;