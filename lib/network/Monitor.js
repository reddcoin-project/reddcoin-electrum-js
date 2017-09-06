var stampit        = require('stampit'),
    instantiable   = require("../attributes/Instantiable"),
    ResponseParser = require("./ResponseParser"),
    CookieManager  = require("./CookieManager"),
    mediator       = require("./mediator"),
    http           = require('http'),
    _              = require('lodash'),
    bitcore        = bitcore || require('bitcore'),
    WalletKey      = bitcore.WalletKey;

var Monitor = stampit().enclose(function () {

    var queue = [],
        that = this,
        requestId = 1,
        isIdle = true,
        requestDelayMs = 500,
        lastRequest = 0,
        currentCookie = false,
        //since chrome requires all external communication to be explicitly granted, this will always need to be a hardcoded list.
        availableServers = [
            //'uk.rddelectrum.com',
            //'rdd.riditt.de',
            'bradleyploof.hopto.org'
        ],
        selectedServer = false,
        intervalId,

        postData = function (data, callback) {
            var cb = callback || function () {};

            data = JSON.parse(data);
            if(data.hasOwnProperty("accountIndex")){
                delete data.accountIndex;
            }
            data = JSON.stringify(data);

            var options = {
                host     : selectedServer,
                protocol : 'http:',
                port     : '8081',
                path     : '/',
                method   : 'POST',
                withCredentials: false, // this is the important part
                headers  : {
                    'Cookie'         : currentCookie,
                    'Content-Type'   : 'application/json-rpc',
                    'Content-Length' : data.length
                }
            };

            // Set up the request
            var request = http.request(options, function (response) {

                var responseData = '';

                if(currentCookie === false && response.headers && response.headers["set-cookie"] && response.headers["set-cookie"][0]){
                    currentCookie = response.headers["set-cookie"][0];
                }

                response.on('data', function (chunk) {
                    responseData = responseData + chunk;
                });

                response.on('end', function () {
                    try {
                        responseData = JSON.parse(responseData);

                    }
                    catch (e) {
                    }
                    cb(responseData);
                });

            });

            // post the data
            request.write(data);
            request.end();
            lastRequest = new Date() / 1000;
        },

        handleResponse = function (response) {

            if(!response){
                dbg("Empty Response");
                return;
            }

            //console.log(response);

            if (typeof response === 'string' && response.indexOf("session not found") > 0) {
                that.clearCookies();
            }
            else {
                // Sometimes the response is an array.
                // We'll force it to an array to handle them all the same way.
                var isArray = Array.isArray(response);
                if(!isArray){
                    response = [response];
                }

                response.forEach(function(resp){
                    var req = that.processResponse(resp);
                    mediator.event.emit('dataReceived', {
                        response: resp,
                        request : req
                    });
                });
            }

        },

        update = function () {
            var now = new Date() / 1000,
                secondsSinceRequest = now - lastRequest,
                currentRequest;

            if (queue.length > 0) {
                //console.log("%cCurrent Queue: " + queue.length, "color:blue;");
                isIdle = false;
                currentRequest = queue.shift();
                that.addPendingRequest( JSON.parse(currentRequest));

                //console.log(currentRequest);
                postData(currentRequest, handleResponse);

                //if no cookie has been set yet, we should re-send the request because it will fail without a session.
                if(currentCookie === false && chrome === undefined){
                    queue.push(currentRequest);
                }
            }

            //no queue to process
            else {
                //send keep alive if its been a while.
                if(secondsSinceRequest > 30) {
                    postData('{"id": null, "method": "node.keep_alive", "params": []}', handleResponse);
                }

                if(isIdle === false) {
                    dbg("Emiting Idle");
                    mediator.event.emit('idle', {});
                }
                isIdle = true;
            }

        },

        enqueueRequest = function (method, params, accountIndex) {
            //'{"id": 1, "method": "blockchain.address.get_balance", "params": ["Rcv2GrdBV5F7Js4qwggrDjwzes69qpCJCB"]}'
            var data = {
                    id     : requestId,
                    method : method,
                    params : params,
                    accountIndex : accountIndex || false
                },
                string = JSON.stringify(data);

            requestId++;
            queue.push(string);
        },

        selectServer = function(){
            var num = Math.random()*availableServers.length;
            selectedServer = availableServers[Math.floor(num)];
        },

        getAddressHistory = function (address) {
            enqueueRequest(that.types.history, [address.toString()]);
        },

        getAddressBalance = function (address) {
            enqueueRequest(that.types.balance, [address.toString()]);
        },

        subscribeToAddress = function (address) {
            enqueueRequest(that.types.subscribe, [address.toString()]);
        };


    selectServer();

    this.getSelectedServer = function(){
        return selectedServer;
    };

    this.addListener = function(name, callback) {
        mediator.event.on(name, callback);
    };

    this.broadcastTransaction = function(signedTransaction, accountIndex) {
        enqueueRequest(that.types.broadcast, [signedTransaction], accountIndex);
    };

    this.updateAddress = function (address) {
        getAddressHistory(address);
        getAddressBalance(address);
    };

    this.getTransaction = function (hash) {
        enqueueRequest(that.types.transaction, [hash]);
    };

    this.newAddress = function (address) {
        subscribeToAddress(address);
    };

    this.start = function () {
        var addresses = this.wallet.getAddresses('all');
        this.instantiating();

        addresses.forEach(function (address) {
            this.newAddress(address);
        }, this);

        intervalId = setInterval(update, requestDelayMs);

        mediator.event.on('addressCreated', function(data){
            that.newAddress(data.address);
        });
        mediator.event.on('transactionAdded', function(hash){
            //console.log("Need transaction: " + hash);
            that.getTransaction(hash);
        });
    };

    this.stop = function () {
        clearInterval(intervalId);
    };

});

module.exports = {

    start : function (wallet) {
        var monitor = stampit.compose(instantiable, CookieManager, ResponseParser, Monitor).create();
        monitor.setWallet(wallet);
        monitor.start();
        return monitor;
    }
};