import React from 'react';

function MyComponent({ name }: { name: string }) {
  return <div>Hello, {name}!</div>;
}

MyComponent.displayName = 'MyComponent';
MyComponent.defaultProps = {
  name: 'World',
};

export default MyComponent;
