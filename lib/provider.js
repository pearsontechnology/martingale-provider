'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cache = exports.Provider = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _martingaleUtils = require('martingale-utils');

var _cache = require('./cache');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
provider(MyComponent, {
  apis: {
    method: 'get',
    url: '/api/v1/kong/apis',
    root: 'data',
    cache: -1 // never cache this
  },
  plugins: {
    url: '/api/v1/kong/plugins',
    root: 'data',
    cache: 5000 // Cache this for 5 seconds
  },
  consumers: {
    url: '/api/v1/kong/consumers',
    root: 'data'
    cache: Date() // Cache until date
  },
  consumers: {
    url: 'config/kube',
    root: 'data'
    cache: Infinity // Never bust the cache
  },
})
*/

var cache = new _cache.Cache();

var getComponentPropTypes = function getComponentPropTypes(component) {
  if (!component) {
    return false;
  }
  if (component && component.propTypes) {
    return component.propTypes;
  }
  if (component.prototype && component.prototype.propTypes) {
    return component.prototype.propTypes;
  }
  return false;
};

var getComponentName = function getComponentName(component) {
  if (typeof component === 'string') {
    return component;
  }
  if (typeof component === 'function') {
    return component.name;
  }
  if (component) {
    return component.type;
  }
};

var Provider = function Provider(_ref) {
  var Component = _ref.Component,
      children = _ref.children,
      provide = _ref.provide,
      mapper = _ref.mapper,
      props = _ref.props;

  var componentName = getComponentName(Component);
  var componentPropTypes = getComponentPropTypes(Component);

  var ProvidedComponent = function (_React$Component) {
    _inherits(ProvidedComponent, _React$Component);

    function ProvidedComponent() {
      _classCallCheck(this, ProvidedComponent);

      var _this = _possibleConstructorReturn(this, (ProvidedComponent.__proto__ || Object.getPrototypeOf(ProvidedComponent)).call(this));

      _this.state = {};
      _this.staticProps = props;
      return _this;
    }

    _createClass(ProvidedComponent, [{
      key: 'propExists',
      value: function propExists(prop) {
        return typeof this.props[prop] !== 'undefined';
      }
    }, {
      key: 'propIsValid',
      value: function propIsValid(key, value) {
        if (componentPropTypes) {
          try {
            return !_propTypes2.default.checkPropTypes(componentPropTypes, _defineProperty({}, key, value), 'prop', componentName);
          } catch (e) {
            console.error(e);
            console.error('propIsValid', componentName, key, value);
            return false;
          }
        }
        return true;
      }
    }, {
      key: 'mapPropValues',
      value: function mapPropValues(propValues) {
        if (typeof mapper === 'function') {
          return mapper(propValues);
        }
        return propValues;
      }
    }, {
      key: 'providedProps',
      value: function providedProps() {
        var _this2 = this;

        var data = this.state.__data || {};
        var staticPropsValues = this.staticProps;
        var staticProps = Object.keys(staticPropsValues || {}).reduce(function (props, key) {
          return Object.assign({}, props, _defineProperty({}, key, staticPropsValues[key]));
        }, {});
        var allValues = Object.keys(data).reduce(function (props, key) {
          return Object.assign({}, props, _defineProperty({}, key, data[key]));
        }, staticProps);
        var propValues = this.mapPropValues(allValues);
        var componentValues = Object.keys(propValues).reduce(function (vals, key) {
          var value = propValues[key];
          if (_this2.propIsValid(key, value)) {
            return Object.assign({}, vals, _defineProperty({}, key, value));
          }
          return vals;
        }, {});
        return componentValues;
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        var _this3 = this;

        this.watcher = cache.watch(provide, function (res, key) {
          if (_this3.watcher === false) {
            return;
          }
          var _state$__data = _this3.state.__data,
              data = _state$__data === undefined ? {} : _state$__data;

          var existingData = data[key];
          var newData = res[key];
          if (!(0, _martingaleUtils.isTheSame)(existingData, newData)) {
            var stateData = Object.assign({}, data, res);
            _this3.setState({ __data: stateData });
            if (_this3.props.onDataUpdated) {
              _this3.props.onDataUpdated(stateData);
            }
          }
        });
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        cache.clearWatch(this.watcher);
        this.watcher = false;
      }
    }, {
      key: 'render',
      value: function render() {
        if (_react2.default.isValidElement(Component)) {
          return Component;
        }
        var compProps = Object.assign({}, this.providedProps());
        if (children) {
          return _react2.default.createElement(
            Component,
            compProps,
            children(compProps)
          );
        }
        return _react2.default.createElement(Component, compProps);
      }
    }]);

    return ProvidedComponent;
  }(_react2.default.Component);

  ;

  return _react2.default.createElement(ProvidedComponent, null);
};

exports.Provider = Provider;
exports.cache = cache;