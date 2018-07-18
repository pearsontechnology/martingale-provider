import React from 'react';
import PropTypes from 'prop-types';
import {
  isTheSame
} from '@martingale/utils';
import {
  Cache
} from './cache';

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


const cache = new Cache();

const checkCacheUpdates = ()=>{
  cache.checkForUpdates();
  setTimeout(checkCacheUpdates, 1000);
};

setTimeout(checkCacheUpdates, 1000);


const getComponentPropTypes = (component)=>{
  if(!component){
    return false;
  }
  if(component && component.propTypes){
    return component.propTypes;
  }
  if(component.prototype && component.prototype.propTypes){
    return component.prototype.propTypes;
  }
  return false;
};

const getComponentName = (component)=>{
  if(typeof(component)==='string'){
    return component;
  }
  if(typeof(component)==='function'){
    return component.name;
  }
  if(component){
    return component.type;
  }
};

/**
 * Fetches data from remote endpoints and returns an instance of a React Class providing the data as properties
 * @param {object} options
 * @param {class} options.Component - React Class to render once the data is available
 * @param {array} options.children - Array of children to pass to the component
 * @param {object} options.provide - Hash of key/options to pass into the component
 * @param {object} options.provide.key - Name of the property, this is the HASH key, don't use the word "key" as that is a reseved word in React
 * @param {string} options.provide.key.url - URL to fetch data from
 * @param {string} options.provide.key.method - HTTP Method, defaults to GET
 * @param {string} options.provide.key.headers - Hash of headers to pass through with the request
 * @param {function} options.provide.key.mapper - Used to mutate the properties before they are sent to the top level mutation
 * @param {string} options.provide.key.root - Member name of the data to return from the request
 * @param {number} options.provide.key.refresh - Refresh interval, if set then every x milliseconds a new set of data will be fetched and sent to the component instance
 * @param {function} options.mapper - Used to mutate the properties before they are sent to the component instance
 * @param {object} options.props - Additional properties to return
 *
 * @example
 * import React, {Component} from 'react';
 * import ReactDOM from 'react-dom';
 * import PropTypes from 'prop-types';
 * import {Provider} from 'martingale-provider';
 *
 * // Some static properties to send
 * const data = {
 *   name: 'Test',
 *   value: 'Mapped',
 *   people: [
 *     {name: 'Bob'},
 *     {name: 'Sue'},
 *     {name: 'Phil'},
 *     {name: 'Henry'},
 *   ]
 * };
 *
 * // Some helper objects, just cuz
 * const Greet=({name='World'})=>(<div>Hello {name}!</div>);
 * Greet.propTypes={
 *   name: PropTypes.string
 * };
 * const GreetList=({people=[]})=><div>{people.map((person, index)=><Greet key={index} {...person} />)}</div>;
 * const JsonView=({json})=><pre>{JSON.stringify(json, null, 2)}</pre>
 *
 * // A mapper function that takes the value member and returns it as the name member
 * const mapper = ({value})=>{
 *   return {
 *     name: value
 *   };
 * };
 *
 * // A list of provider sources to send to provide
 * const sources = {
 *   json: {
 *     url: 'http://httpbin.org/get'
 *   }
 * };
 *
 * class App extends Component {
 *   render() {
 *     return (
 *       <div className="App">
 *         <Provider Component={Greet} /> // Will output "Hello World!"
 *         <Provider Component={Greet} props={data}/> // Will output "Hello Test!"
 *         <Provider Component={GreetList} props={data}/> // Will output a list of Hello's
 *         <Provider Component={Greet} props={data} mapper={mapper} /> // Will output "Hello Mapped!"
 *         <Provider Component={JsonView} provide={sources} /> // Will output a pre tag with the results from httpbin
 *       </div>
 *     );
 *   }
 * };
 *
 * ReactDOM.render(
 *   <App />,
 *   document.getElementById('root')
 * );
 */

const Provider = ({Component, children, provide, mapper, props})=>{
  const componentName = getComponentName(Component);
  const componentPropTypes=getComponentPropTypes(Component);
  class ProvidedComponent extends React.Component{
    constructor(){
      super();
      this.state = {};
      this.staticProps = props;
    }

    propExists(prop){
      return typeof(this.props[prop])!=='undefined';
    }

    propIsValid(key, value){
      if(componentPropTypes){
        try{
          return !PropTypes.checkPropTypes(componentPropTypes, {[key]: value}, 'prop', componentName);
        }catch(e){
          console.error(e);
          console.error('propIsValid', componentName, key, value);
          return false;
        }
      }
      return true;
    }

    mapPropValues(propValues){
      if(typeof(mapper)==='function'){
        return mapper(propValues);
      }
      return propValues;
    }

    providedProps(){
      const data = this.state.__data || {};
      const staticPropsValues = this.staticProps;
      const staticProps = Object.keys(staticPropsValues||{}).reduce((props, key)=>{
        return Object.assign({}, props, {[key]: staticPropsValues[key]});
      }, {});
      const allValues = Object.keys(data).reduce((props, key)=>{
        return Object.assign({}, props, {[key]: data[key]});
      }, staticProps);
      const propValues = this.mapPropValues(allValues);
      const componentValues = Object.keys(propValues).reduce((vals, key)=>{
        const value = propValues[key];
        if(this.propIsValid(key, value)){
          return Object.assign({}, vals, {[key]: value});
        }
        return vals;
      }, {});
      return componentValues;
    }

    componentDidMount(){
      this.watcher = cache.watch(provide, (res, key)=>{
        if(this.watcher === false){
          return;
        }
        const {
          __data: data = {}
        } = this.state;
        const existingData = data[key];
        const newData = res[key];
        if(!isTheSame(existingData, newData)){
          const stateData = Object.assign({}, data, res);
          this.setState({__data: stateData});
          if(this.props.onDataUpdated){
            this.props.onDataUpdated(stateData);
          }
        }
      });
    }

    componentWillUnmount(){
      cache.clearWatch(this.watcher);
      this.watcher = false;
    }

    render(){
      if(React.isValidElement(Component)){
        return Component;
      }
      const compProps = Object.assign({}, this.providedProps());
      if(children){
        return <Component {...compProps}>{children(compProps)}</Component>
      }
      return <Component {...compProps} />
    }
  };

  return <ProvidedComponent />;
};

export {
  Provider,
  cache
};
