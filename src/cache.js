import {
  isNumeric,
  flatten,
  getObjectValue,
  isErrorObject
} from 'martingale-utils';

import {
  fetchJson
} from 'martingale-utils';

const DEFAULT_CACHE_TIMEOUT = 500;

class Cache{
  constructor(){
    this.cache = {};
    this.handles = {__last: 0};
    this.fetching = [];
  }

  fetchAll(options = {}){
    Object.keys(options).forEach((key)=>{
      this.fetch(options[key]);
    });
  }

  getCacheKey(method, url){
    return `${method.toUpperCase()}://${url}`;
  }

  getCached(options){
    const {
      method = 'get',
      url,
      cache = DEFAULT_CACHE_TIMEOUT
    } = options;
    if(cache === -1){
      return false;
    }
    const key = this.getCacheKey(method, url);
    const cacheItem = this.cache[key];
    if(!cacheItem){
      return false;
    }
    const now = new Date();
    const badAfter = now.getTime()-cache;
    const lifespan = cacheItem.at-badAfter;
    const useCache = lifespan > 0;
    if(useCache){
      return cacheItem.data;
    }
    return false;
  }

  checkItemRefresh(options){
    const {
      method = 'get',
      url,
      refresh = -1
    } = options;
    if(refresh === -1){
      return;
    }
    const key = this.getCacheKey(method, url);
    if(this.fetching.indexOf(key)>-1){
      return;
    }
    const cacheItem = this.cache[key];
    if(!cacheItem){
      return this.fetchAll(options);
    }
    const now = new Date();
    const badAfter = now.getTime()-refresh;
    const lifespan = cacheItem.at-badAfter;
    const needsRefresh = lifespan <= 0;
    if(needsRefresh){
      this.fetch(options);
    }
  }

  checkForUpdates(){
    const indexes = Object.keys(this.handles).filter(isNumeric).map(n=>+n);
    indexes.forEach((index)=>{
      const handle = this.handles[index] || {};
      const options = handle.options || {};
      const keys = Object.keys(options);
      keys.forEach((key)=>{
        const opts = options[key];
        this.checkItemRefresh(opts);
      });
    });
  }

  sendUpdate(url, handler, data){
    const urlMatches = (urlObj)=>urlObj.url===url;
    const {
      callback,
      options,
      urls
    } = handler;
    const isError = isErrorObject(data);
    urls.forEach((urlObj)=>{
      if(urlMatches(urlObj)){
        const {
          key
        } = urlObj;
        if(isError){
          return setImmediate(()=>callback({[key]: data}, key));
        }
        const transform = options[key];
        const {
          root = false,
          mapper,
          default: defaultValue
        } = transform;
        const resData = root===false?data:getObjectValue(root, data, defaultValue);
        const finalData = mapper?mapper(resData):resData;
        return setImmediate(()=>callback({[key]: finalData}, key));
      }
    });
  }

  processUpdate(method = 'get', url, err, data){
    const now = new Date();
    const key = this.getCacheKey(method, url);
    const keys = Object.keys(this.handles).filter(isNumeric).map(n=>+n);
    const allHandlers = keys.map((key)=>this.handles[key]);
    if(err){
      this.cache[key] = {
        data: err,
        at: now.getTime()
      };
      return allHandlers.forEach((handler)=>this.sendUpdate(url, handler, data));
    }
    this.cache[key] = {
      data,
      at: now.getTime()
    };
    allHandlers.forEach((handler)=>this.sendUpdate(url, handler, data));
  }

  fetch({url, method = 'get', ...options}){
    if(!url){
      return;
    }
    const key = this.getCacheKey(method, url);
    if(this.fetching.indexOf(key)>-1){
      return;
    }
    this.fetching = [...this.fetching, key];
    return fetchJson({
      url,
      method,
      ...options,
      callback: (err, data)=>{
        this.fetching = this.fetching.filter((u)=>u!==key);
        this.processUpdate(method, url, err, data);
      }
    });
  }

  clearWatch(watcher){
    this.handles = Object.keys(this.handles).reduce((handles, handle)=>{
      if(+handle!==watcher){
        return Object.assign({}, handles, {
          [handle]: this.handles[handle]
        });
      }
      return handles;
    }, {__last: this.handles.__last});
  }

  watch(options={}, changeCallback){
    const handle = this.handles.__last+1;
    const urls = flatten(Object.keys(options).map((key)=>{
      const opts = options[key];
      const {
        url
      } = opts;
      if(url){
        return {
          url,
          key
        };
      }
      return false;
    })).filter(e=>!!e);
    const newHandler = {
        urls,
        options,
        callback: changeCallback
      };
    this.handles = Object.assign({}, this.handles, {
      __last: handle,
      [handle]: newHandler
    });

    Object.keys(options).forEach((key)=>{
      const opts = options[key];
      const {
        url,
      } = opts;

      const cached = this.getCached(opts);
      if(cached){
        return this.sendUpdate(url, newHandler, cached);
      }

      this.fetch(opts);
    });

    return handle;
  }
};

export {
  Cache
};
