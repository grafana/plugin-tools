import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { DashboardEditViewArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { AnnotationEditPage } from '../../models';

type GotoAnnotationEditPageFixture = TestFixture<
  (args: DashboardEditViewArgs<string>) => Promise<AnnotationEditPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

const gotoAnnotationEditPage: GotoAnnotationEditPageFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(async (args) => {
    const annotationEditPage = new AnnotationEditPage(
      { page, selectors, grafanaVersion, request, testInfo },
      { dashboard: args.dashboard, id: args.id }
    );
    await annotationEditPage.goto();
    return annotationEditPage;
  });
};

export default gotoAnnotationEditPage;
