import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import MiraPanel from '@/components/work/panels/MiraPanel';

afterEach(() => cleanup());

describe('MIRA minimal frame chrome', () => {
  it('test_mira_panel_when_rendered_shows_only_mira_name', () => {
    const { container } = render(<MiraPanel />);

    expect(container.textContent?.trim()).toBe('MIRA');
  });
});
