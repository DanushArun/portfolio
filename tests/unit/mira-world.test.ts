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
      'Production outbound voice AI for live DriveX leads.',
      'First response reduced from 7s to under 500ms.',
      'Five Indian languages: English, Hindi, Tamil, Kannada, Telugu.',
      'VAD, streaming ASR, telephony WebSockets, Pipecat and FastAPI.',
      'Distributed call orchestration with multi-model response control.',
      'Post-call intent classification with confidence and ISO dates.',
      'Zoho CRM sync, WhatsApp auto-group creation, live bot and retries.',
      'Owned architecture, implementation, testing and Kubernetes deployment.',
    ]));
  });

  it('test_region_when_automation_selected_uses_the_hi_loop_anchor', () => {
    expect(getMiraWorkRegion('OPS_AUTOMATION').anchor[0]).toBeGreaterThan(3);
  });

  it('test_camera_stop_when_region_focused_moves_inside_supercluster', () => {
    expect(getMiraCameraStop('ORCHESTRATION').fov).toBeLessThan(getMiraCameraStop('OVERVIEW').fov);
  });
});
