var stampit = require('stampit');

var CookieManager = stampit().enclose(function () {

    var doClear = function (cookies) {

        cookies.forEach(function (cookie) {
            var details = {
                url     : 'http://' + cookie.domain + cookie.path,
                name    : cookie.name,
                storeId : cookie.storeId
            };

            chrome.cookies.remove(details, function (removed) {
                //                console.log("Removed: ");
                //                console.log(removed);
                //                console.log(chrome.runtime.lastError);
            });
        });

    }

    this.clearCookies = function () {
        try {
            var search = {};
            chrome.cookies.getAll(search, doClear);

        }
        catch (e) {
            //pass for node, etc
            console.log("Could not clear cookies");
        }
    };

});

module.exports = CookieManager;