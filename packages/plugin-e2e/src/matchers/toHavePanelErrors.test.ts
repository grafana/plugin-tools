import { describe, it, expect, vi } from 'vitest';

import { toHavePanelErrors } from './toHavePanelErrors';
import { DashboardPage } from '../models/pages/DashboardPage';

function createMockDashboard(errorCount: number): DashboardPage {
  const mockLocator = {
    count: vi.fn().mockResolvedValue(errorCount),
  };

  return {
    getByGrafanaSelector: vi.fn().mockReturnValue(mockLocator),
    ctx: {
      selectors: {
        components: {
          Panels: {
            Panel: {
              status: vi.fn().mockReturnValue('data-testid Panel status error'),
            },
          },
        },
      },
    },
  } as unknown as DashboardPage;
}

describe('toHavePanelErrors', () => {
  it('should pass when at least 1 error exists and no count given', async () => {
    const dashboard = createMockDashboard(2);
    const result = await toHavePanelErrors(dashboard);
    expect(result.pass).toBe(true);
  });

  it('should fail when 0 errors and no count given', async () => {
    const dashboard = createMockDashboard(0);
    const result = await toHavePanelErrors(dashboard);
    expect(result.pass).toBe(false);
    expect(result.message()).toContain('0');
  });

  it('should pass when count matches exactly', async () => {
    const dashboard = createMockDashboard(3);
    const result = await toHavePanelErrors(dashboard, 3);
    expect(result.pass).toBe(true);
  });

  it('should fail when count does not match', async () => {
    const dashboard = createMockDashboard(2);
    const result = await toHavePanelErrors(dashboard, 3);
    expect(result.pass).toBe(false);
    expect(result.message()).toContain('2');
    expect(result.message()).toContain('3');
  });

  it('should pass when count is 0 and no errors exist', async () => {
    const dashboard = createMockDashboard(0);
    const result = await toHavePanelErrors(dashboard, 0);
    expect(result.pass).toBe(true);
  });
});
