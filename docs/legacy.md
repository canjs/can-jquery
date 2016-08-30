@module {jQuery} can-jquery/legacy can-jquery/legacy
@parent can-jquery.modules

@description Enables legacy integrations between CanJS and jQuery.

Importing can/jquery/legacy will return the [jQuery object](http://api.jquery.com/jquery/). It will also import [can-jquery] so that the event system hooks are set up.

Additionally it will force element callbacks (such as those in [can-control]) to be jQuery wrapped.

```js
var $ = require("can-jquery/legacy");
```

@body

Importing can-jquery/legacy will also bring in [can-jquery], but also has the side effect of enabling jQuery wrappers being applied to places such as [can-control]s and [can-stache-bindings.event] callbacks.

***Note*** that simply importing can-jquery-legacy will enable this, so any [can-control]s expecting to receive the raw [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) will break.

```js
var $ = require("can-jquery/legacy");
var Control = require("can-control");

var MyControl = Control.extend({
	"li click": function(el){
		// `el` is jQuery wrapped!
	}
});

var dom = $("<div><ul><li>First</li><li>Second</li></ul></div>");
new MyControl(dom);

dom.find("li:first").trigger("click");
```
