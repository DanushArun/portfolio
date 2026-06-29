import { describe, expect, it } from 'vitest';

import {
  MIRA_ARTIFACT_BEATS,
  getMiraArtifactBeat,
  getMiraArtifactBeatByIndex,
} from '@/components/scene/scenes/mira/mira-artifact-model';

describe('mira artifact model', () => {
  it('test_beats_when_loaded_match_mira_catalogue_count', () => {
    expect(MIRA_ARTIFACT_BEATS).toHaveLength(8);
  });

  it('test_post_call_when_requested_returns_output_paths', () => {
    expect(getMiraArtifactBeat('post-call').outputs).toContain('crm');
  });

  it('test_lookup_when_index_out_of_range_clamps_to_last_beat', () => {
    expect(getMiraArtifactBeatByIndex(99).id).toBe('ownership');
  });
});
