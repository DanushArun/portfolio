import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import MiraPanel from '@/components/work/panels/MiraPanel';

afterEach(() => cleanup());

describe('MIRA supercluster frame chrome', () => {
  it('test_mira_panel_when_rendered_shows_mira_name', () => {
    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('MIRA');
  });

  it('test_mira_panel_when_rendered_shows_language_labels', () => {
    const { container } = render(<MiraPanel />);

    expect(container.textContent).toContain('ENHITAKNTE');
  });
});
