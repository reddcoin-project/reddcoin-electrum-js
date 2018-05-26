var stampit         = require('stampit'),
    config          = require('../../configuration.js'),
    AccountFactory  = require('../address/AccountFactory'),
    TxBuilder       = require('./TxBuilder'),
    mediator        = require("../network/mediator"),
    _               = require('lodash'),
    bitcore         = bitcore || require('bitcore'),
    BIP39           = bitcore.BIP39,
    BIP39WordlistEn = bitcore.BIP39WordlistEn,
    HierarchicalKey = bitcore.HierarchicalKey;

var Bip32HdWallet = stampit().enclose(function () {
    var that = this,
        masterPublicKey = false,
        masterPrivateKey = false,
        txBuilder = false,
        accounts = [],
        contacts = {};

    var getRootDerivation = function () {
        var hardened = "'";
        //something like: "m/44'/0'"
        return 'm/' + config.bip44.purpose + hardened + '/' + config.bip44.coin_type + hardened;
    };

    var idle = function(){
        accounts.forEach(function(account){
            account.doStopGap();
            account.checkForMissingTransactions();
        });
    };

    var addContacts = function(data){
        dbg("Adding contacts.");
        var sentTo = data.transaction.toAddresses;
        _.each(sentTo, function(addr){
            if(that.isMine(addr)){
                return;
            }
            //that.addContact(addr, 'Unknown');
        });
    };

    var listenForEvents = function () {
        dbg("Listening in wallet");
        mediator.event.on('idle', idle)
        mediator.event.on('transactionAdded', addContacts)
    };

    this.fromObject = function (walletObject) {
        listenForEvents();
        txBuilder = TxBuilder.create();

        this.passwordHash = walletObject.passwordHash;
        contacts = walletObject.contacts;

        walletObject.accounts.forEach(function(account, i){
            accounts.push(AccountFactory.fromObject(i, account));
        });
    };

    this.toObject = function () {
        var wallet = {};
        wallet.accounts = [];

        wallet.passwordHash = this.passwordHash;
        wallet.contacts     = contacts;

        accounts.forEach(function (account, i) {
            wallet.accounts.push(account.toObject());
        });

        return wallet;
    };

    this.getContacts = function(){
        //occasionally, a contact gets added where isMine() is true, because it got added before it was discovered. We'll
        //remove those here.
        var newContacts = {};
        _.forIn(contacts, function(name, address){
            if(!that.isMine(address)){
                newContacts[address] = name;
            }
        });
        contacts = newContacts;
        return newContacts;
    };

    this.updateContact = function(address, name){
        if($.trim(name) === ''){
            return;
        }
        contacts[address] = name;
    };

    this.addContact = function(address, name){
        if(!contacts.hasOwnProperty(address)){
            dbg("adding contact: ", address, name);
            this.updateContact(address, name);
        }
    };

    this.buildFromKeys = function (publicKey, privateKey, password) {
        this.instantiating("Build Wallet");
        this.setPassword(password);
        //private key is optional, so lets keep it boolean if not provided.
        privateKey = privateKey || false;

        listenForEvents();

        masterPublicKey = publicKey;
        masterPrivateKey = privateKey;

        txBuilder = TxBuilder.create();

        var accountsToCreate = config.accounts.max;
        var defaultAccount = {
            name             : '',
            type             : 'encrypted',
            isActive         : false,
            masterPublicKey  : publicKey,
            masterPrivateKey : privateKey
        };

        for(var i = 0; i < accountsToCreate; i++){
            accounts.push(AccountFactory.account(i, defaultAccount, password));
        }
    };

    this.activateAccount = function(index, name, type, password){
        var acc = this.getAccount(index);
        acc.activate(name, type, password);
    };

    this.getNewSeed = function () {
        return BIP39.mnemonic(BIP39WordlistEn, 128);
    };

    this.checkSeed = function (seed) {
        return BIP39.check(BIP39WordlistEn, seed);
    };

    this.buildFromSeed = function (seed, password) {
        //                                                                                                              @formatter:off
        var root             = new HierarchicalKey.seed(seed),
            rootXprv         = root.extendedPrivateKeyString(),
            rootDerivation   = getRootDerivation(),
            hkey             = new HierarchicalKey(rootXprv).derive(rootDerivation),
            masterPublicKey  = hkey.extendedPublicKeyString(),
            masterPrivateKey = hkey.extendedPrivateKeyString();
//                                                                                                                      @formatter:on
        this.buildFromKeys(masterPublicKey, masterPrivateKey, password);
    };

    this.addressToAccountindex = function(address){
        var accountIndex = false;

        accounts.forEach(function(account, i){
            if(account.isMine(address)){
                accountIndex = i;
            }
        });

        return accountIndex;
    };

    this.isMine = function(address){
        return this.addressToAccountindex(address)!== false;
    };

    this.getAccount = function (indexOrAddress) {
        var accountIndex = indexOrAddress;

        //if not a finite number, treat as address
        if(_.isString(indexOrAddress) && indexOrAddress.charAt(0) === 'R'){
            accountIndex = this.addressToAccountindex(indexOrAddress);
        }

        //default value
        if(indexOrAddress === undefined){
            accountIndex = 0;
        }
        if (accounts[accountIndex] === undefined) {
            throw new Error("Could not find account: " + accountIndex);
        }
        return accounts[accountIndex];
    };

    this.buildFromMnemonic = function (mnemonicSeed, password) {
        var seed = BIP39.mnemonic2seed(mnemonicSeed, '');
        this.buildFromSeed(seed, password);
    };

    this.getAddresses = function (which) {
        var addresses = [];
        if (accounts.length === 0) {
            return addresses;
        }

        accounts.forEach(function(account){
            addresses = addresses.concat(account.getAddresses(which))
        });

        return addresses;
    };

    this.isDeterministic = function () {
        return true;
    };

    this.chooseAccountForTransaction = function(amount){
        var chosenIndex = false,
            accts = this.getAccountInfo();
        amount = amount * 100000000;
        //dbg("Choosing! Desired Amount: ");
        //dbg(amount);
        _.each(accts, function(account, i){
            //dbg("This Account: ");
            //dbg(account.confirmed);
            if(account.type === 'watch'){
                return;
            }

            if(chosenIndex === false && account.confirmed >= amount){
                chosenIndex = i;
                //dbg("chose this one!!");
            }
        });

        if(chosenIndex === false){
            return false;
        }

        return this.getAccount(chosenIndex);
    };

    this.getTipJar = function(){
        return this.getAccount(0).getTipJar();
    };

    this.unlockTipJar = function(password){
        return this.getAccount(0).unlockTipJar(password);
    };

    this.lockTipJar = function(){
        return this.getAccount(0).lockTipJar();
    };

    this.checkTransaction = function(initialAmount, tipJarEnabled){
        var isPossible = false,
            usableAccounts = [],
            tipJar = this.getTipJar(),
            accts = this.getAccountInfo(),
            amount = initialAmount * 100000000;

        if(tipJarEnabled){
            if(tipJar.confirmed > amount){

                var needsPassword = true;
                if(tipJar.data.priv.length > 4){
                    needsPassword = false;
                }

                usableAccounts.push({
                    confirmed: tipJar.confirmed,
                    index: -1,
                    name: "Tip Jar",
                    requiresPassword: needsPassword,
                    type: "unencrypted",
                    typeName: "Unprotected",
                    unconfirmed: tipJar.unconfirmed
                });
            }
        }

        _.each(accts, function(account, i){
            if(account.type === 'watch'){
                return;
            }

            if(account.confirmed >= amount){
                isPossible = true;
                var thisAccount = that.getAccount(i);

                account.requiresPassword = true;

                //if(tipJarEnabled && )

                usableAccounts.push(account);
            }
        });


        return {
            amount : initialAmount,
            isPossible : isPossible,
            usableAccounts : usableAccounts
        };
    };

    this.send = function (amount, accIndex, requirePw, to, password, monitor) {
        var accountIndex = accIndex * 1,
            i = dbg(accountIndex),
            account = this.getAccount((accountIndex === -1) ? 0 : accountIndex),
            tipJar = this.getTipJar(),
            //account = this.chooseAccountForTransaction(amount),
            utxos = account.getUtxos(function(address){
                if(accountIndex === -1 && address === tipJar.address){
                    return true;
                }

                if(accountIndex !== -1 && address !== tipJar.address){
                    return true;
                }

                return false;
            }),

            addresses = this.getAddresses(),
            signedTransaction, priKeys;

        if(!requirePw){
            priKeys = {};
            priKeys[tipJar.address] = tipJar.data.priv;
        }
        else {
            priKeys = account.getPrivateKeys(password);
        }


        console.log("Sign Transaction..")
        signedTransaction = txBuilder.createTransaction(amount, to, utxos, addresses, priKeys);


        //console.log(signedTransaction);
        console.log("Sending Signed Transaction..")
        return monitor.broadcastTransaction(signedTransaction, accIndex);
    };

    this.getAccountInfo = function () {
        var info = [];

        accounts.forEach(function(account){
            if(!account.isActive()){
                return;
            }
            info.push(account.basicInfo())
        });

        return info;
    };

    this.getAddress = function (address) {
        var account = this.getAccount(address);
        return account.getAddress(address);
    };

    this.getPrivateKey - function (address, password){
        var account = this.getAccount(address);
        var privKeys = account.getPrivateKeys(password);
        return privKeys[address]
    };

    this.hasFullTransaction = function (txHash, accountIndex) {
        var hasTransaction = false;

        _.each(accounts, function(account){
            if(account.hasFullTransaction(txHash)){
                hasTransaction = true;
            }
        });

//        var account = this.getAccount(accountIndex);
//        return account.hasFullTransaction(txHash);
    };

    this.getTransactions = function () {
        var transactions = [];
        if (accounts.length === 0) {
            return transactions;
        }

        _.each(accounts, function(account){
            transactions = transactions.concat(account.getTransactions());
        });

        transactions.sort(function (a, b) {
            return b.time - a.time;
        });


        return transactions
    };

    this.addFullTransaction = function (hash, rawTx, accountIndex) {
        _.each(accounts, function(account){
            account.addFullTransaction(hash, rawTx);
        });

    };

    this.addTransactions = function (address, transactions, accountIndex) {
        var account = this.getAccount(address);
        account.addTransactions(address, transactions);
    };

    this.updateName = function(address, name){
        var account = this.getAccount(address);
        account.nameAddress(address, name);
    };

    this.setAddressBalance = function (address, confirmed, unconfirmed, accountIndex) {
        var account = this.getAccount(address);
        account.setAddressBalance(address, confirmed, unconfirmed);
    };

    this.decodeRawTransaction = function (rawTX){
        return txBuilder.decodeRawTransaction(rawTX)
    };

});

module.exports = Bip32HdWallet;