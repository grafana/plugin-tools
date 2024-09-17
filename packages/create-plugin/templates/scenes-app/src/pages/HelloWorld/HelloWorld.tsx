import React from 'react';
import { getScene } from './helloWorldScene';

const HelloWorld = () => {
  const scene = getScene();

  return <scene.Component model={scene} />;
};

export default HelloWorld;
