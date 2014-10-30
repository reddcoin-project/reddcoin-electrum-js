var stampit     = require('stampit'),
    config      = require('../../configuration.js'),
    bitcore     = bitcore || require('bitcore'),
    buffertools = bitcore.buffertools,
    util        = bitcore.util,
    Tx          = bitcore.Transaction;

var Transaction = stampit().enclose(function () {
    var data = {
        version   : false,
        timestamp : false,
        locktime  : false,
        hash      : false,
        size      : false,
        inputs    : [],
        outputs   : []
    };

    this.createFromRaw = function (rawTxBuffer) {
        var tx, outputAddresses, inputAddresses;

        tx = new Tx();
        tx.parse(rawTxBuffer);
        outputAddresses = tx.getReceivingAddresses();
        inputAddresses = tx.getSendingAddresses();

        data.version = tx.version;
        data.timestamp = tx.timestamp;
        data.locktime = tx.lock_time;
        data.hash = util.formatHashFull(tx.getHash());
        data.size = tx.getSize();

        tx.outs.forEach(function (out, i) {
            var script = out.getScript(),
                type = false;

            if (script.isPubkeyHash()) {
                type = 'TX_PUBKEYHASH';
            }
            if (script.isPubkey()) {
                type = 'TX_PUBKEY';
            }

            if (type === false) {
                throw new Error("Unsupported Transaction Type.");
            }

            data.outputs.push({
                txid         : data.hash,
                vout         : i,
                type         : type,
                scriptPubKey : bitcore.buffertools.toHex(script.buffer),
                payTo        : outputAddresses[i],
                value        : out.getValue()
            });
        });

        tx.ins.forEach(function (input, i) {
            data.inputs.push({
                output  : {
                    hash  : buffertools.reverse(new Buffer(input.getOutpointHash())).toString('hex'),
                    index : input.getOutpointIndex()
                },
                payFrom : inputAddresses[i]
            });
        });
    };

    this.get = function (property) {
        //TODO: clone this a more efficient way.
        var copy = JSON.parse(JSON.stringify(data));

        if (property !== undefined && copy.hasOwnProperty(property)) {
            return copy[property];
        }

        return copy;
    };

    this.getSummary = function (addressList) {
        var allinputsMine = true,
            totalOutputs = 0,
            gained = 0,
            lost = 0,
            receivedWith = [],
            sentTo = [],
            total, ret,
            isMine = function (address) {
                return addressList.hasOwnProperty(address);
            };

        data.outputs.forEach(function (output) {
            totalOutputs += output.value;
            if (isMine(output.payTo)) {
                gained += output.value;
                receivedWith.push(output.payTo);
            }
            else {
                sentTo.push(output.payTo);
            }
        });

        data.inputs.forEach(function (input) {
            if (!isMine(input.payFrom)) {
                allinputsMine = false;
            }
        });

        if (allinputsMine) {
            lost += totalOutputs;
        }

        total = gained - lost;

        ret = {
            total : total,
            time  : data.timestamp,
            id    : data.hash
        };

        if (total > 0) {
            ret.type = 'Received';
            ret.address = receivedWith[0];
        }
        else {
            ret.type = 'Sent';
            if(sentTo.length === 0){
                ret.address = 'Self Transaction';
            }
            else {
                ret.address = sentTo[0];
            }
        }

        return ret;
    };
});

module.exports = {
    createFromRaw : function (rawTx) {
        var tx = stampit.compose(Transaction).create();

        if (typeof rawTx === 'string') {
            rawTx = new Buffer(rawTx, 'hex')
        }

        tx.createFromRaw(rawTx);
        return tx;
    }
};