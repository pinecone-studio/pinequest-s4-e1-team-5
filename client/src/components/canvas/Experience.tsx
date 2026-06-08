import { useState, useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import InfiniteCorridorManager from './corridor/InfiniteCorridorManager';
import EntranceDoors from './entrance/EntranceDoors';
import EmptyCorridor from './entrance/EmptyCorridor';
import TeleportRoom from './corridor/TeleportRoom';
import RoomWarmup from './corridor/RoomWarmup';
import useInfiniteCamera from '../../hooks/useInfiniteCamera';
import SignSystem from './entrance/SignSystem';
import { useScene } from '../../context/SceneContext';
const ENTRANCE_DOORS_Z = 22;
const Experience = ({
  isLoaded,
  onSceneReady,
  performanceTier
}) => {
  const {
    hasEntered,
    markEntered,
    enterRoom,
    isTeleporting,
    isInRoom,
    pendingDoorClick
  } = useScene();
  const {
    camera
  } = useThree();
  const {
    setCameraOverride
  } = useInfiniteCamera({
    segmentLength: 80,
    scrollSpeed: 0.025,
    parallaxIntensity: 0.4,
    smoothing: 0.06,
    scrollEnabled: hasEntered && !isTeleporting && !isInRoom,
    parallaxEnabled: hasEntered && !isTeleporting && !isInRoom
  });
  const handleEntranceComplete = useCallback(() => {
    markEntered();
  }, [markEntered]);
  const handleDoorEnter = useCallback(doorId => {
    enterRoom(doorId);
  }, [enterRoom]);
  const isLowTier = performanceTier === 'LOW';
  return <>
            {}
            {}
            <RoomWarmup onWarmupComplete={onSceneReady} isLowTier={isLowTier} />

            {}
            {}
            {}
            {}

            {}
            {!hasEntered && <EmptyCorridor camera={camera} />}

            {}
            {!hasEntered && <EntranceDoors position={[0, 0, ENTRANCE_DOORS_Z]} onComplete={handleEntranceComplete} />}

            {}
            {!hasEntered && <SignSystem position={[0, 0, ENTRANCE_DOORS_Z]} />}

            {}
            <InfiniteCorridorManager onDoorEnter={handleDoorEnter} hideDoorsForSegments={hasEntered ? [] : [-1]} clipSegmentNeg1={!hasEntered} setCameraOverride={setCameraOverride} />

            {}
            <TeleportRoom />
        </>;
};
export default Experience;
