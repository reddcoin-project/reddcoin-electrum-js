var stampit        = require('stampit'),
    instantiable   = require("../attributes/Instantiable"),
    ResponseParser = require("./ResponseParser"),
    CookieManager  = require("./CookieManager"),
    http           = require('http'),
    bitcore        = bitcore || require('bitcore'),
    WalletKey      = bitcore.WalletKey;

var Monitor = stampit().enclose(function () {

    var queue = [],
        that = this,
        requestId = 1,
        requestDelayMs = 700,
        lastRequest = 0,
        intervalId,

        postData = function (data, callback) {
            var cb = callback || function () {
                };
            var options = {
                host     : 'uk.rddelectrum.com',
                protocol : 'http:',
                port     : '8081',
                path     : '/',
                method   : 'POST',
                headers  : {
                    'Content-Type'   : 'application/json-rpc',
                    'Content-Length' : data.length
                }
            };

            // Set up the request
            var request = http.request(options, function (response) {
                var responseData = '';
                //response.setEncoding('utf8');
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

            if (typeof response === 'string' && response.indexOf("session not found") > 0) {
                console.log(response);
                console.log('Clearing cookies');
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
                    that.processResponse(resp);
                });
            }

        },

        update = function () {
            var now = new Date() / 1000,
                secondsSinceRequest = now - lastRequest,
                currentRequest;

            if (queue.length > 0) {
                currentRequest = queue.shift();
                that.addPendingRequest(JSON.parse(currentRequest));
                postData(currentRequest, handleResponse);
            }
            else if (queue.length === 0 && secondsSinceRequest > 30) {
                postData('{"id": null, "method": "node.keep_alive", "params": []}', handleResponse);
            }

        },

        enqueueRequest = function (method, params) {
            //'{"id": 1, "method": "blockchain.address.get_balance", "params": ["Rcv2GrdBV5F7Js4qwggrDjwzes69qpCJCB"]}'
            var data = {
                    id     : requestId,
                    method : method,
                    params : params
                },
                string = JSON.stringify(data);

            requestId++;
            queue.push(string);
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

    this.broadcastTransaction = function(signedTransaction) {
        enqueueRequest(that.types.broadcast, [signedTransaction]);
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
        var addresses = this.wallet.getAddresses();
        this.instantiating();

        addresses.forEach(function (address) {
            this.newAddress(address);
        }, this);

        intervalId = setInterval(update, requestDelayMs);
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