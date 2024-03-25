import { TestFixture } from '@playwright/test';
import { DashboardEditViewArgs, PlaywrightArgs } from '../../types';
import { AnnotationEditPage } from '../../models/pages/AnnotationEditPage';

type GotoAnnotationEditPageFixture = TestFixture<
  (args: DashboardEditViewArgs<string>) => Promise<AnnotationEditPage>,
  PlaywrightArgs
>;

export const gotoAnnotationEditPage: GotoAnnotationEditPageFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(async (args) => {
    const annotationEditPage = new AnnotationEditPage({ page, selectors, grafanaVersion, request, testInfo }, args);
    await annotationEditPage.goto();
    return annotationEditPage;
  });
};
