var QUnit = require('steal-qunit');
var CanMap = require("can-map");
var stache = require('can-stache');
var canEvent = require('can-event');
var $ = require('can-jquery/legacy');
var enableLegacyMode = require("can-jquery/legacy-toggle").enable;
var disableLegacyMode = require("can-jquery/legacy-toggle").disable;
require('can-stache-bindings');

var makeDocument = require('can-vdom/make-document/make-document');
var MUTATION_OBSERVER = require('can-util/dom/mutation-observer/mutation-observer');
var DOCUMENT = require("can-util/dom/document/document");

var types = require('can-util/js/types/types');

var DefaultMap = types.DefaultMap;

QUnit.config.testTimeout = 5000;

var DOC = DOCUMENT();
var MUT_OBS = MUTATION_OBSERVER();

function makeTest(name, doc, mutObs){
	QUnit.module(name, {
		setup: function () {
			enableLegacyMode($);
			DOCUMENT(doc);
			MUTATION_OBSERVER(mutObs);

			types.DefaultMap = CanMap;

			if(doc === document) {
				this.fixture = document.getElementById("qunit-fixture");
			} else {
				this.fixture = doc.createElement("qunit-fixture");
				doc.body.appendChild(this.fixture);
			}
		},
		teardown: function(){
			disableLegacyMode();
			if(doc !== document) {
				doc.body.removeChild(this.fixture);
			}

			stop();
			setTimeout(function(){
				types.DefaultMap = DefaultMap;
				start();
				DOCUMENT(DOC);
				MUTATION_OBSERVER(MUT_OBS);
			},1);
		}
	});

	QUnit.test("can-event passes extra args to handler", function () {
		expect(3);
		var template = stache("<p can-myevent='handleMyEvent'>{{content}}</p>");

		var frag = template({
			handleMyEvent: function(context, el, event, arg1, arg2) {
				QUnit.ok(true, "handleMyEvent called");
				QUnit.equal(arg1, "myarg1", "3rd argument is the extra event args");
				QUnit.equal(arg2, "myarg2", "4rd argument is the extra event args");
			}
		});

		var ta = this.fixture;
		ta.appendChild(frag);
		var p0 = ta.getElementsByTagName("p")[0];
		canEvent.trigger.call(p0, "myevent", ["myarg1", "myarg2"]);
	});

	QUnit.test("extra args to handler can be read using `%arguments`", function () {
		expect(4);
		var template = stache("<p can-myevent='handleMyEvent(%arguments)'>{{content}}</p>");

		var frag = template({
			handleMyEvent: function(args) {
				QUnit.ok(true, "handleMyEvent called");
				QUnit.ok(args[0] instanceof $.Event, "args[0] is a jquery event");
				QUnit.equal(args[1], "myarg1", "args[1] is the extra event args");
				QUnit.equal(args[2], "myarg2", "args[2] is the extra event args");
			}
		});

		var ta = this.fixture;
		ta.appendChild(frag);
		var p0 = ta.getElementsByTagName("p")[0];
		canEvent.trigger.call(p0, "myevent", ["myarg1", "myarg2"]);
	});
}

makeTest("can-stache-bindings - dom", document);
makeTest("can-stache-bindings - vdom", makeDocument(), null);
