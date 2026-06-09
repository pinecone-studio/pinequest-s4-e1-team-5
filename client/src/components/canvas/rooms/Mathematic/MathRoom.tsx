import { useEffect } from "react";

type MathRoomProps = {
  isWarmup?: boolean;
  onReady?: () => void;
};

export const MathRoom = ({ isWarmup = false, onReady }: MathRoomProps) => {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  if (isWarmup) return null;

  return <group name="MathRoom" />;
};
export default MathRoom;
