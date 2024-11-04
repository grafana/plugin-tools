import { Locator } from '@playwright/test';

export function createSelectProxy(locator: Locator): Locator {
  return new Proxy<Locator>(locator, {
    get(target, prop, receiver) {
      if (prop === 'selectOption') {
        return selectOption.bind(target);
      }
      if (prop === '_selector') {
        const selector = Reflect.get(target, prop, receiver);
        return `${selector}\ >>\ div[class*=\"-grafana-select-value-container\"]`;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

const selectOption: Locator['selectOption'] = async function (this: Locator, values, options) {
  // Open the menu of the select component
  this.getByRole('combobox').click();

  if (typeof values === 'string') {
    const option = this.page().getByLabel('Select options menu').getByText(values);
    await option.click(options);
    return [values];
  }

  return Promise.resolve<string[]>([]);
};

// const textContent: Locator['textContent'] = async function (this: Locator, options) {
//   const singleContainer = this.locator('div[class*="-grafana-select-value-container"]');
//   const isSingle = await singleContainer.isVisible();

//   if (isSingle) {
//     return singleContainer.locator('div[class*="-singleValue"]').innerText(options);
//   }

//   const multiContainer = this.locator('div[class*="-grafana-select-multi-value-container"]');
//   const isMulti = await multiContainer.isVisible();

//   if (isMulti) {
//     const valueContainers = await multiContainer
//       .locator('div[class*="-grafana-select-multi-value-container"] > div')
//       .all();

//     const values = await Promise.all(valueContainers.map((v) => v.innerText(options)));
//     return Promise.resolve(values.join(', '));
//   }

//   return Promise.resolve(null);
// };
