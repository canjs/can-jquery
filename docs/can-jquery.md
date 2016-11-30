@module {jQuery} can-jquery can-jquery
@parent can-ecosystem
@group can-jquery.modules 0 Modules
@group can-jquery.fns 1 Methods
@package ../package.json

@description Extensions to the event system so that can events and jQuery events are cross-bound.

@signature `jQuery`

Importing `can-jquery` will return the [jQuery object](http://api.jquery.com/jquery/) and wire up the event system.

```js
var $ = require("can-jquery");

var div = $("<div>");

div.on("inserted", function(){
	// it inserted!
});

$("body").append(div);
```

@body

Using `can-jquery` causes the two event systems to be cross-bound. You can listen to special events within [can-stache-bindings] using jQuery and you can listen to custom jQuery events within [can-control]s.

## Listening to inserted/removed events

Using `can-jquery` you can listen to the removed/inserted event on an element.

```js
var $ = require("can-jquery");

var el = $("<div>");

el.on("inserted", function(){
	// The element was inserted.
});

$(document.body).append(el);
```

## Listening to jQuery events within Controls

Inside a [can-control] you can listen to any custom jQuery events.

```js
var $ = require("can-jquery");
var Control = require("can-control");

var MyControl = Control.extend({
	"names-added": function(el, ev, first, second, third){
		// first is "Matthew"
		// second is "David"
		// third is "Brian"
	}
});

var dom = $("<div><ul></ul></div>");

new MyControl(dom);

dom.find("ul").trigger("names-added", [
	"Matthew",
	"David",
	"Brian"
]);
```
