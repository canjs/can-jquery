var $ = require("can-jquery/legacy");
var enable = require("./legacy-toggle").enable;
var disable = require("./legacy-toggle").disable;
var types = require("can-util/js/types/types");

QUnit.module("can-jquery/legacy", {
	setup: function() {
		enable($);
	},
	teardown: function() {
		disable();
	}
});

QUnit.test("enable/disable", function(){
	disable();
	equal(typeof types.wrapElement, "undefined", "disable() should remove types.wrapElement by default");
	equal(typeof types.unwrapElement, "undefined", "disable() should remove types.unwrapElement by default");

	enable();
	equal(typeof types.wrapElement, "function", "should add types.wrapElement by default");
	equal(typeof types.unwrapElement, "function", "should add types.unwrapElement by default");
});
