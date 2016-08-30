var QUnit = require("steal-qunit");
var Control = require("can-control");
var $ = require("can-jquery/legacy");
var mutate = require("can-util/dom/mutate/mutate");
require("can-util/dom/events/inserted/inserted");
require("can-util/dom/events/removed/removed");
var MO = require("can-util/dom/mutation-observer/mutation-observer");
var domEvents = require("can-util/dom/events/events");
var domData = require("can-util/dom/data/data");
var Map = require("can-map");

QUnit.module('can-controls');

QUnit.test("this.element is jQuery wrapped", function(){
	var MyThing = Control.extend({
		init: function(){
			QUnit.ok(this.element instanceof $, "it is jQuery wrapped");
		}
	});

	var div = document.createElement("div");
	new MyThing(div);
});

QUnit.module("inserted/removed");

QUnit.test("inserted is triggered", function(){
	var $el = $("<div>");

	$el.on("inserted", function(){
		QUnit.ok(true, "inserted did fire");

		QUnit.start();
	});

	mutate.appendChild.call($("#qunit-fixture")[0], $el[0]);

	QUnit.stop();
});

QUnit.test("inserted is triggered without MutationObserver", function(){
	var mo = MO();
	MO(false);

	var $el = $("<div>");

	$el.on("inserted", function(){
		QUnit.ok(true, "inserted did fire");

		QUnit.start();

		MO(mo);
	});

	mutate.appendChild.call($("#qunit-fixture")[0], $el[0]);

	QUnit.stop();
});

QUnit.test("inserted is triggered without MutationObserver going through jQuery",
					 function(){
	var mo = MO();
	MO(false);

	var $el = $("<div>");

	$el.on("inserted", function(){
		QUnit.ok(true, "inserted did fire");

		QUnit.start();

		MO(mo);
	});

	$("#qunit-fixture").append($el);

	QUnit.stop();

});

QUnit.test("removed is triggered", function(){
	var $el = $("<div>");

	$el.on("removed", function(){
		QUnit.ok(true, "removed did fire");

		QUnit.start();
	});

	var fixture = $("#qunit-fixture")[0];

	mutate.appendChild.call(fixture, $el[0]);
	mutate.removeChild.call(fixture, $el[0]);

	QUnit.stop();
});

QUnit.test("removed is triggered without MutationObserver", function(){
	var mo = MO();
	MO(false);

	var $el = $("<div>");

	$el.on("removed", function(){
		QUnit.ok(true, "removed did fire");

		QUnit.start();

		MO(mo);
	});

	var fixture = $("#qunit-fixture")[0];

	mutate.appendChild.call(fixture, $el[0]);
	mutate.removeChild.call(fixture, $el[0]);

	QUnit.stop();
});

QUnit.test("removed is triggered without MutationObserver through jQuery", function(){
	var mo = MO();
	MO(false);

	var $el = $("<div>");

	$el.on("removed", function(){
		QUnit.ok(true, "removed did fire");

		QUnit.start();
		MO(mo);
	});

	$el.on("inserted", function(){
		$el.remove();
	});

	var fixture = $("#qunit-fixture");
	fixture.append($el);

	QUnit.stop();
});


QUnit.module("custom jQuery events");

QUnit.test("fire within controls", function(){
	var MyControl = Control.extend({
		"some-event": function(){
			QUnit.ok(true, "some-event fired");
		}
	});

	var div = $("<div>");
	new MyControl(div);

	div.trigger("some-event");
});

QUnit.test("receives data passed to $.trigger", function(){
	var MyControl = Control.extend({
		"names-added": function(el, ev, first, second, third){
			QUnit.equal(el[0].nodeName, "DIV", "element is the first arg");
			QUnit.ok(ev instanceof $.Event, "second arg is a jQuery Event");

			QUnit.equal(first, "Matthew");
			QUnit.equal(second, "David");
			QUnit.equal(third, "Brian");
		}
	});

	var dom = $("<div></div>");

	new MyControl(dom);

	dom.trigger("names-added", [
		"Matthew",
		"David",
		"Brian"
	]);
});

QUnit.test("receives data passed when delegating", function(){
	var MyControl = Control.extend({
		"ul	names-added": function(el, ev, first, second, third){
			QUnit.equal(el[0].nodeName, "UL", "element is the first arg");
			QUnit.ok(ev instanceof $.Event, "second arg is a jQuery Event");

			QUnit.equal(first, "Matthew");
			QUnit.equal(second, "David");
			QUnit.equal(third, "Brian");
		}
	});

	var dom = $("<div><ul></ul></div>");

	new MyControl(dom);

	dom.find("ul").trigger("names-added", [
		"Matthew",
		"David",
		"Brian"
	]);
});

QUnit.module("Regular dom events");

QUnit.test("Only fires once", function(){
	QUnit.expect(1);

	var el = $("<div>");

	domEvents.addEventListener.call(el[0], "click", function(){
		QUnit.ok(true);
	});

	el.trigger("click");
});

QUnit.module("$.fn.viewModel()");

QUnit.test("Gets an element's viewModel", function(){
	var el = $("<div>");
	var map = new Map();

	domData.set.call(el[0], "viewModel", map);

	QUnit.equal(el.viewModel(), map, "returns the map instance");
});


QUnit.test("multiple times fired (#21)", function(){
	QUnit.expect(2);

	var el = $("<div>");

	domEvents.addEventListener.call(el[0], "click", function(){
		QUnit.ok(true);
	});

	el.trigger("click");
	el.trigger("click");
});
