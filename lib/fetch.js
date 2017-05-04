'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.postJson = exports.fetchJson = undefined;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _martingaleUtils = require('martingale-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var makeFetchOptions = function makeFetchOptions() {
  for (var _len = arguments.length, options = Array(_len), _key = 0; _key < _len; _key++) {
    options[_key] = arguments[_key];
  }

  return _martingaleUtils.merge.apply(undefined, [{ credentials: 'same-origin' }].concat(options));
};

var fetchJson = function fetchJson(_ref) {
  var url = _ref.url,
      callback = _ref.callback,
      options = _objectWithoutProperties(_ref, ['url', 'callback']);

  return (0, _isomorphicFetch2.default)(url, makeFetchOptions(options)).then(function (response) {
    response.json().then(function (json) {
      return callback(null, json, response);
    }).catch(function (err) {
      return callback(err);
    });
  }).catch(function (err) {
    return callback(err);
  });
};

var postJson = function postJson(_ref2) {
  var _ref2$method = _ref2.method,
      method = _ref2$method === undefined ? "post" : _ref2$method,
      body = _ref2.body,
      payload = _ref2.payload,
      options = _objectWithoutProperties(_ref2, ['method', 'body', 'payload']);

  var jsonBody = JSON.stringify(payload || body);
  var headers = {
    'Content-Type': 'application/json'
  };
  fetchJson(makeFetchOptions(options, { method: method, body: jsonBody, headers: headers }));
};

exports.fetchJson = fetchJson;
exports.postJson = postJson;