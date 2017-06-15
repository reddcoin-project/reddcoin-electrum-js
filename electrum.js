
global.dbg = function(item){
  console.log(item);
};

module.exports = {
    _              : require('lodash'),
    WalletFactory  : require('./lib/wallet/WalletFactory'),
    NetworkMonitor : require('./lib/network/Monitor')
}