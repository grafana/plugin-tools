import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { AnnotationEditPage, AnnotationPage } from '../models';

type AnnotationEditPageFixture = TestFixture<AnnotationEditPage, PlaywrightArgs>;

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
