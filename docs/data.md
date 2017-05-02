@module {jQuery} can-jquery/data can-jquery/data
@parent can-jquery.modules

@description Integrates the data functions of CanJS and jQuery.


Importing can-jquery/data will return the [jQuery object](http://api.jquery.com/jquery/). It will also import all non-legacy [can-jquery] features for event binding and dispatch.

```js
var $ = require("can-jquery/data");
```

@body

Importing `can-jquery/data` will also bring in [can-jquery], but also has the side effect of enabling jQuery data functions synchronizing with the [can-util/dom/data/data CanJS data store] and vice versa.

This means that data set via the [can-util/dom/data/data.set `domData.set`] function will be available when calling [`jQuery.data()`](https://api.jquery.com/jquery.data/) or [`jQuery.fn.data()`](https://api.jquery.com/data/) as a getter; conversely, using `jQuery.data()` or `jQuery.fn.data()`  as a setter and calling [can-util/dom/data/data.get `domData.get`] will again make the set data available on get.

```js
var $ = require("can-jquery/data");
var domData = require("");

var $el = $("<div></div>");

$el.data("foo", "bar");
domData.get.call(el[0], "foo") // -> "bar"

domData.set.call(el[0], { baz:  "quux" });
$el.data(); // -> { "foo": "bar", "baz": "quux" }
```

