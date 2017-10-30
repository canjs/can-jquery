var $ = require("jquery");
var ns = require("can-util/namespace");
var buildFragment = require("can-util/dom/fragment/fragment");
var domEvents = require("can-util/dom/events/events");
var domDispatch = require("can-util/dom/dispatch/dispatch");
var each = require("can-util/js/each/each");
var getChildNodes = require("can-util/dom/child-nodes/child-nodes");
var isArrayLike = require("can-util/js/is-array-like/is-array-like");
var makeArray = require("can-util/js/make-array/make-array");
var mutate = require("can-util/dom/mutate/mutate");
var setImmediate = require("can-util/js/set-immediate/set-immediate");
var canViewModel = require("can-view-model");
var getMutationObserver = require("can-globals/mutation-observer/mutation-observer");
var CIDMap = require("can-util/js/cid-map/cid-map");
var assign = require("can-util/js/assign/assign");

var addEnterEvent = require('can-event-dom-enter/compat');
addEnterEvent(domEvents);


module.exports = ns.$ = $;

var specialEvents = {};
var nativeDispatchEvents = { focus: true };
var inSpecial = false;
var slice = Array.prototype.slice;
var removedEventHandlerMap = new CIDMap();

if ($) {
	// Override dispatch to use $.trigger.
	// This is needed so that extra arguments can be used
	// when using domEvents.dispatch/domEvents.trigger.
	var domDispatch = domEvents.dispatch;
	domEvents.dispatch = function(event, args) {
		var eventObj;

		if (!specialEvents[event] && !nativeDispatchEvents[event]) {
			// fix KeyboardEvent and other constructed events that do not have an own `type` property
			// jquery.trigger will throw when on event.indexOf(...) if event.hasOwnProperty('type') fails
			if (typeof event !== 'string' && !event.hasOwnProperty('type')) {
				// convert event to an object
				eventObj = assign({}, event);
			}

			$(this).trigger(eventObj || event, args);
		} else {
			domDispatch.apply(this, arguments);
		}
	};

	var isFragment = function(node) {
		// Node.DOCUMENT_FRAGMENT_NODE === 11
		return node && node.nodeType === 11;
	};

	// Override addEventListener to listen to jQuery events.
	// This is needed to add the arguments provided to $.trigger
	// onto the event.
	var addEventListener = domEvents.addEventListener;
	domEvents.addEventListener = function(event, callback){
		var handler;

		// don't set up event listeners for document fragments
		// since events will not be triggered and the handlers
		// could lead to memory leaks
		if (isFragment(this)) {
			return;
		}

		if(!inSpecial && !domEvents._compatRegistry[event]) {

			if(event === "removed") {
				var element = this;

				// overwrite `removed` event handlers
				// to ensure they are dispatched async,
				// pass arguments through correctly from $.trigger,
				// and automatically unbind
				handler = function(ev){
					ev.eventArguments = slice.call(arguments, 1);

					// Remove the event handler to prevent the event from being called twice
					domEvents.removeEventListener.call(element, event, handler);

					var self = this, args = arguments;
					if (getMutationObserver()) {
						return callback.apply(self, args);
					} else {
						// if not using mutation observers, ensure event is dispatch async
						return setImmediate(function(){
							return callback.apply(self, args);
						});
					}
				};

				// add mapping of original handler to overwritten handler
				// so that the correct handler can be unbound in removeEventListener
				removedEventHandlerMap.set(callback, handler);
			}

			// if handler was created, set it up
			// otherwise, just set up original callback
			$(this).on(event, handler || callback);
			return;
		}
		return addEventListener.call(this, event, handler || callback);
	};

	var removeEventListener = domEvents.removeEventListener;
	domEvents.removeEventListener = function(event, callback){
		// event handlers are not set up on document fragments
		// so they do not need to be removed
		if (isFragment(this)) {
			return;
		}

		if(!inSpecial) {
			var handler;
			if(event === "removed") {
				// map callback back to overwritten handler
				handler = removedEventHandlerMap.get(callback);
				// remove mapping since handler is being removed
				removedEventHandlerMap.delete(callback);
			}

			// if handler was found (set up above in addEventListener),
			// remove it. otherwise, just remove original callback
			$(this).off(event, handler || callback);
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
				// setup is called the first time a handler for `eventName`
				// is set up for each element
				domEvents.addEventListener.call(this, eventName, handler);
			}),
			teardown: withSpecial(function(){
				// teardown is called after the last handler is removed for
				// each element
				domEvents.removeEventListener.call(this, eventName, handler);
			})
		};
	};

	[
		"inserted",
		"removed",
		"attributes",
		"beforeremove"
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
					if (isFragment(args[0])) {
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
					if (isFragment(elem)) {
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
					if (isFragment(elem)) {
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
				domDispatch.call(elem, "beforeremove", [], false);
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
