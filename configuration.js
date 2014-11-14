module.exports = {
    bip44 : {
        purpose : "44",
        // Reddcoin type is 4. @TODO Switch to this soon.
        // coin_type : "4",
        coin_type : "0"
    },

    password : {
        salt : '7b54696484dcc638fb84afc502d473bd77636794b695c7a42a12e6ec77499c9bfffc766bf1eab882',
        iterations : 2000,
        keylen : 256
    },

    stopGap : 5,

    accounts : {
        max : 10
    },

    bitcoreModules : [
        'lib/Address',
//        'lib/AuthMessage',
//        'lib/Base58',
        'lib/HierarchicalKey',
//        'lib/BIP21',
        'lib/BIP39',
        'lib/BIP39WordlistEn',
//        'lib/Block',
//        'lib/Bloom',
//        'lib/Connection',
//        'lib/Deserialize',
//        'lib/ECIES',
//        'lib/Electrum',
//        'lib/Message',
//        'lib/NetworkMonitor',
//        'lib/Opcode',
//        'lib/PayPro',
//        'lib/Peer',
//        'lib/PeerManager',
//        'lib/PrivateKey',
//        'lib/RpcClient',
//        'lib/Key',
//        'lib/Point',
//        'lib/SIN',
//        'lib/SINKey',
//        'lib/Script',
//        'lib/ScriptInterpreter',
//        'lib/SecureRandom',
//        'lib/sjcl',
        'lib/Transaction',
        'lib/TransactionBuilder',
//        'lib/Wallet',
        'lib/WalletKey',
//        'patches/Buffers.monkey',
//        'patches/Number.monkey',
//        'config',
//        'const',
        'networks',
//        'util/log',
        'util/util'
//        'util/EncodedData',
//        'util/VersionedData',
//        'util/BinaryParser'
    ]
}