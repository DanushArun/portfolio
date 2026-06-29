import { describe, expect, it } from 'vitest';

import {
  MIRA_WORK_REGIONS,
  getMiraCameraStop,
  getMiraWorkRegion,
} from '@/lib/mira-world';
import { MIRA_RECRUITER_JOURNEY } from '@/lib/mira-state';

describe('MIRA work-region map', () => {
  it('test_regions_when_declared_follow_the_recruiter_journey', () => {
    expect(MIRA_WORK_REGIONS.map((region) => region.id)).toEqual(MIRA_RECRUITER_JOURNEY);
  });

  it('test_regions_when_declared_cover_the_resume_proof_points', () => {
    const proof = MIRA_WORK_REGIONS.flatMap((region) => region.proof);

    expect(proof).toEqual(expect.arrayContaining([
      'MIRA is a production voice AI intake system for multilingual lead qualification.',
      'Manual SDR follow-ups on DriveX leads were slow and unscalable.',
      'Full-duplex audio stream orchestration across multiple models.',
      'Distributed, containerized services handle audio, intent, and sync.',
      'Pipelining ASR and LLM execution collapsed first-byte response time.',
      'One core flow handles English, Hindi, Tamil, Kannada, and Telugu.',
      'CRM sync and WhatsApp automation turned calls into actionable workflows.',
    ]));
  });

  it('test_region_when_automation_selected_uses_the_hi_loop_anchor', () => {
    expect(getMiraWorkRegion('reflection').anchor[0]).toBeGreaterThan(1);
  });

  it('test_camera_stop_when_region_focused_moves_inside_supercluster', () => {
    expect(getMiraCameraStop('proof').fov).toBeLessThan(getMiraCameraStop('OVERVIEW').fov);
  });
});
