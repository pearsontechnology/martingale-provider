'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cache = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _martingaleUtils = require('martingale-utils');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_CACHE_TIMEOUT = 500;

var Cache = function () {
  function Cache() {
    _classCallCheck(this, Cache);

    this.cache = {};
    this.handles = { __last: 0 };
    this.fetching = [];
  }

  _createClass(Cache, [{
    key: 'fetchAll',
    value: function fetchAll() {
      var _this = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      Object.keys(options).forEach(function (key) {
        _this.fetch(options[key]);
      });
    }
  }, {
    key: 'getCacheKey',
    value: function getCacheKey(method, url) {
      return method.toUpperCase() + '://' + url;
    }
  }, {
    key: 'getCached',
    value: function getCached(options) {
      var _options$method = options.method,
          method = _options$method === undefined ? 'get' : _options$method,
          url = options.url,
          _options$cache = options.cache,
          cache = _options$cache === undefined ? DEFAULT_CACHE_TIMEOUT : _options$cache;

      if (cache === -1) {
        return false;
      }
      var key = this.getCacheKey(method, url);
      var cacheItem = this.cache[key];
      if (!cacheItem) {
        return false;
      }
      var now = new Date();
      var badAfter = now.getTime() - cache;
      var lifespan = cacheItem.at - badAfter;
      var useCache = lifespan > 0;
      if (useCache) {
        return cacheItem.data;
      }
      return false;
    }
  }, {
    key: 'checkItemRefresh',
    value: function checkItemRefresh(options) {
      var _options$method2 = options.method,
          method = _options$method2 === undefined ? 'get' : _options$method2,
          url = options.url,
          _options$refresh = options.refresh,
          refresh = _options$refresh === undefined ? -1 : _options$refresh;

      if (refresh === -1) {
        return;
      }
      var key = this.getCacheKey(method, url);
      if (this.fetching.indexOf(key) > -1) {
        return;
      }
      var cacheItem = this.cache[key];
      if (!cacheItem) {
        return this.fetchAll(options);
      }
      var now = new Date();
      var badAfter = now.getTime() - refresh;
      var lifespan = cacheItem.at - badAfter;
      var needsRefresh = lifespan <= 0;
      if (needsRefresh) {
        this.fetch(options);
      }
    }
  }, {
    key: 'checkForUpdates',
    value: function checkForUpdates() {
      var _this2 = this;

      var indexes = Object.keys(this.handles).filter(_martingaleUtils.isNumeric).map(function (n) {
        return +n;
      });
      indexes.forEach(function (index) {
        var handle = _this2.handles[index] || {};
        var options = handle.options || {};
        var keys = Object.keys(options);
        keys.forEach(function (key) {
          var opts = options[key];
          _this2.checkItemRefresh(opts);
        });
      });
    }
  }, {
    key: 'sendUpdate',
    value: function sendUpdate(url, handler, data) {
      var urlMatches = function urlMatches(urlObj) {
        return urlObj.url === url;
      };
      var callback = handler.callback,
          options = handler.options,
          urls = handler.urls;

      var isError = (0, _martingaleUtils.isErrorObject)(data);
      urls.forEach(function (urlObj) {
        if (urlMatches(urlObj)) {
          var key = urlObj.key;

          if (isError) {
            return setImmediate(function () {
              return callback(_defineProperty({}, key, data), key);
            });
          }
          var transform = options[key];
          var _transform$root = transform.root,
              root = _transform$root === undefined ? false : _transform$root,
              mapper = transform.mapper,
              defaultValue = transform.default;

          var resData = root === false ? data : (0, _martingaleUtils.getObjectValue)(root, data, defaultValue);
          var finalData = mapper ? mapper(resData) : resData;
          return setImmediate(function () {
            return callback(_defineProperty({}, key, finalData), key);
          });
        }
      });
    }
  }, {
    key: 'processUpdate',
    value: function processUpdate() {
      var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'get';
      var url = arguments[1];

      var _this3 = this;

      var err = arguments[2];
      var data = arguments[3];

      var now = new Date();
      var key = this.getCacheKey(method, url);
      var keys = Object.keys(this.handles).filter(_martingaleUtils.isNumeric).map(function (n) {
        return +n;
      });
      var allHandlers = keys.map(function (key) {
        return _this3.handles[key];
      });
      if (err) {
        this.cache[key] = {
          data: err,
          at: now.getTime()
        };
        return allHandlers.forEach(function (handler) {
          return _this3.sendUpdate(url, handler, data);
        });
      }
      this.cache[key] = {
        data: data,
        at: now.getTime()
      };
      allHandlers.forEach(function (handler) {
        return _this3.sendUpdate(url, handler, data);
      });
    }
  }, {
    key: 'fetch',
    value: function fetch(_ref) {
      var _this4 = this;

      var url = _ref.url,
          _ref$method = _ref.method,
          method = _ref$method === undefined ? 'get' : _ref$method,
          options = _objectWithoutProperties(_ref, ['url', 'method']);

      if (!url) {
        return;
      }
      var key = this.getCacheKey(method, url);
      if (this.fetching.indexOf(key) > -1) {
        return;
      }
      this.fetching = [].concat(_toConsumableArray(this.fetching), [key]);
      return (0, _martingaleUtils.fetchJson)(_extends({
        url: url,
        method: method
      }, options, {
        callback: function callback(err, data) {
          _this4.fetching = _this4.fetching.filter(function (u) {
            return u !== key;
          });
          _this4.processUpdate(method, url, err, data);
        }
      }));
    }
  }, {
    key: 'clearWatch',
    value: function clearWatch(watcher) {
      var _this5 = this;

      this.handles = Object.keys(this.handles).reduce(function (handles, handle) {
        if (+handle !== watcher) {
          return Object.assign({}, handles, _defineProperty({}, handle, _this5.handles[handle]));
        }
        return handles;
      }, { __last: this.handles.__last });
    }
  }, {
    key: 'watch',
    value: function watch() {
      var _this6 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var changeCallback = arguments[1];

      var handle = this.handles.__last + 1;
      var urls = (0, _martingaleUtils.flatten)(Object.keys(options).map(function (key) {
        var opts = options[key];
        var url = opts.url;

        if (url) {
          return {
            url: url,
            key: key
          };
        }
        return false;
      })).filter(function (e) {
        return !!e;
      });
      var newHandler = {
        urls: urls,
        options: options,
        callback: changeCallback
      };
      this.handles = Object.assign({}, this.handles, _defineProperty({
        __last: handle
      }, handle, newHandler));

      Object.keys(options).forEach(function (key) {
        var opts = options[key];
        var url = opts.url;


        var cached = _this6.getCached(opts);
        if (cached) {
          return _this6.sendUpdate(url, newHandler, cached);
        }

        _this6.fetch(opts);
      });

      return handle;
    }
  }]);

  return Cache;
}();

;

exports.Cache = Cache;