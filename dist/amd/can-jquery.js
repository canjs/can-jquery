/*can-jquery@3.2.1#can-jquery*/
define([
    'require',
    'exports',
    'module',
    'jquery',
    'can-util/namespace',
    'can-util/dom/fragment',
    'can-util/dom/events',
    'can-util/dom/dispatch',
    'can-util/js/each',
    'can-util/dom/child-nodes',
    'can-util/js/is-array-like',
    'can-util/js/make-array',
    'can-util/dom/mutate',
    'can-util/js/set-immediate',
    'can-view-model',
    'can-globals/mutation-observer',
    'can-util/js/cid-map',
    'can-util/js/assign',
    'can-event-dom-enter/compat'
], function (require, exports, module) {
    (function (global) {
        var $ = require('jquery');
        var ns = require('can-util/namespace');
        var buildFragment = require('can-util/dom/fragment');
        var domEvents = require('can-util/dom/events');
        var domDispatch = require('can-util/dom/dispatch');
        var each = require('can-util/js/each');
        var getChildNodes = require('can-util/dom/child-nodes');
        var isArrayLike = require('can-util/js/is-array-like');
        var makeArray = require('can-util/js/make-array');
        var mutate = require('can-util/dom/mutate');
        var setImmediate = require('can-util/js/set-immediate');
        var canViewModel = require('can-view-model');
        var getMutationObserver = require('can-globals/mutation-observer');
        var CIDMap = require('can-util/js/cid-map');
        var assign = require('can-util/js/assign');
        var addEnterEvent = require('can-event-dom-enter/compat');
        addEnterEvent(domEvents);
        module.exports = ns.$ = $;
        var specialEvents = {};
        var nativeDispatchEvents = { focus: true };
        var inSpecial = false;
        var slice = Array.prototype.slice;
        var removedEventHandlerMap = new CIDMap();
        var domDispatch = domEvents.dispatch;
        domEvents.dispatch = function (event, args) {
            var eventObj;
            if (!specialEvents[event] && !nativeDispatchEvents[event]) {
                if (typeof event !== 'string' && !event.hasOwnProperty('type')) {
                    eventObj = assign({}, event);
                }
                $(this).trigger(eventObj || event, args);
            } else {
                domDispatch.apply(this, arguments);
            }
        };
        function isFragment(node) {
            return node && node.nodeType === 11;
        }
        var addEventListener = domEvents.addEventListener;
        domEvents.addEventListener = function (event, callback) {
            var handler;
            if (isFragment(this)) {
                return;
            }
            if (!inSpecial && !domEvents._compatRegistry[event]) {
                if (event === 'removed') {
                    var element = this;
                    handler = function (ev) {
                        ev.eventArguments = slice.call(arguments, 1);
                        domEvents.removeEventListener.call(element, event, handler);
                        var self = this, args = arguments;
                        if (getMutationObserver()) {
                            return callback.apply(self, args);
                        } else {
                            return setImmediate(function () {
                                return callback.apply(self, args);
                            });
                        }
                    };
                    removedEventHandlerMap.set(callback, handler);
                }
                $(this).on(event, handler || callback);
                return;
            }
            return addEventListener.call(this, event, handler || callback);
        };
        var removeEventListener = domEvents.removeEventListener;
        domEvents.removeEventListener = function (event, callback) {
            if (isFragment(this)) {
                return;
            }
            if (!inSpecial) {
                var handler;
                if (event === 'removed') {
                    handler = removedEventHandlerMap.get(callback);
                    removedEventHandlerMap.delete(callback);
                }
                $(this).off(event, handler || callback);
                return;
            }
            return removeEventListener.apply(this, arguments);
        };
        var delegateEventType = function delegateEventType(type) {
            var typeMap = {
                focus: 'focusin',
                blur: 'focusout'
            };
            return typeMap[type] || type;
        };
        domEvents.addDelegateListener = function (type, selector, callback) {
            $(this).on(delegateEventType(type), selector, callback);
        };
        domEvents.removeDelegateListener = function (type, selector, callback) {
            $(this).off(delegateEventType(type), selector, callback);
        };
        var withSpecial = function withSpecial(callback) {
            return function () {
                inSpecial = true;
                callback.apply(this, arguments);
                inSpecial = false;
            };
        };
        var setupSpecialEvent = function setupSpecialEvent(eventName) {
            specialEvents[eventName] = true;
            var handler = function () {
                $(this).trigger(eventName);
            };
            $.event.special[eventName] = {
                noBubble: true,
                setup: withSpecial(function () {
                    domEvents.addEventListener.call(this, eventName, handler);
                }),
                teardown: withSpecial(function () {
                    domEvents.removeEventListener.call(this, eventName, handler);
                })
            };
        };
        [
            'inserted',
            'removed',
            'attributes',
            'beforeremove'
        ].forEach(setupSpecialEvent);
        var oldDomManip = $.fn.domManip, cbIndex;
        $.fn.domManip = function () {
            for (var i = 1; i < arguments.length; i++) {
                if (typeof arguments[i] === 'function') {
                    cbIndex = i;
                    break;
                }
            }
            return oldDomManip.apply(this, arguments);
        };
        $(document.createElement('div')).append(document.createElement('div'));
        if (cbIndex === undefined) {
            $.fn.domManip = oldDomManip;
            each([
                'after',
                'prepend',
                'before',
                'append',
                'replaceWith'
            ], function (name) {
                var original = $.fn[name];
                $.fn[name] = function () {
                    var elems = [], args = makeArray(arguments);
                    if (args[0] != null) {
                        if (typeof args[0] === 'string') {
                            args[0] = buildFragment(args[0]);
                        }
                        if (isFragment(args[0])) {
                            elems = getChildNodes(args[0]);
                        } else if (isArrayLike(args[0])) {
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
            $.fn.domManip = cbIndex === 2 ? function (args, table, callback) {
                return oldDomManip.call(this, args, table, function (elem) {
                    var elems;
                    if (isFragment(elem)) {
                        elems = makeArray(getChildNodes(elem));
                    }
                    var ret = callback.apply(this, arguments);
                    mutate.inserted(elems ? elems : [elem]);
                    return ret;
                });
            } : function (args, callback) {
                return oldDomManip.call(this, args, function (elem) {
                    var elems;
                    if (isFragment(elem)) {
                        elems = makeArray(getChildNodes(elem));
                    }
                    var ret = callback.apply(this, arguments);
                    mutate.inserted(elems ? elems : [elem]);
                    return ret;
                });
            };
        }
        var oldClean = $.cleanData;
        $.cleanData = function (elems) {
            $.each(elems, function (i, elem) {
                if (elem) {
                    domDispatch.call(elem, 'beforeremove', [], false);
                    domDispatch.call(elem, 'removed', [], false);
                }
            });
            oldClean(elems);
        };
        $.fn.viewModel = function () {
            return canViewModel(this[0]);
        };
    }(function () {
        return this;
    }()));
});