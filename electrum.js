global.dbg = function(item){
    //console.log(item);
};

module.exports = {
    _              : require('lodash'), // just because..
    WalletFactory  : require('./lib/wallet/WalletFactory'), // browser side wallet creation
    NetworkMonitor : require('./lib/network/Monitor'), // connection layer
    Mediator      : require("./lib/network/mediator") // events handler
}