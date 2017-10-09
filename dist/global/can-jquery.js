/*[global-shim-start]*/
(function(exports, global, doEval) {
	// jshint ignore:line
	var origDefine = global.define;

	var get = function(name) {
		var parts = name.split("."),
			cur = global,
			i;
		for (i = 0; i < parts.length; i++) {
			if (!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val) {
		var parts = name.split("."),
			cur = global,
			i,
			part,
			next;
		for (i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if (!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod) {
		if (!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, default: true };
		for (var p in mod) {
			if (!esProps[p]) return false;
		}
		return true;
	};

	var hasCjsDependencies = function(deps) {
		return (
			deps[0] === "require" && deps[1] === "exports" && deps[2] === "module"
		);
	};

	var modules =
		(global.define && global.define.modules) ||
		(global._define && global._define.modules) ||
		{};
	var ourDefine = (global.define = function(moduleName, deps, callback) {
		var module;
		if (typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for (i = 0; i < deps.length; i++) {
			args.push(
				exports[deps[i]]
					? get(exports[deps[i]])
					: modules[deps[i]] || get(deps[i])
			);
		}
		// CJS has no dependencies but 3 callback arguments
		if (hasCjsDependencies(deps) || (!deps.length && callback.length)) {
			module = { exports: {} };
			args[0] = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args[1] = module.exports;
			args[2] = module;
		} else if (!args[0] && deps[0] === "exports") {
			// Babel uses the exports and module object.
			module = { exports: {} };
			args[0] = module.exports;
			if (deps[1] === "module") {
				args[1] = module;
			}
		} else if (!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if (globalExport && !get(globalExport)) {
			if (useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	});
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function() {
		// shim for @@global-helpers
		var noop = function() {};
		return {
			get: function() {
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load) {
				doEval(__load.source, global);
			}
		};
	});
})(
	{},
	typeof self == "object" && self.Object == Object ? self : window,
	function(__$source__, __$global__) {
		// jshint ignore:line
		eval("(function() { " + __$source__ + " \n }).call(__$global__);");
	}
);

/*can-jquery@3.2.1#can-jquery*/
define('can-jquery', [
    'require',
    'exports',
    'module',
    'jquery',
    'can-util/namespace',
    'can-util/dom/fragment/fragment',
    'can-util/dom/events/events',
    'can-util/dom/dispatch/dispatch',
    'can-util/js/each/each',
    'can-util/dom/child-nodes/child-nodes',
    'can-util/js/is-array-like/is-array-like',
    'can-util/js/make-array/make-array',
    'can-util/dom/mutate/mutate',
    'can-util/js/set-immediate/set-immediate',
    'can-view-model',
    'can-globals/mutation-observer/mutation-observer',
    'can-util/js/cid-map/cid-map',
    'can-util/js/assign/assign',
    'can-event-dom-enter/compat'
], function (require, exports, module) {
    (function (global) {
        var $ = require('jquery');
        var ns = require('can-util/namespace');
        var buildFragment = require('can-util/dom/fragment/fragment');
        var domEvents = require('can-util/dom/events/events');
        var domDispatch = require('can-util/dom/dispatch/dispatch');
        var each = require('can-util/js/each/each');
        var getChildNodes = require('can-util/dom/child-nodes/child-nodes');
        var isArrayLike = require('can-util/js/is-array-like/is-array-like');
        var makeArray = require('can-util/js/make-array/make-array');
        var mutate = require('can-util/dom/mutate/mutate');
        var setImmediate = require('can-util/js/set-immediate/set-immediate');
        var canViewModel = require('can-view-model');
        var getMutationObserver = require('can-globals/mutation-observer/mutation-observer');
        var CIDMap = require('can-util/js/cid-map/cid-map');
        var assign = require('can-util/js/assign/assign');
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
/*[global-shim-end]*/
(function(global) { // jshint ignore:line
	global._define = global.define;
	global.define = global.define.orig;
}
)(typeof self == "object" && self.Object == Object ? self : window);