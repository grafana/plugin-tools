import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { AnnotationEditPage, AnnotationPage } from '../models';
import { PlaywrightCombinedArgs } from './types';

type AnnotationEditPageFixture = TestFixture<
  AnnotationEditPage,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

export const annotationEditPage: AnnotationEditPageFixture = async (
  { page, selectors, grafanaVersion, request },
  use,
  testInfo
) => {
  const annotationPage = new AnnotationPage({ page, selectors, grafanaVersion, request, testInfo });
  await annotationPage.goto();
  const annotationEditPage = await annotationPage.clickAddNew();
  await use(annotationEditPage);
};
