var stampit         = require('stampit'),
    Address         = require('./Address'),
    bitcore         = bitcore || require('bitcore'),
    HierarchicalKey = bitcore.HierarchicalKey,
    Transaction     = require('../wallet/Transaction');

var HdAccount = stampit().enclose(function () {
    var index,
        that = this,
        changeChain,
        publicChain,
        transactions = {},
        transactionHeights = {},
        spentOutputs = {},
        addresses = [],
        //for fast lookup
        addressList = {},

        getMyOutputs = function(outputs, includeSpent, hash){
            var outs = [];

            outputs.forEach(function(output, c){
                var isSpent = spentOutputs.hasOwnProperty(hash + ':' + c),
                    include = includeSpent || !isSpent,
                    isMine  = that.isMine(output.payTo);

                if(isMine && include){
                    outs.push(output);
                }
            });

            return outs;
        },

        getOutputs = function(includeSpent){
            var outs = [],
                includeSpent = typeof includeSpent !== 'undefined' ? includeSpent : true;

            for(var i in transactions){
                var tx = transactions[i],
                    outputs = tx.get("outputs"),
                    mine    = getMyOutputs(outputs, includeSpent, tx.get("hash"));

                outs = outs.concat(mine);

            }

            return outs;
        },

        getInputs = function(){

        },

        generateAddress = function (chain, index) {
            var privateKey = chain.deriveChild(index).eckey.private.toString("hex");

            return Address.create(privateKey);
        },

        generateAddresses = function (chain, count) {
            var index, adr;

            for (var i = 0; i < count; i++) {
                index = addresses.length;
                addresses[index] = generateAddress(chain, index);
                adr = addresses[index].toString();
                addressList[adr] = adr;
            }
        };

    this.instantiate = function (i, masterPrivateKey) {
        var baseDerivation = 'm/' + i + '\'/';
        this.instantiating();
        index = i;
        publicChain = new HierarchicalKey(masterPrivateKey).derive(baseDerivation + '0');
        changeChain = new HierarchicalKey(masterPrivateKey).derive(baseDerivation + '1');

        this.generatePublicAddresses(4);
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

    this.isMine = function(address){
        return addressList.hasOwnProperty(address);
    };

    this.hasFullTransaction = function(txHash){
        return transactions.hasOwnProperty(txHash);
    };

    this.updateSpentOutputs = function(){
        var addSpent = function(input){
            var outputId = input.output.hash + ':' + input.output.index;

            if(that.isMine(input.payFrom)){
                //dbg("SPNT: " + outputId);
                spentOutputs[outputId] = outputId;
            }
            else {
                //dbg("UTXO: " + outputId);
            }
        };

        //dbg("*******************************************************");
        //dbg("*-------------------------- TXs ----------------------*");
        //dbg("*******************************************************");
        for(var i in transactions){
            transactions[i].get("inputs").forEach(addSpent);
        }
        dbg(getOutputs(false));
    };

    this.getUtxos = function () {
        var utxos = getOutputs(false);

        dbg(utxos);
        dbg(spentOutputs);
        return utxos;
    };

    this.getTransactions = function () {
        var txs = [];

        for(var i in transactions){
            txs.push(transactions[i].getSummary(addressList));
        }

        txs.sort(function(a, b){
            return b.time - a.time;
        });

        return txs;
    };

    this.addFullTransaction = function (hash, rawTx) {
        var tx = Transaction.createFromRaw(rawTx)
        transactions[hash] = tx;

        this.updateSpentOutputs();
    };

    this.addTransactions = function (address, txs) {
        txs.forEach(function(tx){
            var hash = tx.hash;
            transactionHeights[hash] = {
                hash   : hash,
                height : tx.height,
                address : address
            };
        });
    };

    this.setAddressBalance = function (address, confrmed, unconfirmed) {
        var Addr = this.getAddress(address);
        Addr.confirmed = confrmed;
        Addr.unconfirmed = unconfirmed;
    };

});

module.exports = HdAccount;