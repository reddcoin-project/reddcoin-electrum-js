var stampit            = require('stampit'),
    Transaction        = require('./Transaction'),
    bitcore            = bitcore || require('bitcore'),
    util               = bitcore.util,
    TransactionBuilder = bitcore.TransactionBuilder;

var TxBuilder = stampit().enclose(function () {
    var test = '',

        getAddressProp = function (property, address, addresses) {
            var prop = false,
                found;

            found = addresses.some(function (Address) {
                if (Address.toString() === address) {
                    prop = Address.toString(property);
                    return true;
                }
            });

            if (!found) {
                throw new Error("Address: " + address + " could not be located.");
            }

            return prop;
        },

        formatUtxos = function (utxos, addresses) {
            var newUtxos = [];

            utxos.forEach(function (utxo) {

                newUtxos.push({
                    address       : utxo.payTo,
                    txid          : utxo.txid,
                    scriptPubKey  : utxo.scriptPubKey,
                    vout          : utxo.vout,
                    amount        : util.formatValue(utxo.value),
                    confirmations : 10
                });

            });
            return newUtxos;
        };

    this.createTransaction = function (amount, to, utxos, addresses) {
        var formattedUtxos = formatUtxos(utxos, addresses),
            opts = {
//                remainderOut : {
//                    address : 'Rcv2GrdBV5F7Js4qwggrDjwzes69qpCJCB'
//                }
            },
            outs = [{
                        address : to,
                        amount  : amount
                    }],
            builder = new TransactionBuilder(opts);

        builder.setUnspent(formattedUtxos).setOutputs(outs);

        var selectedUnspent = builder.getSelectedUnspent();

        var privateKeys = [];

        selectedUnspent.forEach(function (unspent) {
            var priv = getAddressProp('priv', unspent.address, addresses);

            dbg("priv: " + priv);
            privateKeys.push(priv);
        });

        builder.sign(privateKeys);

        if (builder.isFullySigned()) {
            var tx = builder.build();
            dbg(tx);
            dbg(Transaction.createFromRaw(tx.serialize().toString('hex')).get());
            return tx.serialize().toString('hex');
        }

        dbg("Sending " + amount + " to: " + to);
        dbg(selectedUnspent);
        dbg(formattedUtxos);
        throw new Error("Could not sign transaction");
    }
});

module.exports = {

    create : function () {
        return stampit.compose(TxBuilder).create();
    }
};