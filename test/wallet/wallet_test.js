var WalletFactory = require("../../lib/wallet/WalletFactory");
var nodeunit = require("nodeunit");

module.exports = nodeunit.testCase({
    setUp: function(callback){
        this.wallet = WalletFactory.standardWallet();
        //for some reason it all comes crashing down if you don't call this callback :(
        callback();
    },

    tearDown: function(callback){
        this.wallet = undefined;
        //see above
        callback();
    },

    /**
     * This is a very basic test to ensure that inheritance and factories and everything are working as expected.
     *
     * @param test - test suite object with assertion methods
     */
    'Test Inheritance': function (test) {
        var that = this,
            addresses = [
                'Rcv2GrdBV5F7Js4qwggrDjwzes69qpCJCB',
                'RgZ2X79U7A5eLZ3tiTskkjHkX6H7PZjnVT',
                'RoKgLYxEERXd9E9G4LXXBy8QSnzeJzRqYo',
                'RvuYFgHY6uCJPLaLek8fhsFzwbbNr9x2Ni',
                'RdbABKfs2gkT2ADWMR9P5ZaXCbeSbyLGEc',
                'RoKWjVB2PMUF3eJ6xTdp9NPCS2GUTGXzfm'
            ],
            secondWallet = WalletFactory.standardWallet(),
            currentAddresses;

        currentAddresses = this.wallet.getAddresses();
        test.deepEqual([], currentAddresses, 'should start empty');

        //override the public property if it exists
        this.wallet.addresses = [ addresses[0] ];

        currentAddresses = this.wallet.getAddresses();
        test.deepEqual([], currentAddresses, 'addresses should not be public');

        //add all addresses
        addresses.forEach(function (address) {
            that.wallet.addAddress(address);
        });

        currentAddresses = this.wallet.getAddresses();

        test.deepEqual(addresses, currentAddresses);

        test.equals(true, this.wallet.isDeterministic(), "standard wallet should override this to true");

        test.deepEqual([], secondWallet.getAddresses(), "make sure its instance safe and second wallet is still empty");

        test.done();
    },

    /**
     * The python electrum client generates these addresses from the given seed. Once this test passes we'll be doing well.
     * @param test
     */
    'Test Generates Addresses From Seed' : function(test){
        var addresses = [
                'Rcv2GrdBV5F7Js4qwggrDjwzes69qpCJCB',
                'RgZ2X79U7A5eLZ3tiTskkjHkX6H7PZjnVT',
                'RoKgLYxEERXd9E9G4LXXBy8QSnzeJzRqYo',
                'RvuYFgHY6uCJPLaLek8fhsFzwbbNr9x2Ni',
                'RdbABKfs2gkT2ADWMR9P5ZaXCbeSbyLGEc',
                'RoKWjVB2PMUF3eJ6xTdp9NPCS2GUTGXzfm'
            ],
            seed_text = "travel nowhere air position hill peace suffer parent beautiful rise blood power home crumble teach",
            password = "secret",
            newAddress;

        this.wallet.setMnemonicSeed(seed_text);
        newAddress = this.wallet.generateNewAddress();

        test.notStrictEqual(addresses.indexOf(newAddress), -1);
        test.done();
    }
});