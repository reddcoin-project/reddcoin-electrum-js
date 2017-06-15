var stampit         = require('stampit'),
    Address         = require('./Address'),
    _               = require('lodash'),
    mediator        = require("../network/mediator"),
    config          = require('../../configuration.js'),
    bitcore         = bitcore || require('reddcore'),
    HierarchicalKey = bitcore.HierarchicalKey,
    Transaction     = require('../wallet/Transaction');

var HdAccount = stampit().enclose(function () {
    var index,
        that = this,
        name = '',
        type = 'unencrypted',
        isActive = false,
        changeChain = false,
        publicChain = false,

        chains = {
            public : {
                xpub  : '',
                xpriv : ''
            },
            change : {
                xpub  : '',
                xpriv : ''
            }
        },

        transactions = {},
        transactionHeights = {},
        spentOutputs = {},
        addresses = [],
        changeAddresses = [],
        //for fast lookup
        addressList = {},

        accountTypes = {
            'unencrypted' : 'Unprotected',
            'encrypted'   : 'Password-Protected',
            'watch'       : 'Unspendable'
        };

    var getMyOutputs = function (outputs, includeSpent, hash, filterFunction) {
        var outs = [];

        outputs.forEach(function (output, c) {
            var isSpent = spentOutputs.hasOwnProperty(hash + ':' + c),
                include = includeSpent || !isSpent,
                useAddress = filterFunction(output.payTo);
                isMine = that.isMine(output.payTo);

            if (isMine && include && useAddress) {
                outs.push(output);
            }
        });

        return outs;
    };

    var getOutputs = function (includeSpent, filterFunction) {
        var outs = [],
            filterFunction = filterFunction || function(){return true},
            includeSpent = typeof includeSpent !== 'undefined' ? includeSpent : true;

        for (var i in transactions) {
            var tx = transactions[i],
                outputs = tx.get("outputs"),
                mine = getMyOutputs(outputs, includeSpent, tx.get("hash"), filterFunction);

            outs = outs.concat(mine);

        }

        return outs;
    };

    var validateAccountType = function (type) {
        if (!accountTypes.hasOwnProperty(type)) {
            throw new Error("Invalid Account Type: " + type);
        }
    };

    var generatePrivateKey = function (chain, addressIndex, isChange) {
        return chain.deriveChild(addressIndex).eckey.private.toString("hex");

        //return Address.createPrivate(key, index, isChange);
    };

    var generateAddress = function (chain, addressIndex) {
        var key  = chain.deriveChild(addressIndex).eckey.public.toString("hex"),
            isChange = chain === changeChain;
//            isTipJar = false;
//
//        if (index === 0 && addressIndex === 0) {
//            isTipJar = true;
//        }

        return Address.createPublic(key, index, isChange);
    };

    var generateAddresses = function (chain, count) {
        var isChange = chain === changeChain,
            addressArray, addressIndex, adr;

        if(isChange){
            addressArray = changeAddresses;
        }
        else {
            addressArray = addresses;
        }

        for (var i = 0; i < count; i++) {
            addressIndex = addressArray.length;
            addressArray[addressIndex] = generateAddress(chain, addressIndex);
            adr = addressArray[addressIndex].toString();
            addressList[adr] = adr;

            if (index === 0 && addressIndex === 0 && !isChange) {
                that.nameAddress(adr, 'Tip Jar');
            }
        }
    };

    var markAddresesUsed = function(data){
        var addresses = _.union(data.transaction.fromAddresses, data.transaction.toAddresses);

        _.each(addresses, function(address){
            if(!that.isMine(address)){
                return;
            }

            var Addr = that.getAddress(address);
            Addr.isUsed = true;
        });

    };

    var listen = function(){
        mediator.event.on('transactionAdded', markAddresesUsed)
    };

    var checkActivated = function(){
        if(isActive){
            listen();
        }
    };

    this.enableSpending = function (password) {
        var changeBase,
            publicBase;

        publicBase = chains.public.xpub;
        changeBase = chains.change.xpub;


        publicChain = new HierarchicalKey(publicBase);
        changeChain = new HierarchicalKey(changeBase);
    };

    this.disableSpending = function () {

        if (type === 'watch') {
            chains.public.xpriv = '';
            chains.change.xpriv = '';
        }

        publicChain = false;
        changeChain = false;
    };

    this.fromObject = function (objectIndex, accountObject) {
        index = objectIndex;
        name = accountObject.name;
        type = accountObject.type;
        isActive = accountObject.isActive;
        chains = accountObject.chains;
        transactionHeights = accountObject.transactionHeights;
        transactions = [];
        addresses = [];
        changeAddresses = [];

        _.union(accountObject.addresses, accountObject.changeAddresses).forEach(function(address){
            var Addr = Address.fromObject(address);
            addressList[Addr.toString()] = Addr.toString();

            if(Addr.isChange){
                changeAddresses.push(Addr);
            }
            else {
                addresses.push(Addr);
            }
        });

        _.forEach(accountObject.transactions, function(transaction, hash){
            that.addFullTransaction(hash, transaction)
        });

        dbg(transactions);

        checkActivated();
    };

    this.toObject = function () {
        var account = {
            name               : name,
            type               : type,
            isActive           : isActive,
            //            changeChain        : changeChain.extendedPrivateKeyString(),
            //            publicChain        : publicChain.extendedPrivateKeyString(),
            chains             : chains,
            transactionHeights : transactionHeights,
            transactions       : {},
            addresses          : [],
            changeAddresses    : []
            //storing address list is redundant. We can rebuild it on load.
            //addressList        : addressList
        };

        addresses.forEach(function (address) {
            account.addresses.push(address.toObject());
        });

        changeAddresses.forEach(function (address) {
            account.changeAddresses.push(address.toObject());
        });

        if(!isActive ){return account;}

        _.forIn(transactions, function (transaction, hash) {
            account.transactions[hash] = transaction.toString();
        });

        return account;
    };

    this.isActive = function(){
        return isActive;
    };

    this.basicInfo = function(){
        var info = {
            index : index,
            name : name,
            type : type,
            typeName : accountTypes[type],
            confirmed : 0,
            unconfirmed : 0
        };

        _.union(addresses, changeAddresses).forEach(function(address){
            info.confirmed += address.confirmed;
            info.unconfirmed += address.unconfirmed;
        });

        return info;
    };

    this.instantiate = function (i, info, password) {
        var baseDerivation = 'm/' + i + '\'/',
            defaults = {
                name             : '',
                type             : 'encrypted',
                isActive         : false,
                masterPublicKey  : false,
                masterPrivateKey : false
            },
            settings = _.merge(defaults, info),
            baseKey = settings.masterPrivateKey;

        this.instantiating();

        validateAccountType(settings.type);
        name = settings.name;
        type = settings.type;

        if (settings.type === 'watch') {
            baseKey = settings.masterPublicKey;
        }

        index = i;

        publicChain = new HierarchicalKey(baseKey).derive(baseDerivation + '0');
        changeChain = new HierarchicalKey(baseKey).derive(baseDerivation + '1');

        chains.public.xpub = publicChain.extendedPublicKeyString();
        chains.public.xpriv = this.encrypt(publicChain.extendedPrivateKeyString(), password);

        chains.change.xpub = changeChain.extendedPublicKeyString();
        chains.change.xpriv = this.encrypt(changeChain.extendedPrivateKeyString(), password);

        this.disableSpending();
    };

    this.getPrivateKeys = function(password){
        dbg("current xpriv", chains.public.xpriv);
        dbg("decrypted xpriv", this.decrypt(chains.public.xpriv, password));
        var privateChain = new HierarchicalKey(this.decrypt(chains.public.xpriv, password)),
            privateChangeChain = new HierarchicalKey(this.decrypt(chains.change.xpriv, password)),
            keys = {};

        addresses.forEach(function(Address, index){
            if(Address.confirmed === 0){ return; }

            keys[Address.address] = generatePrivateKey(privateChain, index, false);
        });

        changeAddresses.forEach(function(Address, index){
            if(Address.confirmed === 0){ return; }

            keys[Address.address] = generatePrivateKey(privateChangeChain, index, false);
        });

        return keys;
    };

    var stopGap = function(type, unusedNeeded, chain){
        var addresses = that.getAddresses(type),
            consecutiveUnused = 0,
            toGenerate;

        addresses.forEach(function(Addr){
            if(Addr.isUsed === true){
                consecutiveUnused = 0;
            }
            else {
                consecutiveUnused++;
            }
        });

        toGenerate = unusedNeeded - consecutiveUnused;

        if(toGenerate > 0){
            generateAddresses(chain, toGenerate);
        }
    };

    this.checkForMissingTransactions = function(){
        if(!isActive){
            return;
        }

        _.forEach(transactionHeights, function (height, hash) {

            if(! that.hasFullTransaction(hash)){
                //that.getTransaction(hash);
                mediator.event.emit('transactionNeeded', hash);
            }

        });
    };

    this.doStopGap = function(){
        if(!isActive){
            return;
        }

        this.enableSpending('');
        stopGap('public', config.stopGap, publicChain);
        stopGap('change', 1, changeChain);

        this.disableSpending();
    };

    this.activate = function (accountName, accountType) {
        name = accountName;
        type = accountType;
        isActive = true;

        this.enableSpending();
        this.generatePublicAddresses(config.stopGap);
        this.generateChangeAddress();
        this.disableSpending();
        checkActivated();
    };

    this.generateChangeAddress = function () {
        generateAddresses(changeChain, 1);
    };

    this.generatePublicAddresses = function (count) {
        var cnt = count || 1;
        generateAddresses(publicChain, cnt);
    };

    this.getAddresses = function (which) {
        var addrs = [];
        which = which || 'public';

        if(which === 'public' || which === 'all'){
            addrs = addrs.concat(addresses);
        }

        if(which === 'change' || which === 'all'){
            addrs = addrs.concat(changeAddresses);
        }

        return addrs;
    };

    this.getTipJar = function(){
        dbg("Tip Jar:");
        dbg(addresses[0].toObject());
        return addresses[0].toObject();
    };

    this.unlockTipJar = function(password){
        var pKeys = this.getPrivateKeys(password),
            tipJar = this.getTipJar();

        return addresses[0].setPrivateKey(pKeys[tipJar.address]);
    };

    this.lockTipJar = function(){
        return addresses[0].setPrivateKey('');
    };

    this.getAddress = function (address) {
        var search = _.union(addresses, changeAddresses),
            foundAddress = _.find(search, { 'address': address });

        if (_.isUndefined(foundAddress)) {
            throw new Error("Could not find address: " + address);
        }

        return foundAddress;
    };

    this.nameAddress = function (address, newName) {
        var Addr = this.getAddress(address);
//        if (addresses[addressIndex] === undefined) {
//            throw new Error("Address at index " + addressIndex + " not found.");
//        }

        Addr.name = newName;
    };

    this.isMine = function (address) {
        return addressList.hasOwnProperty(address);
    };

    this.hasFullTransaction = function (txHash) {
        return transactions.hasOwnProperty(txHash);
    };

    this.updateSpentOutputs = function () {
        var addSpent = function (input) {
            var outputId = input.output.hash + ':' + input.output.index;

            if (that.isMine(input.payFrom)) {
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
        for (var i in transactions) {
            transactions[i].get("inputs").forEach(addSpent);
        }
        //dbg(getOutputs(false));
    };

    this.getUtxos = function (filterFunction) {
        var filterFunction = filterFunction || function(){ return true;},
            utxos = getOutputs(false, filterFunction);

        //dbg(utxos);
        //dbg(spentOutputs);
        return utxos;
    };

    this.getTransactions = function () {
        var txs = [];

        for (var i in transactions) {
            txs.push(transactions[i].getSummary(addressList));
        }

        txs.sort(function (a, b) {
            return b.time - a.time;
        });

        return txs;
    };

    this.addFullTransaction = function (hash, rawTx) {
        var tx;
        if(!transactionHeights.hasOwnProperty(hash)){
            return;
        }

        tx = Transaction.createFromRaw(rawTx);
        transactions[hash] = tx;

        this.updateSpentOutputs();
    };

    this.addTransactions = function (address, txs) {
        txs.forEach(function (tx) {
            var hash = tx.tx_hash;
            transactionHeights[hash] = tx.height
        });
    };

    this.setAddressBalance = function (address, confrmed, unconfirmed) {
        var Addr = this.getAddress(address);
        Addr.confirmed = confrmed;
        Addr.unconfirmed = unconfirmed;
    };

});

module.exports = HdAccount;