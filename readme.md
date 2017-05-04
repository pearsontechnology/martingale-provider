# Martingale provider

Used to provide data from source URLs or static values to React Components for pages/components within Martingale.

## Install

Available once we opensource everything

```sh
yarn add martingale-provider
```

## Running tests

```
yarn test
```

## Creating a build

```
yarn compile
```

# Components

## Provider

Description

### Properties

 * Component - The react component to render with the provided values
 * children - Child components of Component
 * provide - Hash of objects to fetch from remote
  * [name] - Name to assign to the response
   * method - HTTP/S method to use, defaults to GET
   * root - Root object to use, if none then return the entire payload
   * url - URL of resource that provides the data
   * cache- Number, cache timeout in milliseconds
 * mapper - Function that can be used to convert all of the properties into a new structure
 * props - Static properties to feed to the instance of Component

### Example

```js
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {Provider} from 'martingale-provider';

// Some static properties to send
const data = {
  name: 'Test',
  value: 'Mapped',
  people: [
    {name: 'Bob'},
    {name: 'Sue'},
    {name: 'Phil'},
    {name: 'Henry'},
  ]
};

// Some helper objects, just cuz
const Greet=({name='World'})=>(<div>Hello {name}!</div>);
Greet.propTypes={
  name: PropTypes.string
};
const GreetList=({people=[]})=><div>{people.map((person, index)=><Greet key={index} {...person} />)}</div>;
const JsonView=({json})=><pre>{JSON.stringify(json, null, 2)}</pre>

// A mapper function that takes the value member and returns it as the name member
const mapper = ({value})=>{
  return {
    name: value
  };
};

// A list of provider sources to send to provide
const sources = {
  json: {
    url: 'http://httpbin.org/get'
  }
};

class App extends Component {
  render() {
    return (
      <div className="App">
        <Provider Component={Greet} /> // Will output "Hello World!"
        <Provider Component={Greet} props={data}/> // Will output "Hello Test!"
        <Provider Component={GreetList} props={data}/> // Will output a list of Hello's
        <Provider Component={Greet} props={data} mapper={mapper} /> // Will output "Hello Mapped!"
        <Provider Component={JsonView} provide={sources} /> // Will output a pre tag with the results from httpbin
      </div>
    );
  }
};

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```
