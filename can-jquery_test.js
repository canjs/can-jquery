var QUnit = require("steal-qunit");
var $ = require("can-jquery");
var Control = require("can-control");

QUnit.module("can-controls");

QUnit.test("this.element is jQuery wrapped", function(){
	var MyThing = Control.extend({
		init: function(){
			QUnit.ok(this.element instanceof $, "it is jQuery wrapped");
		}
	});

	var div = document.createElement("div");
	new MyThing(div);
});
