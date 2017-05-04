import React from 'react';
import PropTypes from 'prop-types';
import {
  isTheSame
} from 'martingale-utils';
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
          return Object.assign({}, props, {[key]: value});
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
