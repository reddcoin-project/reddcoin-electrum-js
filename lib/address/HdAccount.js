var stampit         = require('stampit'),
    Address         = require('./Address'),
    bitcore         = bitcore || require('bitcore'),
    HierarchicalKey = bitcore.HierarchicalKey,
    Transaction     = bitcore.Transaction;

var HdAccount = stampit().enclose(function () {
    var index,
        changeChain,
        publicChain,
        transactions = {},
        addresses = [],

        generateAddress = function (chain, index) {
            var privateKey = chain.deriveChild(index).eckey.private.toString("hex");

            return Address.create(privateKey);
        },

        generateAddresses = function (chain, count) {
            var index;

            for (var i = 0; i < count; i++) {
                index = addresses.length;
                addresses[index] = generateAddress(chain, index);
            }
        };

    this.instantiate = function (i, masterPrivateKey) {
        var baseDerivation = 'm/' + i + '\'/';
        this.instantiating();
        index = i;
        publicChain = new HierarchicalKey(masterPrivateKey).derive(baseDerivation + '0');
        changeChain = new HierarchicalKey(masterPrivateKey).derive(baseDerivation + '1');

        this.generatePublicAddresses(7);
    };

    this.generatePublicAddresses = function (count) {
        var cnt = count || 1;
        generateAddresses(publicChain, cnt);
    };

    this.getAddresses = function () {
        return addresses;
    };

    this.getAddress = function (address) {
        var foundAddress = false;

        addresses.forEach(function (Addr) {
            if (Addr.toString() === address) {
                foundAddress = Addr;
            }
        });

        if (foundAddress === false) {
            throw new Error("Could not find address: " + address);
        }

        return foundAddress;
    };

    this.addFullTransaction = function (hash, rawTx) {
        var raw = new Buffer(rawTx, 'hex');
        var tx = new Transaction();
        tx.parse(raw);
        transactions[hash] = tx;
    };

    this.addTransactions = function (address, transactions) {
        this.getAddress(address).addTransactions(transactions);
    };

    this.setAddressBalance = function (address, confrmed, unconfirmed) {
        var Addr = this.getAddress(address);
        Addr.confirmed = confrmed;
        Addr.unconfirmed = unconfirmed;
    };

});

module.exports = HdAccount;