import { mount } from 'svelte';
import App from './App.svelte';

const appElement = document.createElement('div');
appElement.id = 'app';
document.body.appendChild(appElement);

function getAppElement(): HTMLElement {
  return appElement;
}

const app = mount(App, {
  target: getAppElement(),
});

export default app;
