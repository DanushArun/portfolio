import { describe, expect, it } from 'vitest';

import {
  HI_LOOP_SEGMENTS,
  PRIMARY_CORRIDORS,
  TERMINAL_BRANCHES,
  TOPOLOGY_HUBS,
  getTopologyHub,
} from '@/components/scene/scenes/mira/supercluster-topology';
import { getTendrilCurves } from '@/components/scene/scenes/mira/generate-tendrils';

describe('MIRA supplied topology map', () => {
  it('test_topology_hubs_when_loaded_match_supplied_node_order', () => {
    expect(TOPOLOGY_HUBS.map((hub) => hub.lang)).toEqual(['EN', 'HI', 'TA', 'KN', 'TE']);
  });

  it('test_primary_corridors_when_loaded_include_supplied_backbone_count', () => {
    expect(PRIMARY_CORRIDORS).toHaveLength(8);
  });

  it('test_hi_loop_when_loaded_has_large_orbital_structure', () => {
    expect(HI_LOOP_SEGMENTS.length).toBeGreaterThanOrEqual(12);
  });

  it('test_terminal_branches_when_loaded_cover_all_language_hubs', () => {
    expect(new Set(TERMINAL_BRANCHES.map((branch) => branch.from))).toEqual(
      new Set(['EN', 'HI', 'TA', 'KN', 'TE']),
    );
  });

  it('test_gold_curves_when_generated_include_the_hi_orbital_loop', () => {
    const hi = getTopologyHub('HI');
    const maxGoldX = Math.max(...getTendrilCurves().gold.flatMap((curve) => [
      curve.a[0],
      curve.b[0],
      curve.c1[0],
      curve.c2[0],
    ]));

    expect(maxGoldX).toBeGreaterThan(hi.position[0] + 3.4);
  });
});
