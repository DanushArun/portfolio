import { Composition } from 'remotion';

import { MiraRenderBoard } from './mira/MiraRenderBoard';

export function RemotionRoot(): React.JSX.Element {
  return (
    <Composition
      component={MiraRenderBoard}
      durationInFrames={150}
      fps={30}
      height={1080}
      id="MiraRenderBoard"
      width={1920}
    />
  );
}
