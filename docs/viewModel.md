@function can-jquery.fns.viewModel viewModel
@parent can-jquery.fns

@description Gets an element's View Model.

@signature `.viewModel()`

Calls [can-view-model] with the unwrapped HTMLElement.

```js
var vm = $("my-component").viewModel();
```

@return {can-define/map/map|can-map|Object} Returns the View Model set for this element.
