import { cleanup, render } from '@testing-library/react';
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

  it('test_mira_panel_when_rendered_shows_language_labels', () => {
    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('ENHITAKNTE');
  });

  it('test_mira_panel_when_region_focused_shows_region_bound_proof', () => {
    setMiraFocus('LATENCY');

    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('7s -> <500ms');
  });

  it('test_mira_panel_when_scroll_selects_chapter_shows_catalogue_progress', () => {
    syncMiraCatalogueForScene('W01_MIRA', 0.10);

    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('MIRA catalogue');
    expect(container.textContent).toContain('1/8');
    expect(container.textContent).toContain('Production System');
  });
});
