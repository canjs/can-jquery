var QUnit = require("steal-qunit");
var Control = require("can-control");
var $ = require("can-jquery/legacy");
var enableLegacyMode = require("can-jquery/legacy-toggle").enable;
var disableLegacyMode = require("can-jquery/legacy-toggle").disable;
var mutate = require("can-util/dom/mutate/mutate");
var globals = require("can-globals");
var domEvents = require("can-util/dom/events/events");
var domData = require("can-util/dom/data/data");
var CanMap = require("can-map");
var stache = require("can-stache");
var canEvent = require("can-event");
var Component = require('can-component');

require("can-util/dom/events/inserted/inserted");
require("can-util/dom/events/removed/removed");
require("can-stache-bindings");

QUnit.module("can-jquery/legacy - can-controls", {
	setup: function() {
		enableLegacyMode($);
	},
	teardown: function() {
		disableLegacyMode();
	}
});

QUnit.test("this.element is jQuery wrapped", function(){
	var MyThing = Control.extend({
		init: function(){
			QUnit.ok(this.element instanceof $, "it is jQuery wrapped");
		}
	});

	var div = document.createElement("div");
	new MyThing(div);
});

QUnit.module("can-jquery/legacy - inserted/removed", {
	setup: function() {
		enableLegacyMode($);
	},
	teardown: function() {
		disableLegacyMode();
	}
});

QUnit.test("inserted is triggered", function(){
	var $el = $("<div>");

	$el.on("inserted", function(){
		QUnit.ok(true, "inserted did fire");

		QUnit.start();
	});

	mutate.appendChild.call($("#qunit-fixture")[0], $el[0]);

	QUnit.stop();
});

QUnit.test("inserted does not bubble", function(){
	expect(2);
	var $div = $("<div>");
	var $span = $("<span>");

	$div.on("inserted", function(){
		QUnit.ok(true, "inserted fired for div");
	});

	$span.on("inserted", function(){
		QUnit.ok(true, "inserted fired for span");
	});

	mutate.appendChild.call($("#qunit-fixture")[0], $div[0]);

	mutate.appendChild.call($div[0], $span[0]);

	QUnit.stop();

	setTimeout(function() {
		QUnit.start();
	}, 50);
});

QUnit.test("inserted is triggered without MutationObserver", function(){
	globals.setKeyValue('MutationObserver', null);

	var $el = $("<div>");

	$el.on("inserted", function(){
		QUnit.ok(true, "inserted did fire");

		QUnit.start();

		globals.reset('MutationObserver');
	});

	mutate.appendChild.call($("#qunit-fixture")[0], $el[0]);

	QUnit.stop();
});

QUnit.test("inserted is triggered without MutationObserver going through jQuery", function(){
	globals.setKeyValue('MutationObserver', null);

	var $el = $("<div>");

	$el.on("inserted", function(){
		QUnit.ok(true, "inserted did fire");

		QUnit.start();

		globals.reset('MutationObserver');
	});

	$("#qunit-fixture").append($el);

	QUnit.stop();

});

QUnit.test("inserted should not use $.trigger", function(){
	var $el = $("div>");

	$el.on("inserted", function(ev, arg1, arg2){
		QUnit.ok(arg1 === undefined, "should not pass arg1");
		QUnit.ok(arg2 === undefined, "should not pass arg2");
		QUnit.ok(true, "inserted did fire");

		QUnit.start();
	});

	QUnit.stop();
	domEvents.dispatch.call($el[0], "inserted", ["foo", "bar"]);
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
	globals.setKeyValue('MutationObserver', null);

	var $el = $("<div>");

	$el.on("removed", function(){
		QUnit.ok(true, "removed did fire");

		QUnit.start();

		globals.reset('MutationObserver');
	});

	var fixture = $("#qunit-fixture")[0];

	mutate.appendChild.call(fixture, $el[0]);
	mutate.removeChild.call(fixture, $el[0]);

	QUnit.stop();
});

QUnit.test("removed is triggered without MutationObserver through jQuery", function(){
	globals.setKeyValue('MutationObserver', null);

	var $el = $("<div>");

	$el.on("removed", function(){
		QUnit.ok(true, "removed did fire");

		QUnit.start();
		
		globals.reset('MutationObserver');
	});

	$el.on("inserted", function(){
		$el.remove();
	});

	var fixture = $("#qunit-fixture");
	fixture.append($el);

	QUnit.stop();
});

QUnit.test("removed should not use $.trigger", function(){
	var $el = $("div>");

	$el.on("removed", function(ev, arg1, arg2){
		QUnit.ok(arg1 === undefined, "should not pass arg1");
		QUnit.ok(arg2 === undefined, "should not pass arg2");
		QUnit.ok(true, "removed did fire");

		QUnit.start();
	});

	QUnit.stop();
	domEvents.dispatch.call($el[0], "removed", ["foo", "bar"]);
});

QUnit.module("can-jquery/legacy - custom jQuery events", {
	setup: function() {
		enableLegacyMode($);
	},
	teardown: function() {
		disableLegacyMode();
	}
});

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

QUnit.test("receives data passed to $.trigger when using domEvents.dispatch", function() {
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

	domEvents.dispatch.call(dom[0], "names-added", [
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

QUnit.module("can-jquery/legacy - Regular dom events", {
	setup: function() {
		enableLegacyMode($);
	},
	teardown: function() {
		disableLegacyMode();
	}
});

QUnit.test("Only fires once", function(){
	QUnit.expect(1);

	var el = $("<div>");

	domEvents.addEventListener.call(el[0], "click", function(){
		QUnit.ok(true);
	});

	el.trigger("click");
});

QUnit.module("can-jquery/legacy - $.fn.viewModel()", {
	setup: function() {
		enableLegacyMode($);
	},
	teardown: function() {
		disableLegacyMode();
	}
});

QUnit.test("Gets an element's viewModel", function(){
	var el = $("<div>");
	var map = new CanMap();

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

QUnit.module("can-jquery/legacy - trigger extraParameters", {
	setup: function() {
		enableLegacyMode($);
	},
	teardown: function() {
		disableLegacyMode();
	}
});

QUnit.test("can-event passes extra args to handler", function () {
	expect(3);
	var template = stache("<p can-myevent='handleMyEvent'>{{content}}</p>");

	var frag = template({
		handleMyEvent: function(context, el, event, arg1, arg2) {
			QUnit.ok(true, "handleMyEvent called");
			QUnit.equal(arg1, "myarg1", "3rd argument is the extra event args");
			QUnit.equal(arg2, "myarg2", "4rd argument is the extra event args");
		}
	});

	var ta = $("#qunit-fixture")[0];
	ta.appendChild(frag);
	var p0 = ta.getElementsByTagName("p")[0];
	canEvent.trigger.call(p0, "myevent", ["myarg1", "myarg2"]);
});

QUnit.test("extra args to handler can be read using `%arguments`", function () {
	expect(4);
	var template = stache("<p can-myevent='handleMyEvent(%arguments)'>{{content}}</p>");

	var frag = template({
		handleMyEvent: function(args) {
			QUnit.ok(true, "handleMyEvent called");
			QUnit.ok(args[0] instanceof $.Event, "args[0] is a jquery event");
			QUnit.equal(args[1], "myarg1", "args[1] is the extra event args");
			QUnit.equal(args[2], "myarg2", "args[2] is the extra event args");
		}
	});

	var ta = $("#qunit-fixture")[0];
	ta.appendChild(frag);
	var p0 = ta.getElementsByTagName("p")[0];
	canEvent.trigger.call(p0, "myevent", ["myarg1", "myarg2"]);
});

QUnit.module("can-jquery - addEventListener / removeEventListener");

QUnit.test("should not trigger events on Document Fragments", function() {
	expect(0);
	var origOn = $.fn.on;
	var origOff = $.fn.off;
	$.fn.on = function() {
		QUnit.ok(false, 'should not set up jQuery event listener');
	};
	$.fn.off = function() {
		QUnit.ok(false, 'should not remove jQuery event listener');
	};

	var el = document.createDocumentFragment();

	domEvents.addEventListener.call(el, "custom-event", function() { });
	domEvents.removeEventListener.call(el, "custom-event", function() { });

	$.fn.on = origOn;
	$.fn.off = origOff;
});

QUnit.test("should call correct `removed` handler when one is removed", function(assert) {
	var done = assert.async();
	var $el = $("<div>");

	var teardownOne = function() {
		QUnit.ok(false, "removed event listener should not be called");
		done();
	};

	var teardownTwo = function() {
		QUnit.ok(true, "event listener should be called");
		// Must be async to avoid race condition
		done();
	};

	domEvents.addEventListener.call($el[0], "removed", teardownOne);
	domEvents.addEventListener.call($el[0], "removed", teardownTwo);

	domEvents.removeEventListener.call($el[0], "removed", teardownOne);

	var fixture = $("#qunit-fixture");
	fixture.append($el);
	$el.remove();
});


QUnit.test("should call beforeremove before removed", function() {

	var beforeRemoveCalls = 0;

	var beforeRemoveCalled = function() {
		beforeRemoveCalls++;
	};

	Component.extend({
	  tag: 'with-before-remove',
	  view: stache('<content/>'),
	  events: {
	     '{element} beforeremove': beforeRemoveCalled,
	     ' beforeremove': beforeRemoveCalled,
	     beforeremove: beforeRemoveCalled
	  }
	});

	var tmpl = stache('<with-before-remove>Test</with-before-remove>');

	var $playground = $('#qunit-fixture');

	$playground.append(tmpl());
	$playground.empty();

	equal(beforeRemoveCalls, 3, 'calls beforeremove 3 times when component is removed from page');

});
