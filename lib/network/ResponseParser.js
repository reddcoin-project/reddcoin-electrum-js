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

        checkSubscription = function(address, txStatus){
            var Addr = that.wallet.getAddress(address),
                needsUpdate = Addr.needsTransactionUpdate(txStatus);

            if(needsUpdate){
                that.updateAddress(address);
            }
        },

        addTransactions = function (transactions, address) {
            that.wallet.addTransactions(address, transactions);

            transactions.forEach(function (tr) {

                if(! that.wallet.hasFullTransaction(tr.tx_hash)){
                    that.getTransaction(tr.tx_hash);
                }

            });

        };

    this.wallet = false;

    this.types = {
        balance     : 'blockchain.address.get_balance',
        subscribe   : 'blockchain.address.subscribe',
        history     : 'blockchain.address.get_history',
        transaction : 'blockchain.transaction.get',
        broadcast   : 'blockchain.transaction.broadcast'
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
            method, params;

        if(request){
            method = request.method;
            params = request.params;
        }
        else if(response["method"] !== undefined){
            method = response["method"];
            params = response.params;
        }
        else {
            dbg(request);
            dbg(response);
            throw new Error("Could not determine method");
        }

        switch (method) {
            case this.types.balance:
                return setBalance(response.result, request.params[0]);
            case this.types.subscribe:
                return checkSubscription(params[0], params[1]);
            case this.types.transaction:
                return addFullTransaction(request.params[0], response.result);
            case this.types.history:
                return addTransactions(response.result, request.params[0]);

        }

        throw new Error("Unkown Method: " + method);
    };

});

module.exports = ResponseParser;