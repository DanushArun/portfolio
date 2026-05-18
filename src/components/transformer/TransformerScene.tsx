'use client';

import { Canvas } from '@react-three/fiber';
import BlueprintGrid from './BlueprintGrid';
import CameraRig from './CameraRig';
import TokenizeStage from './stages/TokenizeStage';
import EmbedStage from './stages/EmbedStage';
import AttentionStage from './stages/AttentionStage';
import AttnOutputStage from './stages/AttnOutputStage';
import LayerNormStage from './stages/LayerNormStage';
import FFNStage from './stages/FFNStage';
import OutputStage from './stages/OutputStage';

export default function TransformerScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      <BlueprintGrid />
      <CameraRig />

      <TokenizeStage />
      <EmbedStage />
      <AttentionStage />
      <AttnOutputStage />
      <LayerNormStage />
      <FFNStage />
      <OutputStage />
    </Canvas>
  );
}
