# reddcoin-electrum-js [![Build Status](https://secure.travis-ci.org/reddcoin-project/reddcoin-electrum-js.png?branch=master)](http://travis-ci.org/reddcoin-project/reddcoin-electrum-js)

Implementation of electrum in javascript

## Notes

After npm install, to build, rename reddcore folder in node_modules to bitcore and everything will work

## Getting Started

```javascript
Using a module and trying to build in browser is current bugged however a browser package can still be generated and included in your application. see documentation below for instructions
```

## Documentation
To use the web browser electrum wrapper you will need to update the server location in `./lib/network/monitor.js`. Once you have done this, install `grunt-cli` using npm and the global flag, from the root you can then run grunt build in console to generate a new electrum.js file in `./build/`

You only need to include this single electrum.js file

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Andrew Groff
Licensed under the Proprietary license.
