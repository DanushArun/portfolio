import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import MiraPanel from '@/components/work/panels/MiraPanel';
import {
  resetMiraStateForTest,
  setMiraFocus,
  syncMiraCatalogueForScene,
} from '@/lib/mira-state';

afterEach(() => {
  resetMiraStateForTest();
  cleanup();
});

describe('MIRA supercluster frame chrome', () => {
  it('test_mira_panel_when_rendered_shows_mira_name', () => {
    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('MIRA');
  });

  it('test_mira_panel_when_rendered_keeps_project_title_context', () => {
    const { container } = render(<MiraPanel />);
    const title = container.querySelector('[data-testid="mira-project-title"]');

    expect(title?.textContent).toBe('MIRA');
  });

  it('test_mira_panel_when_rendered_does_not_show_static_flow_board', () => {
    const { container } = render(<MiraPanel />);
    const text = container.textContent ?? '';

    expect(text).not.toContain('Live LeadTelephonyVAD / ASR');
    expect(container.querySelector('[data-testid="mira-system-trace"]')).toBeNull();
  });

  it('test_mira_panel_when_region_focused_shows_region_bound_proof', () => {
    setMiraFocus('LATENCY');

    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('7s -> <500ms');
  });

  it('test_mira_panel_when_scroll_selects_chapter_shows_particle_caption', () => {
    act(() => {
      syncMiraCatalogueForScene('W01_MIRA', 0.10);
    });

    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('1/8');
    expect(container.textContent).toContain('Production System');
  });
});
