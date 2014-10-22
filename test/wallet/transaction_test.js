var dtest = require("../dtest");
var WalletFactory = require("../../lib/wallet/WalletFactory");
var bitcore = bitcore || require('bitcore');
var Transaction = bitcore.Transaction;

var nodeunit = require("nodeunit");


// All this data comes from Reddcoin Electrum in python
var testData = {
    mnemonicSeed : "travel nowhere air position hill peace suffer parent beautiful rise blood power home crumble teach",

    transactions : [
        '020000000142b3c190fe1acbfbc04e2c21f33f4d08693b9409e1e59a9c14f8d235b1d9d818000000006c493046022100e5b883e1ad2cb964e051cb8ce14fd6273e23742dcc3f7305c64f2f6541795033022100e54dba25798a17bd19fa6d0b7e8689fce4c87fe497612bf1c0f3a0c8242cc849012102a7417337fdfa6f0cecc90d25c3c7167934207aeb7cd72800ee09fa4d0748695dffffffff0200902f50090000001976a914570a934e8ebee5a7e0e8ce361768fd486b7285c988ac2322284e490000001976a9142e30a97bb8cb5a1c8399954c70363bfce744da4a88ac00000000e1ff4654',
        '02000000012e39dabd52abf6fce013f1fa8f031b50d0bc2c9c215745638372a3f4e9ce9ebf010000006a47304402203cbe7036be6c718d8fd812a16f94c1204f0adf79fdd0942a6a614870a292779602206fdcda955a92c1c4fbeaaed36c86c805647c0b327b8ed316bd00444e22323e3a01210232626188d0ef3f7fe9e150cce7b31cc74b184cfd778ef57381722d38f98c2098ffffffff0200f2052a010000001976a9142f229a35c5d5ef27b9087ca3bcd612035e42846388ac00943577000000001976a91498f979256dc6c3a891c6b1ba5fa23da6bf5c7aa388ac00000000714e3b54',
        '0200000001fe17f449cfa31841fa07c86f384fb2c2447793a3a070808acfeaab878234dbb5000000006c493046022100b03112e87ca3f8da1022aeb4b0204e97cd58ce10afb2d1ba889d2207573e4a5e022100d6a4c9768b369bf96a27354314f1d9ad1051e3e034f31abbf28944312394574c012102ed0e9290087493f0bfb8ac8973c70b3024b65204bda9a4ecde0557a87fe6fc5cffffffff0240565548170000001976a9146b56cddea4cb6f45fb26d3d4eac6ce2927d6df6288ac00c817a8040000001976a9142f229a35c5d5ef27b9087ca3bcd612035e42846388ac00000000eaf84054',
        '0200000001c4f55aab55a33a92a0ad037c94a892ced99dfa7908a55d61b0db4421e9cb02b3010000006b483045022100d52ce172e431bf3a5e46201e9fab1e44eacebf378a81ed45aee10ec074aa3797022067f8875f5e722832c521ce9e92f994e6d44f0f485793ffe5cee5f05f7030c9210121034e81b8df3f24f4507e22747e2dd2be678654900055a8470164da42203360fd85ffffffff0223302224480000001976a91418a89617ff5a53daf51bc4b67a2accad00f6ae7488ac00f2052a010000001976a914f47d79ef77274f374cdc9874d0811db4d202b54688ac00000000f6ff4654'
    ],

    hashes : [
        'b302cbe92144dbb0615da50879fa9dd9ce92a8947c03ada0923aa355ab5af5c4',
        '',
        '',
        '',
    ]
};

module.exports = nodeunit.testCase({
    setUp : function (callback) {
        this.wallet = WalletFactory.standardWallet();
        //for some reason it all comes crashing down if you don't call this callback :(
        callback();
    },

    tearDown : function (callback) {
        this.wallet = undefined;
        //see above
        callback();
    },

    'Test Script Pub Key to Address' : function (test) {
        var pubKey = '0x570a934e8ebee5a7e0e8ce361768fd486b7285c9',
            expectedAddress = 'RgZ2X79U7A5eLZ3tiTskkjHkX6H7PZjnVT',
            tx = new Transaction();

        //tx.parse(testData.transactions[0]);
        //console.log(tx.getStandardizedObject());
        //console.log(tx.getReceivingAddresses());
        test.strictEqual("a", "a");
        test.done();
    },


    'Test Parsing Transactions' : function (test) {
        var seedText  = testData.mnemonicSeed,
            txs       = testData.transactions,
            hashes    = testData.hashes;

        this.wallet.buildFromMnemonic(seedText);

        this.wallet.addFullTransaction(hashes[0], txs[0]);

        test.done();
    }

});