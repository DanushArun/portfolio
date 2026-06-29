import { describe, expect, it } from 'vitest';

import {
  MIRA_ARTIFACT_BEATS,
  getMiraArtifactVisualMode,
  getMiraArtifactBeat,
  getMiraArtifactBeatByIndex,
} from '@/components/scene/scenes/mira/mira-artifact-model';
import {
  MIRA_FLOW_STAGES,
  getMiraFlowSnapshot,
} from '@/lib/mira-flow';

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

  it('test_flow_stages_when_loaded_follow_mira_system_order', () => {
    expect(MIRA_FLOW_STAGES.map((stage) => stage.id)).toEqual([
      'lead',
      'telephony',
      'speech',
      'language',
      'orchestration',
      'handoff',
    ]);
  });

  it('test_flow_snapshot_when_each_beat_requested_has_particle_caption', () => {
    const snapshots = MIRA_ARTIFACT_BEATS.map((_, index) => getMiraFlowSnapshot(index));

    expect(snapshots.every((snapshot) => snapshot.title.length > 0)).toBe(true);
    expect(snapshots.every((snapshot) => snapshot.metric.length > 0)).toBe(true);
  });

  it('test_flow_copy_when_loaded_does_not_repeat_live_leads_as_metric', () => {
    const metrics = MIRA_ARTIFACT_BEATS.map((_, index) => getMiraFlowSnapshot(index).metric);

    expect(metrics).not.toContain('DriveX live leads');
    expect(metrics).not.toContain('LIVE LEADS');
    expect(metrics[0]).toBe('Production voice agent');
  });

  it('test_artifact_visual_mode_when_loaded_uses_filament_wake', () => {
    expect(getMiraArtifactVisualMode()).toBe('filament-wake');
  });
});
