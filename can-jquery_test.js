import QUnit from 'steal-qunit';
import Control from "can-control";
import $ from "can-jquery/legacy";

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
