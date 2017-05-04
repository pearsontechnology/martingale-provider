'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _ = require('../');

var _reactTestRenderer = require('react-test-renderer');

var _reactTestRenderer2 = _interopRequireDefault(_reactTestRenderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// provider-test.js
var Greet = function Greet(_ref) {
  var _ref$name = _ref.name,
      name = _ref$name === undefined ? 'World' : _ref$name;
  return _react2.default.createElement(
    'div',
    null,
    'Hello ',
    name,
    '!'
  );
};
Greet.propTypes = {
  name: _propTypes2.default.string
};

test('Renders a basic element', function () {
  var component = _reactTestRenderer2.default.create(_react2.default.createElement(_.Provider, { Component: 'span' }));
  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Renders a custom component', function () {
  var component = _reactTestRenderer2.default.create(_react2.default.createElement(_.Provider, { Component: Greet }));
  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Renders a custom component with static props', function () {
  var component = _reactTestRenderer2.default.create(_react2.default.createElement(_.Provider, { Component: Greet, props: { name: 'Test' } }));
  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Renders a custom component with mapped values', function () {
  var mapper = function mapper(_ref2) {
    var value = _ref2.value;

    return {
      name: value
    };
  };
  var component = _reactTestRenderer2.default.create(_react2.default.createElement(_.Provider, { Component: Greet, props: { value: 'Mapped' }, mapper: mapper }));
  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});