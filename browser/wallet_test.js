var electrum = require('electrum'),
    bitcore  = require('bitcore'),
    rdd      = {
        wallet  : false,
        monitor : false,
        render  : function () {
            var that = this;
            $("#addresses").empty();
            $("#transactions").empty();

            $.each(this.wallet.getAddresses(), function (i, addr) {
                var val = bitcore.util.formatValue(addr.confirmed) + ' RDD';
                $("#addresses").append('<p>' + addr + ' - ' + val + '</p>');
            });

            $.each(this.wallet.getTransactions(), function (i, tx) {
                var val = bitcore.util.formatValue(tx.total) + ' RDD',
                    time = new Date(tx.time*1000).nice(),
                    addr = '<small>' + tx.address + ' - '+time+'</small>';
                $("#transactions").append('<p>' + tx.type + ': ' + val + '<br/>' + addr + '</p>');
            });

            setTimeout(function () {
                that.render();
            }, 1000);
        },
        create  : function (seed) {
            var monitor = electrum.NetworkMonitor;

            this.wallet = electrum.WalletFactory.standardWallet(),

                seed = $.trim(seed);

            this.wallet.buildFromMnemonic(seed);
            this.monitor = monitor.start(this.wallet);

            this.render();
        },
        send    : function () {
            var addr = $("#toAddress").val(),
                amount = $("#amount").val();
            this.wallet.send(amount, addr, this.monitor);
        }
    }

String.prototype.padLeft = function (length, character) {
    return new Array(length - this.length + 1).join(character || ' ') + this;
};

Date.prototype.nice = function () {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return months[this.getMonth()] + ' ' + this.getDate() + ', ' +
    [String(this.getHours()).padLeft(2, '0'),
     String(this.getMinutes()).padLeft(2, '0')].join(":");
};

$(function () {
    $("#sendButton").click(function () {
        rdd.send();
    });
    $('#importButton').click(function () {

        rdd.create($('#walletSeed').val());
    });
});