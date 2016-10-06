var types = require("can-util/js/types/types");
var dev = require("can-util/js/dev/dev");

function enable($) {
	//!steal-remove-start
	dev.warn("Using can-jquery/legacy will interfere with Components not expecting jQuery wrapped elements. Consider instead wrapping elements yourself in the init method.");
	//!steal-remove-end

	types.wrapElement = function(element){
		return $(element);
	};

	types.unwrapElement = function(object){
		return object ? object[0] : undefined;
	};
}

function disable () {
	delete types.wrapElement;
	delete types.unwrapElement;
}

module.exports = {
	enable: enable,
	disable: disable
};
