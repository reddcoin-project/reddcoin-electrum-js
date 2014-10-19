var wallet = {
    create: function(seed){
        var electrum = require('electrum'),
            wallet = electrum.WalletFactory.standardWallet();
        seed = $.trim(seed);

        wallet.buildFromMnemonic(seed);

        $("#addresses").empty();

        $.each(wallet.getAddresses(), function(i, addr){
            $("#addresses").append('<p>'+addr+'</p>');
        });
    }
}



$(function(){
    $('#importButton').click(function(){
        wallet.create($('#walletSeed').val());
    });
});