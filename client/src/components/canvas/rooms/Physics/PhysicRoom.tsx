import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import PhysicsBackground from './PhysicsBackground';

type Props = {
  showRoom?: boolean;
  onReady?: () => void;
  isExiting?: boolean;
  isWarmup?: boolean;
};

const PhysicRoomInner = ({ onReady }: Props) => {
  const hasReady = useRef(false);
  const frames = useRef(0);
  useFrame(() => {
    if (hasReady.current) return;
    if (++frames.current >= 5) { hasReady.current = true; onReady?.(); }
  });
  return <PhysicsBackground />;
};

const PhysicRoom = (props: Props) => (
  <Suspense fallback={null}>
    <PhysicRoomInner {...props} />
  </Suspense>
);

export default PhysicRoom;
