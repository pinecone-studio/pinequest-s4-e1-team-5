import { Text } from '@react-three/drei';
import { useEffect } from 'react';

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
      <Text fontSize={1} color="#e8e8e8" textAlign="center">
      </Text>
    </group>
  );
};

export default PhysicRoom;
