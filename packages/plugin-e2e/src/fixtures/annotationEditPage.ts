import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { AnnotationEditPage, AnnotationPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type AnnotationEditPageFixture = TestFixture<
  AnnotationEditPage,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

const annotationEditPage: AnnotationEditPageFixture = async ({ page, selectors, grafanaVersion, request }, use) => {
  const annotationPage = new AnnotationPage({ page, selectors, grafanaVersion, request });
  await annotationPage.goto();
  const annotationEditPage = await annotationPage.clickAddNew();
  await use(annotationEditPage);
};

export default annotationEditPage;
