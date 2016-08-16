/*can-jquery@3.0.0-pre.2#can-jquery*/
var $ = require('jquery');
var ns = require('can-util/namespace');
var domEvents = require('can-util/dom/events/events');
module.exports = ns.$ = $;
var inSpecial = false;
var addEventListener = domEvents.addEventListener;
domEvents.addEventListener = function (event, callback) {
    if (!inSpecial) {
        $(this).on(event, callback);
    }
    return addEventListener.apply(this, arguments);
};
var removeEventListener = domEvents.removeEventListener;
domEvents.removeEventListener = function (event, callback) {
    if (!inSpecial) {
        $(this).off(event, callback);
    }
    return removeEventListener.apply(this, arguments);
};
function withSpecial(callback) {
    return function () {
        inSpecial = true;
        callback.apply(this, arguments);
        inSpecial = false;
    };
}
function setupSpecialEvent(eventName) {
    var handler = function () {
        $(this).trigger(eventName);
    };
    $.event.special[eventName] = {
        setup: withSpecial(function () {
            domEvents.addEventListener.call(this, eventName, handler);
        }),
        teardown: withSpecial(function () {
            domEvents.removeEventListener.call(this, eventName, handler);
        })
    };
}
[
    'inserted',
    'removed',
    'attributes'
].forEach(setupSpecialEvent);