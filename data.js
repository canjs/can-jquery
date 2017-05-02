/* global module, require */
var $ = require("can-jquery");
var domData = require("can-util/dom/data/data");
var each = require("can-util/js/each/each");
var assign = require("can-util/js/assign/assign");

module.exports = $;

var oldData = $.data;
var oldFnData = $.fn.data;
$.fn.data = function() {
	var args = arguments,
		ret = oldFnData.apply(this, arguments);

	if(arguments.length < 1) {
		// get all (from the first element in the jQ)
		assign(ret, domData.get.call(this[0]));
		return ret;
	} else if(arguments.length === 1 && typeof arguments[0] === "string") {
		// get named property
		if(ret != null) {
			return ret;
		} else {
			return this.get().reduce(function(val, el) {
				return val != null ? val : domData.get.apply(el, args);
			}, null);
		}
	} else {
		// set
		this.each(function(i, el) {
			if(typeof args[0] === "string") {
				domData.set.apply(el, args);      
			} else {
				each(args[0], function(val, key) {
					domData.set.call(el, key, val);
				});
			}
		});
		return ret;
	}
};

$.data = function() {
	var elem = arguments[0],
		args = [].slice.call(arguments, 1),
		ret = oldData.apply(this, arguments);

  if(arguments.length < 2) {
		// get all
		assign(ret, domData.get.call(elem));
		return ret;
  } else if(arguments.length === 2 && typeof arguments[1] === "string") {
		// get named property
		return ret != null ? ret : domData.get.apply(elem, args);
	} else {
		if(typeof args[0] === "string") {
			domData.set.apply(elem, args);      
		} else {
			each(args[0], function(val, key) {
				domData.set.call(elem, key, val);
			});
		}
		return ret;
	}
};

var oldHasData = $.hasData;
$.hasData = function() {
	var elem = arguments[0],
		args = [].slice.call(arguments, 1);
	return oldHasData.apply(this, arguments) || domData.get.call(elem).hasOwnProperty(args[0]);
};

var oldRemoveData = $.removeData;
var oldFnRemoveData = $.fn.removeData;

$.fn.removeData = function() {
	var args = arguments,
		ret = oldFnRemoveData.apply(this, arguments);

	this.each(function(i, el) {
		if(typeof args[0] === "string") {
			domData.clean.apply(el, args);      
		} else {
			each(domData.get.call(el), function(val, key) {
				domData.clean.call(el, key);
			});
		}
	});
	return ret;
};

$.removeData = function() {
	var elem = arguments[0],
		args = [].slice.call(arguments, 1),
		ret = oldRemoveData.apply(this, arguments);

	if(typeof args[0] === "string") {
		domData.clean.apply(elem, args);      
	} else {
		each(domData.get.call(elem), function(val, key) {
			domData.clean.call(elem, key);
		});
	}
	return ret;
};
