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
        requestDelayMs = 200,
        lastRequest = 0,
        currentCookie = false,
        sentRequests = [],
        receivedResponses = [],
        //since chrome requires all external communication to be explicitly granted, this will always need to be a hardcoded list.
        availableServers = [
            //'uk.rddelectrum.com',
            //'rdd.riditt.de',
            //'reddwallet.org' ,
            'electrum01.redd.ink'

        ],
        selectedServer = false,
        intervalId,
        walletWS,
        wsport = 8001,

        // WebSocket Connection implementation
        doConnect = function () {
            dbg("ws doConnect")
            walletWS = new WebSocket('ws://' + selectedServer + ':' + wsport);
            walletWS.onopen = function(evt) { onOpen(evt) };
            walletWS.onclose = function(evt) { onClose(evt) };
            walletWS.onmessage = function(evt) { onMessage(evt) };
            walletWS.onerror = function(evt) { onError(evt) };
        },

        onOpen = function (evt) {
            dbg("ws onOpen")
            var msg = {
                text: "Connected\n",
                status: "connected"
            }
            writeToScreen(msg);
        },

        onClose = function (evt) {
            dbg(evt)
            dbg("ws onClose")
            var msg = {
                text: "Disconnected\n",
                status: "disconnected"
            }
            writeToScreen(msg);
        },

        onMessage = function (evt) {
            dbg("ws onMessage")
            dbg(evt)
            const blob = evt.data;

            var reader = new FileReader();

            reader.onloadend = function () {
                console.log(reader.result);
                handleResponseWS( reader.result);
              };
             reader.readAsText(blob)
        },

        onError = function (evt) {
            dbg("ws onError")
            var msg = {
                text: 'error: ' + evt.data + '\n',
                status: "error"
            }
            writeToScreen(msg);
            walletWS.close();
        },

        doSend = function (data) {
            dbg("ws doSend")
            console.log(data)
     
            writeToScreen(data);
            const blob = new Blob([data, "\n"], {type: 'text/plain'});
            
            walletWS.send(blob);    
            
        },

        writeToScreen = function (message) {
            dbg("ws writeToScreen")
            dbg(message)
        },

        sendText = function (data, callback) {
            dbg("ws sendText")
            console.log(data)

            var cb = callback || function () {
                };

            data = JSON.parse(data);
            if(data.hasOwnProperty("accountIndex")){
                delete data.accountIndex;
            }
            if(data.hasOwnProperty("reddTx")){
                delete data.reddTx;
            }
            sentRequests.push(data);
            data = JSON.stringify(data);



            // send
            doSend( data );
            lastRequest = new Date() / 1000;
        },

        doDisconnect = function () {
            dbg("doDisconnect")
            walletWS.close();
        },

        doServerVersion = function () {
            var data = {
                id       : requestId,
                method   : "server.version",
                params   : ["Browser Extension 0.1.0", "1.1"]
            };

            string = JSON.stringify(data);
            requestId++;
            queue.push(string);
        };

        doPing = function () {
            // For electrum protocol 1.2
            var data = {
                method   : "ping",
                params   : []
            },

            string = JSON.stringify(data);
            requestId++;
            queue.push(string);
        };


        updateWS = function () {
            var now = new Date() / 1000,
                secondsSinceRequest = now - lastRequest,
                currentRequest;

            if (walletWS.readyState === 0 ) {
                console.log("Not Connected... Waiting to establish")
                return;
            } else if (walletWS.readyState === 2 || walletWS.readyState === 3 ){
                console.log("Not Connected... Trying to establish")
                if(secondsSinceRequest > 10) {
                    doConnect()
                    return;
                }
            }

            if (queue.length > 0) {
                console.log("%cCurrent Queue: " + queue.length, "color:blue;");
                isIdle = false;
                currentRequest = queue.shift();
                that.addPendingRequest(JSON.parse(currentRequest));
                sendText(currentRequest, handleResponseWS);
            }
            //no queue to process
            else if (queue.length == 0) {
                //send keep alive if its been a while.
                if(secondsSinceRequest > 30) {
                    console.log("%cCurrent Queue: " + queue.length, "color:blue;");
                    //postData('{"id": null, "method": "node.keep_alive", "params": []}', handleResponse);
                    doServerVersion()
                }

                if(isIdle === false) {
                    dbg("Emiting Idle");
                    console.log("Emiting Idle");
                    console.log("Sent Requests:");
                    console.log(sentRequests);
                    console.log("Received Responses:");
                    console.log(receivedResponses);
                    sentRequests = [];
                    receivedResponses = [];
                    mediator.event.emit('idle', {});
                }
                isIdle = true;
            }

        },

        handleResponseWS = function (response) {

            if(!response){
                dbg("Empty Response");
                return;
            }
            response = JSON.parse(response)

            // Sometimes the response is an array.
            // We'll force it to an array to handle them all the same way.
            var isArray = Array.isArray(response);
            if(!isArray){
                response = [response];
            }

            response.forEach(function(resp){
                var req = that.processResponse(resp);
                receivedResponses.push(resp);
                mediator.event.emit('dataReceived', {
                    response: resp,
                    request : req
                });
            });

        },



        postData = function (data, callback) {
            var cb = callback || function () {
                };


            data = JSON.parse(data);
            if(data.hasOwnProperty("accountIndex")){
                delete data.accountIndex;
            }
            sentRequests.push(data);
            data = JSON.stringify(data);

            var options = {
                host     : selectedServer,
                protocol : 'http:',
                port     : '8081',
                path     : '/',
                method   : 'POST',
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
                        //console.log("Error parsing json: " + responseData);
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
                    receivedResponses.push(resp);
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
                console.log("%cCurrent Queue: " + queue.length, "color:blue;");
                isIdle = false;
                currentRequest = queue.shift();
                that.addPendingRequest(JSON.parse(currentRequest));
                postData(currentRequest, handleResponse);
                //if no cookie has been set yet, we should re-send the request because it will fail without a session.
                if(currentCookie === false && chrome === undefined){
                    queue.push(currentRequest);
                }
            }
            //no queue to process
            else if (queue.length == 0) {
                //send keep alive if its been a while.
                if(secondsSinceRequest > 60) {
                    //console.log("%cCurrent Queue: " + queue.length, "color:blue;");
                    //postData('{"id": null, "method": "node.keep_alive", "params": []}', handleResponse);
                        var data = {
                            id       : requestId,
                            method   : "server.version",
                            params   : ["0.0.1", "0.6"]
                        },
                        string = JSON.stringify(data);
                    requestId++;
                    queue.push(string);
                }

                if(isIdle === false) {
                    dbg("Emiting Idle");
                    console.log("Emiting Idle");
                    console.log("Sent Requests:");
                    console.log(sentRequests);
                    console.log("Received Responses:");
                    console.log(receivedResponses);
                    sentRequests = [];
                    receivedResponses = [];
                    mediator.event.emit('idle', {});
                }
                isIdle = true;
            }

        },

        enqueueRequest = function (method, params, accountIndex = false, reddTx = false) {
            //'{"id": 1, "method": "blockchain.address.get_balance", "params": ["Rcv2GrdBV5F7Js4qwggrDjwzes69qpCJCB"]}'
            var data = {
                    id     : requestId,
                    method : method,
                    params : params,
                    accountIndex : accountIndex,
                    reddTx : reddTx
                },
                string = JSON.stringify(data);

            requestId++;
            queue.push(string);
        },

        selectServer = function(){
            var num = Math.random()*availableServers.length;
            selectedServer = availableServers[Math.floor(num)];
            console.log("%cSelected Server: " + selectedServer, "color:blue;");
        },

        getAddressHistory = function (address) {
            console.log("%cgetAddressHistory: " + address.toString(), "color:blue;");
            enqueueRequest(that.types.history, [address.toString()]);
        },

        getAddressBalance = function (address) {
            console.log("%cgetAddressBalance: " + address.toString(), "color:blue;");
            enqueueRequest(that.types.balance, [address.toString()]);
        },

        subscribeToAddress = function (address) {
            console.log("%csubscribeToAddress: " + address.toString(), "color:blue;");
            enqueueRequest(that.types.subscribe, [address.toString()]);
        };


    selectServer();

    this.getSelectedServer = function(){
        return selectedServer;
    };

    this.addListener = function(name, callback) {
        mediator.event.on(name, callback);
    };

    this.broadcastTransaction = function(signedTransaction, accountIndex, reddTx, highfees=false) {
        
        if (highfees){
            console.log("%cbroadcastTransaction: highfees" + highfees, "color:blue;");
            enqueueRequest(that.types.broadcast, [signedTransaction, highfees], accountIndex, reddTx);    
        } else {
            console.log("%cbroadcastTransaction:", "color:blue;");
            enqueueRequest(that.types.broadcast, [signedTransaction], accountIndex, reddTx);
        }
    };

    this.updateAddress = function (address) {
        getAddressBalance(address);
        getAddressHistory(address);
    };

    this.updateAddressBalance = function (address) {
        getAddressBalance(address);
    };

    this.getTransaction = function (hash) {
        console.log("Requestion Transaction:");
        console.log(hash);
        console.log("hash ^");

        if(hash == undefined || hash == "undefined"){
            console.log("undefined hash");
            console.trace();
            return;
        }

        if(hash.transaction != undefined){
            hash = hash.transaction.hash;
            console.log("Bad Hash.");
            console.trace();
        }
        enqueueRequest(that.types.transaction, [hash]);
    };

    this.newAddress = function (address) {
        subscribeToAddress(address);
    };

    this.transactionRejected = function(tx){
        mediator.event.emit('transactionFailed', tx);
    }

    this.start = function () {
        var addresses = this.wallet.getAddresses('all');
        this.instantiating();
        doServerVersion()

        addresses.forEach(function (address) {
            this.newAddress(address);
        }, this);

        addresses.forEach(function (address) {
            this.updateAddress(address);
        }, this);

        //intervalId = setInterval(update, requestDelayMs);
        doConnect();
        intervalId = setInterval(updateWS, requestDelayMs);

        mediator.event.on('addressCreated', function(data){
            that.newAddress(data.address);
        });
        mediator.event.on('transactionNeeded', function(hash){
            console.log("Need transaction: " + hash);
            //console.log("not fetching created tx");
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