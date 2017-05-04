// provider-test.js
import React from 'react';
import PropTypes from 'prop-types';
import {Provider} from '../';
import renderer from 'react-test-renderer';

const Greet=({name='World'})=>(<div>Hello {name}!</div>);
Greet.propTypes={
  name: PropTypes.string
};

test('Renders a basic element', () => {
  const component = renderer.create(
    <Provider Component='span' />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Renders a custom component', () => {
  const component = renderer.create(
    <Provider Component={Greet} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Renders a custom component with static props', () => {
  const component = renderer.create(
    <Provider Component={Greet} props={{name: 'Test'}}/>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Renders a custom component with mapped values', () => {
  const mapper = ({value})=>{
    return {
      name: value
    };
  };
  const component = renderer.create(
    <Provider Component={Greet} props={{value: 'Mapped'}} mapper={mapper} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
