import QUnit from 'steal-qunit';
import plugin from './can-jquery';

QUnit.module('can-jquery');

QUnit.test('Initialized the plugin', function(){
  QUnit.equal(typeof plugin, 'function');
  QUnit.equal(plugin(), 'This is the can-jquery plugin');
});
