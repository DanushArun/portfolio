import { describe, expect, it } from 'vitest';

import { getPortfolioChapter } from '@/lib/portfolio-book';
import { samplePortfolioReadingCamera } from '@/lib/portfolio-book-route';

describe('portfolio book route', () => {
  it('test_reading_camera_when_wavefield_title_faces_glyph_plane', () => {
    const chapter = getPortfolioChapter('WAVEFIELD');
    const camera = samplePortfolioReadingCamera(chapter);
    const depth = camera.position.z - chapter.node.anchor[2];

    expect(depth).toBeGreaterThan(4.5);
  });
});
