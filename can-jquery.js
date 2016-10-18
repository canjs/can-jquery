var $ = require("jquery");
var ns = require("can-util/namespace");
var buildFragment = require("can-util/dom/fragment/fragment");
var domEvents = require("can-util/dom/events/events");
var domData = require("can-util/dom/data/data");
var domDispatch = require("can-util/dom/dispatch/dispatch");
var each = require("can-util/js/each/each");
var getChildNodes = require("can-util/dom/child-nodes/child-nodes");
var isArrayLike = require("can-util/js/is-array-like/is-array-like");
var makeArray = require("can-util/js/make-array/make-array");
var mutate = require("can-util/dom/mutate/mutate");
var setImmediate = require("can-util/js/set-immediate/set-immediate");
var canViewModel = require("can-view-model");

module.exports = ns.$ = $;

var specialEvents = {};
var nativeDispatchEvents = { focus: true };
var inSpecial = false;
var EVENT_HANDLER = "can-jquery.eventHandler";
var slice = Array.prototype.slice;

if ($) {

// Override dispatch to use $.trigger.
// This is needed so that extra arguments can be used
// when using domEvents.dispatch/domEvents.trigger.
var domDispatch = domEvents.dispatch;
domEvents.dispatch = function(event, args) {
	if (!specialEvents[event] && !nativeDispatchEvents[event]) {
		$(this).trigger(event, args);
	} else {
		domDispatch.apply(this, arguments);
	}
};

// Override addEventListener to listen to jQuery events.
// This is needed to add the arguments provided to $.trigger
// onto the event.
var addEventListener = domEvents.addEventListener;
domEvents.addEventListener = function(event, callback){
	var handler;
	if(!inSpecial) {

		if(event === "removed") {
			var element = this;
			handler = function(ev){
				ev.eventArguments = slice.call(arguments, 1);

				// Remove the event handler to prevent the event from being called twice
				domEvents.removeEventListener.call(element, event, handler);


				var self = this, args = arguments;
				return setImmediate(function(){
					return callback.apply(self, args);
				});
			};
			domData.set.call(callback, EVENT_HANDLER, handler);
		}
		$(this).on(event, handler || callback);
		return;
	}
	return addEventListener.call(this, event, handler || callback);
};

var removeEventListener = domEvents.removeEventListener;
domEvents.removeEventListener = function(event, callback){
	if(!inSpecial) {
		var eventHandler;
		if(event === "removed") {
			eventHandler = domData.get.call(callback, EVENT_HANDLER);
		}

		$(this).off(event, eventHandler || callback);
		return;
	}
	return removeEventListener.apply(this, arguments);
};

// jQuery defines special event types for focus and blur
// for use with event delegation. They do this because
// focus and blur do not bubble.
var delegateEventType = function delegateEventType(type) {
	var typeMap = {
		focus: 'focusin',
		blur: 'focusout'
	};
	return typeMap[type] || type;
};

domEvents.addDelegateListener = function(type, selector, callback){
	$(this).on(delegateEventType(type), selector, callback);
};

domEvents.removeDelegateListener = function(type, selector, callback){
	$(this).off(delegateEventType(type), selector, callback);
};

var withSpecial = function withSpecial(callback){
	return function(){
		inSpecial = true;
		callback.apply(this, arguments);
		inSpecial = false;
	};
};

var setupSpecialEvent = function setupSpecialEvent(eventName){
	specialEvents[eventName] = true;

	var handler = function(){
		$(this).trigger(eventName);
	};

	$.event.special[eventName] = {
		noBubble: true,
		setup: withSpecial(function(){
			domEvents.addEventListener.call(this, eventName, handler);
		}),
		teardown: withSpecial(function(){
			domEvents.removeEventListener.call(this, eventName, handler);
		})
	};
};

[
	"inserted",
	"removed",
	"attributes"
].forEach(setupSpecialEvent);


// Dom Mapip stuff
var oldDomManip = $.fn.domManip,
	cbIndex;

// feature detect which domManip we are using
$.fn.domManip = function () {
	for (var i = 1; i < arguments.length; i++) {
		if (typeof arguments[i] === 'function') {
			cbIndex = i;
			break;
		}
	}
	return oldDomManip.apply(this, arguments);
};
$(document.createElement("div"))
	.append(document.createElement("div"));

if(cbIndex === undefined) {
	$.fn.domManip = oldDomManip;
	// we must manually overwrite
	each(['after', 'prepend', 'before', 'append','replaceWith'], function (name) {
		var original = $.fn[name];
		$.fn[name] = function () {
			var elems = [],
				args = makeArray(arguments);

			if (args[0] != null) {
				// documentFragment
				if (typeof args[0] === "string") {
					args[0] = buildFragment(args[0]);
				}
				if (args[0].nodeType === 11) {
					elems = getChildNodes(args[0]);
				} else if( isArrayLike( args[0] ) ) {
					elems = makeArray(args[0]);
				} else {
					elems = [args[0]];
				}
			}

			var ret = original.apply(this, args);

			mutate.inserted(elems);

			return ret;
		};
	});
} else {
	// Older jQuery that supports domManip


	$.fn.domManip = (cbIndex === 2 ?
		function (args, table, callback) {
			return oldDomManip.call(this, args, table, function (elem) {
				var elems;
				if (elem.nodeType === 11) {
					elems = makeArray( getChildNodes(elem) );
				}
				var ret = callback.apply(this, arguments);
				mutate.inserted(elems ? elems : [elem]);
				return ret;
			});
		} :
		function (args, callback) {
			return oldDomManip.call(this, args, function (elem) {
				var elems;
				if (elem.nodeType === 11) {
					elems = makeArray( getChildNodes(elem) );
				}
				var ret = callback.apply(this, arguments);
				mutate.inserted(elems ? elems : [elem]);
				return ret;
			});
		});
}

// Memory safe destruction.
var oldClean = $.cleanData;
$.cleanData = function (elems){
	$.each(elems, function(i, elem){
		if(elem) {
			domDispatch.call(elem, "removed", [], false);
		}
	});

	oldClean(elems);
};

// $.fn.viewModel
$.fn.viewModel = function(){
	return canViewModel(this[0]);
};

}
