# can-jquery

[![Build Status](https://travis-ci.org/canjs/can-jquery.png?branch=master)](https://travis-ci.org/canjs/can-jquery)

CanJS integrations for jQuery

- <code>[__can-jquery__ jQuery](#can-jquery-jquery)</code>
  - <code>[__can-jquery/legacy__ jQuery](#can-jquerylegacy-jquery)</code>

## API

## can-jquery `{jQuery}`

Extensions to the event system so that can events and jQuery events are cross-bound. 
Importing can-jquery will return the [jQuery object](http://api.jquery.com/jquery/) and wire up the event system.

```js
var $ = require("can-jquery");

var div = $("<div>");

div.on("inserted", function(){
	// it inserted!
});

$("body").append(div);
```




### <code>jQuery</code>

### can-jquery/legacy `{jQuery}`

Enables legacy integrations between CanJS and jQuery. 
Importing can/jquery/legacy will return the [jQuery object](http://api.jquery.com/jquery/). It will also import [can-jquery](#can-jquery-jquery) so that the event system hooks are set up.

Additionally it will force element callbacks (such as those in [can-control]) to be jQuery wrapped.

```js
var $ = require("can-jquery/legacy");
```




#### <code>jQuery</code>


## Contributing

### Making a Build

To make a build of the distributables into `dist/` in the cloned repository run

```
npm install
node build
```

### Running the tests

Tests can run in the browser by opening a webserver and visiting the `test.html` page.
Automated tests that run the tests from the command line in Firefox can be run with

```
npm test
```
