var stampit = require('stampit');

/**
 * This is a simple mixin that will ensure an operation only occurs once during the lifetime of an object.
 *
 * This is useful with a wallet for instance. Once it has built its data structures from one of several methods, we
 * don't want to repeat that initial setup ever again. Simply calling `instantiating` before building will ensure that
 * doesn't happen.
 *
 * @type {*|Object}
 */
var Instantiable = stampit().enclose(function() {
    var operations = {};

    /**
     * Throws an error if an object tries to repeat an operation that should only occur once in its lifetime.
     *
     * @param operationName - The name of the operation that can only occur once.
     */
    this.instantiating = function(operationName){
        operationName = operationName || "instantiate";

        if(operations.hasOwnProperty(operationName)){
            throw new Error("Cannot repeat operation: " + operationName);
        }

        operations[operationName] = true;
    };
});

module.exports = Instantiable;