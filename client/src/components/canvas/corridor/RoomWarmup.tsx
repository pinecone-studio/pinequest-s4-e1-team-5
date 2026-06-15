import { useRef, useState, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import MathRoom from '../rooms/Mathematic/MathRoom';
import ChemistryRoom from '../rooms/Chemistry/ChemistryRoom';
import PhysicRoom from '../rooms/Physics/PhysicRoom';
import GeometryRoom from '../rooms/Geometry/GeometryRoom';



const RoomWarmup = ({
  onWarmupComplete,
  isLowTier
}) => {
  const [isDone, setIsDone] = useState(false);
  const frameCount = useRef(0);
  const completeFired = useRef(false);
  const {
    gl,
    scene,
    camera
  } = useThree();
  const warmupStart = useRef(performance.now());
  useFrame(() => {
    if (isDone || completeFired.current) return;
    frameCount.current++;
    const targetFrames = isLowTier ? 1 : 2;
    if (frameCount.current >= targetFrames) {
      completeFired.current = true;
      const finishWarmup = () => {
        const warmupDuration = ((performance.now() - warmupStart.current) / 1000).toFixed(2);
        requestAnimationFrame(() => {
          setIsDone(true);
          onWarmupComplete?.();
        });
      };
      if (isLowTier) {
        finishWarmup();
        return;
      }
      if (gl.compileAsync) {
        gl.compileAsync(scene, camera, scene).then(finishWarmup).catch(err => {
          console.error('Async compilation failed, falling back to sync', err);
          gl.compile(scene, camera);
          finishWarmup();
        });
      } else {
        gl.compile(scene, camera);
        finishWarmup();
      }
    }
  });
  if (isDone) return null;
  if (isLowTier) return null;
  const noop = () => {};
  return <group position={[0, -500, 0]}>
            {}
            <Suspense fallback={null}>
                <group position={[-20, 0, 0]}>
                    <MathRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
            <Suspense fallback={null}>
                <group position={[20, 0, 0]}>
                    <ChemistryRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
            <Suspense fallback={null}>
                <group position={[-20, 0, -50]}>
                    <PhysicRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
            <Suspense fallback={null}>
                <group position={[20, 0, -50]}>
                    <GeometryRoom showRoom={true} onReady={noop} isExiting={false} isWarmup={true} />
                </group>
            </Suspense>
        </group>;
};
export default RoomWarmup;