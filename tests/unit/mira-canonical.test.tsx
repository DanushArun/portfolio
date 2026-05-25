import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import MiraPanel from '@/components/work/panels/MiraPanel';

afterEach(() => cleanup());

describe('MIRA canonical frame chrome', () => {
  it('test_mira_panel_when_rendered_shows_reference_callouts', () => {
    render(<MiraPanel />);

    expect(screen.getByText('VOICE DATA OUTBOUND')).toBeInTheDocument();
  });

  it('test_mira_panel_when_rendered_shows_reference_interaction_rail', () => {
    render(<MiraPanel />);

    expect(screen.getByText('ACTIVATE')).toBeInTheDocument();
  });
});
