var $ = module.exports = require("./can-jquery");
var types = require("can-util/js/types/types");

types.wrapElement = function(element){
	return $(element);
};

types.unwrapElement = function(object){
	return object ? object[0] : undefined;
};
