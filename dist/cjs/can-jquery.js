/*can-jquery@3.0.0-pre.1#can-jquery*/
var $ = require('jquery');
var ns = require('can-util/namespace');
var domEvents = require('can-util/dom/events/events');
module.exports = ns.$ = $;
function setupSpecialEvent(eventName) {
    var handler = function () {
        $(this).trigger(eventName);
    };
    $.event.special[eventName] = {
        setup: function () {
            domEvents.addEventListener.call(this, eventName, handler);
        },
        teardown: function () {
            domEvents.removeEventListener.call(this, eventName, handler);
        }
    };
}
[
    'inserted',
    'removed',
    'attributes'
].forEach(setupSpecialEvent);