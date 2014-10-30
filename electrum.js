
global.dbg = function(item){
    console.log(item);
};

module.exports = {
    WalletFactory  : require('./lib/wallet/WalletFactory'),
    NetworkMonitor : require('./lib/network/Monitor')
}