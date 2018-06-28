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

            console.log("adding txs to address: " + address);
            console.log(transactions);
            console.log("txs to add ^");

            transactions.forEach(function (tr) {
                var hash = tr;
                if(tr.tx_hash != undefined){
                    hash = tr.tx_hash;
                }
                console.log(hash);

                if(hash == undefined){
                    console.log("Error. Undefined Hash");
                    console.trace();
                }

                if(! that.wallet.hasFullTransaction(hash, address)){
                    console.log("Tx not present. Fetchin hash: ". hash);
                    that.getTransaction(hash);
                }

            });

        };

    this.wallet = false;

    this.types = {
        balance     : 'blockchain.address.get_balance',
        subscribe   : 'blockchain.address.subscribe',
        history     : 'blockchain.address.get_history',
        transaction : 'blockchain.transaction.get',
        broadcast   : 'blockchain.transaction.broadcast',
        version     : 'server.version'
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
        else if(response.id == 0){
            //server keep alive is id 0
            console.log("(1) Keep Alive (Server Version) = " + response.result);
        }
        else {
            //dbg(request);
            //dbg(response);
            throw new Error("Could not determine method. " + JSON.stringify(response));
        }
        console.log(request);
        console.log(response);

        switch (method) {
            case this.types.version:
                console.log("(2) Keep Alive (Server Version) = " + response.result);
                return request;
            case this.types.balance:
                setBalance(response.result, request.params[0]);
                return request;
            case this.types.subscribe:
                checkSubscription(params[0], params[1]);
                return request;
            case this.types.transaction:
                addFullTransaction(request.params[0], response.result);
                return request;
            case this.types.history:
                addTransactions(response.result, request.params[0]);
                return request;
            case this.types.broadcast:
                console.log("Transaction Broadcast: ");
                console.log(request);
                console.log(response);
                console.log("Transaction Broadcast Results ^ ");

                if(response.result === ""){
                    console.log ("Empty TX response from server: Check inputs");
                    that.transactionRejected(request);
                    return request
                }
                else if(response.result.indexOf('TX rejected') > 0){
                    console.log ("Postion of TX rejected = " + response.result.indexOf('TX rejected'));
                    that.transactionRejected(request);
                    return request
                }
                else if(response.result.indexOf('rejected') > 0){
                    console.log ("Postion of rejected = " + response.result.indexOf('rejected'));
                    that.transactionRejected(request);
                    return request
                }
                else if(response.result.indexOf('inputs were already spend') > 0){
                    console.log ("Postion of inputs were already spend = " + response.result.indexOf('inputs were already spend'));
                    that.transactionRejected(request);
                    return request
                }
                else{

                    //handle tip jar case.
                    if(request.accountIndex === "-1"){
                        request.accountIndex = 0;
                    }
                    addTransactions([{tx_hash: response.result, height: 0}], request.accountIndex);
                    return request;

                }

                
        }

        if(response.id != 0){ //bypass our keep alive message
            
            throw new Error("Unkown Method: " + method);
        }

        
    };

});

module.exports = ResponseParser;