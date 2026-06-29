import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import AboutPanel from '@/components/work/panels/AboutPanel';
import ConnectPanel from '@/components/work/panels/ConnectPanel';
import { panelCopy } from '@/lib/copy';

const PANELS = [
  { title: 'SYSTEMS-FIRST ENGINEER', Component: AboutPanel },
  { title: "LET'S CONNECT", Component: ConnectPanel },
] as const;

afterEach(() => cleanup());

describe('work panels', () => {
  it.each(PANELS)('test_$title_when_rendered_shows_project_title', ({ title, Component }) => {
    const { container } = render(<Component />);

    expect(container.textContent).toContain(title);
  });

  it.each(PANELS)('test_$title_when_rendered_has_no_stub_copy', ({ Component }) => {
    const { container } = render(<Component />);

    expect(container.textContent).not.toContain('Stub');
  });

  it('test_connect_email_when_rendered_matches_resume_contact', () => {
    const email = panelCopy.W09_CONNECT.links.find((link) => link.label === 'EMAIL');

    expect(email?.href).toBe('mailto:danusharun999@gmail.com');
  });
});
