
import { Html } from '@react-three/drei';
import { useEffect } from 'react';
import CircuitCanvas from '../../../ui/CircuitCanvas';

type PhysicRoomProps = {
  showRoom?: boolean;
  onReady?: () => void;
  isExiting?: boolean;
  isWarmup?: boolean;
};

const PhysicRoom = ({ onReady }: PhysicRoomProps) => {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <group>
      <Html
        transform
        center
        position={[0, 0, 0]}
        distanceFactor={3.2}
        style={{
          width: '760px',
          height: '520px',
          pointerEvents: 'auto'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background: '#f8f8f2',
            border: '2px solid #1f1f1f',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)'
          }}
        >
          <CircuitCanvas />
        </div>
      </Html>
    </group>
  );
};
export default PhysicRoom;
