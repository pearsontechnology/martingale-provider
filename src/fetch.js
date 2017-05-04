import fetch from 'isomorphic-fetch';
import {
  merge
} from 'martingale-utils';

const makeFetchOptions = (...options)=>{
  return merge({credentials: 'same-origin'}, ...options);
};

const fetchJson=({url, callback, ...options})=>{
  return fetch(url, makeFetchOptions(options))
    .then((response)=>{
      response.json()
        .then((json)=>{
          return callback(null, json, response);
        })
        .catch((err)=>callback(err));
    })
    .catch((err)=>callback(err));
};

const postJson=({method="post", body, payload, ...options})=>{
  const jsonBody = JSON.stringify(payload || body);
  const headers = {
    'Content-Type': 'application/json'
  };
  fetchJson(makeFetchOptions(options, {method, body: jsonBody, headers}));
};

export {
  fetchJson,
  postJson
};
