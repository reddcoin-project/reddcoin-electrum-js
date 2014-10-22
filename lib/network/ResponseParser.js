var stampit = require('stampit');

var ResponseParser = stampit().enclose(function () {
    var that = this,
        pendingRequests = {},

        setBalance = function (result, address) {
            that.wallet.setAddressBalance(address, result.confirmed, result.unconfirmed);
        },

        addFullTransaction = function (hash, rawTx) {
            that.wallet.addFullTransaction(hash, rawTx);
        },

        addTransactions = function (transactions, address) {
            transactions.forEach(function (tr) {
                that.getTransaction(tr.tx_hash);
            });
            that.wallet.addTransactions(address, transactions);
        };

    this.wallet = false;

    this.types = {
        balance     : 'blockchain.address.get_balance',
        subscribe   : 'blockchain.address.subscribe',
        history     : 'blockchain.address.get_history',
        transaction : 'blockchain.transaction.get'
    };

    this.addPendingRequest = function (expected) {
        pendingRequests[expected.id] = expected;
    };

    this.setWallet = function (newWallet) {
        this.wallet = newWallet;
    };

    this.processResponse = function (response) {
        var id = response.id,
            request = pendingRequests[id],
            method = request.method;

        switch (method) {
            case this.types.balance:
                return setBalance(response.result, request.params[0]);
            case this.types.subscribe:
                //console.log(request);
                //return console.log(response);
                return;
            case this.types.transaction:
                return addFullTransaction(request.params[0], response.result);
            case this.types.history:
                return addTransactions(response.result, request.params[0]);

        }

        throw new Error("Unkown Method: " + method);
    };

});

module.exports = ResponseParser;