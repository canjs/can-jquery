/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*can-jquery@3.0.0-pre.8#can-jquery*/
define('can-jquery', function (require, exports, module) {
    var $ = require('jquery');
    var ns = require('can-util/namespace');
    var buildFragment = require('can-util/dom/fragment/fragment');
    var domEvents = require('can-util/dom/events/events');
    var domData = require('can-util/dom/data/data');
    var domDispatch = require('can-util/dom/dispatch/dispatch');
    var each = require('can-util/js/each/each');
    var getChildNodes = require('can-util/dom/child-nodes/child-nodes');
    var isArrayLike = require('can-util/js/is-array-like/is-array-like');
    var makeArray = require('can-util/js/make-array/make-array');
    var mutate = require('can-util/dom/mutate/mutate');
    var setImmediate = require('can-util/js/set-immediate/set-immediate');
    var canViewModel = require('can-view-model');
    module.exports = ns.$ = $;
    var inSpecial = false;
    var EVENT_HANDLER = 'can-jquery.eventHandler';
    var slice = Array.prototype.slice;
    var addEventListener = domEvents.addEventListener;
    domEvents.addEventListener = function (event, callback) {
        var handler;
        if (!inSpecial) {
            if (event === 'removed') {
                var element = this;
                handler = function (ev) {
                    ev.eventArguments = slice.call(arguments, 1);
                    domEvents.removeEventListener.call(element, event, handler);
                    var self = this, args = arguments;
                    return setImmediate(function () {
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
    domEvents.removeEventListener = function (event, callback) {
        if (!inSpecial) {
            var eventHandler;
            if (event === 'removed') {
                eventHandler = domData.get.call(callback, EVENT_HANDLER);
            }
            $(this).off(event, eventHandler || callback);
            return;
        }
        return removeEventListener.apply(this, arguments);
    };
    domEvents.addDelegateListener = function (type, selector, callback) {
        $(this).on(type, selector, callback);
    };
    domEvents.removeDelegateListener = function (type, selector, callback) {
        $(this).off(type, selector, callback);
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
                    if (args[0].nodeType === 11) {
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
                if (elem.nodeType === 11) {
                    elems = makeArray(getChildNodes(elem));
                }
                var ret = callback.apply(this, arguments);
                mutate.inserted(elems ? elems : [elem]);
                return ret;
            });
        } : function (args, callback) {
            return oldDomManip.call(this, args, function (elem) {
                var elems;
                if (elem.nodeType === 11) {
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
                domDispatch.call(elem, 'removed', [], false);
            }
        });
        oldClean(elems);
    };
    $.fn.viewModel = function () {
        return canViewModel(this[0]);
    };
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();