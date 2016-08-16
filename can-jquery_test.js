var QUnit = require("steal-qunit");
var Control = require("can-control");
var $ = require("can-jquery/legacy");
var mutate = require("can-util/dom/mutate/mutate");
require("can-util/dom/events/inserted/inserted");
require("can-util/dom/events/removed/removed");
var MO = require("can-util/dom/mutation-observer/mutation-observer");

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
