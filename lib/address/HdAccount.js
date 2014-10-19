var stampit = require('stampit');
var Address = require('./Address');
var bitcore = bitcore || require('bitcore');
var WalletKey = bitcore.WalletKey;
var HierarchicalKey = bitcore.HierarchicalKey;

var HdAccount = stampit().enclose(function() {
    var index,
        changeChain,
        publicChain,
        addresses = [],

        generateAddress = function(chain, index){
            var privateKey = chain.deriveChild(index).eckey.private.toString("hex");

            return Address.create(privateKey);
        },

        generateAddresses = function(chain, count){
            var index;

            for(var i = 0; i < count; i++){
                index = addresses.length;
                addresses[index] = generateAddress(chain, index);
            }
        };


    this.instantiate = function(i, masterPrivateKey){
        var baseDerivation = 'm/' + i + '\'/';
        this.instantiating();
        index = i;
        publicChain = new HierarchicalKey(masterPrivateKey).derive(baseDerivation + '0');
        changeChain = new HierarchicalKey(masterPrivateKey).derive(baseDerivation + '1');

        this.generatePublicAddresses(20);
    };

    this.generatePublicAddresses = function(count){
        var count = count || 1;
        generateAddresses(publicChain, count)
    }

    this.getAddresses = function(){
        return addresses;
    };

});

module.exports = HdAccount;