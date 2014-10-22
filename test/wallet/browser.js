var electrum = require('electrum'),
    bitcore = require('bitcore'),
    rdd = {
    wallet : false,
    render: function(){
        var that = this;
        $("#addresses").empty();

        $.each(this.wallet.getAddresses(), function(i, addr){
            var val = bitcore.util.formatValue(addr.confirmed) + ' RDD';
            $("#addresses").append('<p>' + addr + ' - ' + val + '</p>');
        });

        setTimeout(function(){
            that.render();
        }, 1000);
    },
    create: function(seed){
        var monitor = electrum.NetworkMonitor;

        this.wallet = electrum.WalletFactory.standardWallet(),

        seed = $.trim(seed);

        this.wallet.buildFromMnemonic(seed);
        monitor.start(this.wallet);

        this.render();
    }
}



$(function(){
    $('#importButton').click(function(){
        rdd.create($('#walletSeed').val());
    });
});