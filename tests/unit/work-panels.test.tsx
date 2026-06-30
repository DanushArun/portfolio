import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import AboutPanel from '@/components/work/panels/AboutPanel';
import ConnectPanel from '@/components/work/panels/ConnectPanel';
import { panelCopy } from '@/lib/copy';

const PANELS = [
  { title: 'SYSTEMS-FIRST ENGINEER', Component: AboutPanel },
  { title: 'SEND THE SIGNAL', Component: ConnectPanel },
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

  it('test_connect_email_when_rendered_matches_contact_source', () => {
    const email = panelCopy.W09_CONNECT.links.find((link) => link.label === 'EMAIL');

    expect(email?.href).toBe('mailto:danusharun999@gmail.com');
  });

  it('test_connect_links_when_rendered_expose_existing_handoff_paths', () => {
    const { container } = render(<ConnectPanel />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((link) => link.href);

    expect(hrefs).toEqual(expect.arrayContaining([
      'https://linkedin.com/in/danush-arun-5aa762267',
      'https://github.com/DanushArun',
      'mailto:danusharun999@gmail.com',
    ]));
  });

  it('test_about_panel_when_rendered_shows_operating_loop', () => {
    const { container } = render(<AboutPanel />);

    expect(container.textContent).toContain('architecture, implementation and defense');
  });
});
