var stampit = require('stampit');
var instantiable = require("../attributes/Instantiable");
var ResponseParser = require("./ResponseParser");
var CookieManager = require("./CookieManager");
var http = require('http');
var bitcore = bitcore || require('bitcore');
var WalletKey = bitcore.WalletKey;

var Monitor = stampit().enclose(function () {

    var queue = [],
        that = this,
        requestId = 1,
        lastRequest = 0,
        intervalId,
        seconds = 1,

        postData = function(data, callback){
            var cb = callback || function(){};
            var options = {
                host: 'uk.rddelectrum.com',
                protocol: 'http:',
                port: '8081',
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json-rpc',
                    'Content-Length': data.length
                }
            };

            // Set up the request
            var request = http.request(options, function(response) {
                var responseData = '';
                //response.setEncoding('utf8');
                response.on('data', function (chunk) {
                    responseData = responseData + chunk;
                });
                response.on('end', function () {
                    try{
                        responseData = JSON.parse(responseData);
                    }
                    catch(e){

                    }
                    cb(responseData);
                });
            });

            // post the data
            request.write(data);
            request.end();
            lastRequest = new Date() / 1000;
        },

        handleResponse = function(response){

            if(typeof response === 'string' && response.indexOf("session not found") > 0){
                console.log(response);
                console.log('Clearing cookies');
                that.clearCookies();
            }
            else {
                that.processResponse(response);
            }

        },

        update = function () {
            var now = new Date() / 1000,
                secondsSinceRequest = now - lastRequest,
                currentRequest;
//            var currentQueue;
            // Clone the queue then empty it immediately afterwards.
            // Should prevent anything from being added while we're building/sending the update request.
//            currentQueue = queue.slice(0);
//            queue = [];

            if(queue.length > 0 ){
                currentRequest = queue.shift();
                that.addPendingRequest(JSON.parse(currentRequest));
                postData(currentRequest, handleResponse);
            }
            else if(queue.length === 0 && secondsSinceRequest > 30){
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
            enqueueRequest(that.types.history, [ address.toString() ]);
        },

        getAddressBalance = function (address) {
            enqueueRequest(that.types.balance, [ address.toString() ]);
        },

        subscribeToAddress = function (address) {
            enqueueRequest(that.types.subscribe, [ address.toString() ]);
        };

    this.getTransaction = function (hash) {
        enqueueRequest(that.types.transaction, [ hash ]);
    };

    this.newAddress = function (address) {
        getAddressHistory(address);
        getAddressBalance(address);
        subscribeToAddress(address);
    };

    this.start = function () {
        var addresses = this.wallet.getAddresses();
        this.instantiating();

        addresses.forEach(function (address) {
            this.newAddress(address);
        }, this);

        intervalId = setInterval(update, 1000 * seconds);
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