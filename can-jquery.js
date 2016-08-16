var $ = require("jquery");
var ns = require("can-util/namespace");
var domEvents = require("can-util/dom/events/events");
var domData = require("can-util/dom/data/data");

module.exports = ns.$ = $;

var inSpecial = false;
var EVENT_HANDLER = "can-jquery.eventHandler";
var DELEGATE_HANDLER = "can-jquery.delegateHandler";
var slice = Array.prototype.slice;

// Override addEventListener to listen to jQuery events.
// This is needed to add the arguments provided to $.trigger
// onto the event.
var addEventListener = domEvents.addEventListener;
domEvents.addEventListener = function(event, callback){
	if(!inSpecial) {
		var handler = function(ev){
			ev.eventArguments = slice.call(arguments, 1);
			return callback.apply(this, arguments);
		};
		domData.set.call(callback, EVENT_HANDLER, handler);

		$(this).on(event, handler);
	}
	return addEventListener.apply(this, arguments);
};

var removeEventListener = domEvents.removeEventListener;
domEvents.removeEventListener = function(event, callback){
	if(!inSpecial) {
		var eventHandler = domData.get.call(callback, EVENT_HANDLER);
		if(eventHandler) {
			domData.clean.call(callback, EVENT_HANDLER);
		}

		$(this).off(event, callback);
	}
	return removeEventListener.apply(this, arguments);
};

var addDelegateListener = domEvents.addDelegateListener;
domEvents.addDelegateListener = function(type, selector, callback){
	var handler = function(ev){
		if((ev instanceof $.Event) && ev.eventArguments) {
			var args = [ev].concat(ev.eventArguments);
			return callback.apply(this, args);
		}
		return callback.apply(this, arguments);
	};
	domData.set.call(callback, DELEGATE_HANDLER, handler);

	return addDelegateListener.call(this, type, selector, handler);
};

var removeDelegateListener = domEvents.removeDelegateListener;
domEvents.removeDelegateListener = function(type, selector, callback){
	var handler = domData.get.call(callback, DELEGATE_HANDLER);
	if(handler) {
		domData.clean.call(callback, DELEGATE_HANDLER);
	}
	
	return removeDelegateListener.apply(this, arguments);
};

function withSpecial(callback){
	return function(){
		inSpecial = true;
		callback.apply(this, arguments);
		inSpecial = false;
	};
}

function setupSpecialEvent(eventName){
	var handler = function(){
		$(this).trigger(eventName);
	};

	$.event.special[eventName] = {
		setup: withSpecial(function(){
			domEvents.addEventListener.call(this, eventName, handler);
		}),
		teardown: withSpecial(function(){
			domEvents.removeEventListener.call(this, eventName, handler);
		})
	};
}

[
	"inserted",
	"removed",
	"attributes"
].forEach(setupSpecialEvent);
