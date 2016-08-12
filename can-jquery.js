var $ = module.exports = require("jquery");
var Control = require("can-control");

// Wrap Control's `this.element` in jQuery
var controlSetup = Control.prototype.setup;
Control.prototype.setup = function(){
	var results = controlSetup.apply(this, arguments);
	this.element = $(this.element);
	return [this.element].concat(results.pop());
};
