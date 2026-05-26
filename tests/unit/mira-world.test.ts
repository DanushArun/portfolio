import { describe, expect, it } from 'vitest';

import { MIRA_WORLD_EDGES, MIRA_WORLD_NODES, getMiraCameraStop } from '@/lib/mira-world';

describe('MIRA world graph', () => {
  it('test_world_nodes_when_declared_include_the_voice_stack_modules', () => {
    expect(MIRA_WORLD_NODES.map((node) => node.id)).toEqual([
      'EN',
      'HI',
      'TA',
      'KN',
      'TE',
      'ASR',
      'ROUTER',
      'MEMORY',
      'TOOLS',
      'CRM',
      'WHATSAPP',
      'LEARNING',
    ]);
  });

  it('test_world_edges_when_declared_route_learning_back_to_english', () => {
    const hasReturnEdge = MIRA_WORLD_EDGES.some((edge) => {
      return edge.from === 'LEARNING' && edge.to === 'EN';
    });

    expect(hasReturnEdge).toBe(true);
  });

  it('test_camera_stop_when_focused_on_router_moves_inside_supercluster', () => {
    expect(getMiraCameraStop('ROUTER').fov).toBeLessThan(getMiraCameraStop('OVERVIEW').fov);
  });
});
