import { createContext, useContext, useState, useCallback, useMemo } from 'react';
const SceneContext = createContext(null);
export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
};
export const SceneProvider = ({
  children
}) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [exitRequested, setExitRequested] = useState(false);
  const [overlayContent, setOverlayContent] = useState(null);
  const [teleportTarget, setTeleportTarget] = useState(null);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [teleportPhase, setTeleportPhase] = useState(null);
  const [pendingDoorClick, setPendingDoorClick] = useState(null);
  const [isFastTeleport, setIsFastTeleport] = useState(false);
  const [schoolAssistantVisible, setSchoolAssistantVisible] = useState(false);
  const [schoolLevel, setSchoolLevel] = useState(null);
  const [schoolAssistantDoorId, setSchoolAssistantDoorId] = useState(null);
  const [approvedSchoolDoorClick, setApprovedSchoolDoorClick] = useState(null);
  const [cancelledSchoolDoorClick, setCancelledSchoolDoorClick] = useState(null);
  const [schoolAssistantPlacement, setSchoolAssistantPlacement] = useState(null);
  const enterRoom = useCallback(roomId => {
    setCurrentRoom(roomId);
    setExitRequested(false);
    setOverlayContent(null);
    setIsTeleporting(false);
    setPendingDoorClick(null);
    setApprovedSchoolDoorClick(null);
  }, []);
  const exitRoom = useCallback(() => {
    setCurrentRoom(null);
    setExitRequested(false);
    setOverlayContent(null);
  }, []);
  const requestExit = useCallback(() => {
    setExitRequested(true);
    setOverlayContent(null);
  }, []);
  const clearExitRequest = useCallback(() => {
    setExitRequested(false);
  }, []);
  const markEntered = useCallback(() => {
    setHasEntered(true);
    setSchoolAssistantVisible(false);
  }, []);
  const requestSchoolLevel = useCallback(prompt => {
    const nextDoorId = typeof prompt === 'object' && prompt !== null ? prompt.doorId : prompt;
    const nextPlacement = typeof prompt === 'object' && prompt !== null ? {
      side: prompt.side ?? 'left',
      label: prompt.label ?? null
    } : null;
    setSchoolAssistantDoorId(nextDoorId ?? null);
    setSchoolAssistantPlacement(nextPlacement);
    setSchoolAssistantVisible(true);
  }, []);
  const chooseSchoolLevel = useCallback(level => {
    setSchoolLevel(level);
    setSchoolAssistantVisible(false);
    if (schoolAssistantDoorId) {
      setApprovedSchoolDoorClick(schoolAssistantDoorId);
      setSchoolAssistantDoorId(null);
      setSchoolAssistantPlacement(null);
    } else {
      setHasEntered(true);
    }
  }, [schoolAssistantDoorId]);
  const clearSchoolDoorApproval = useCallback(() => {
    setApprovedSchoolDoorClick(null);
  }, []);
  const cancelSchoolLevel = useCallback(() => {
    const doorId = schoolAssistantDoorId;
    setSchoolAssistantVisible(false);
    setSchoolAssistantDoorId(null);
    setSchoolAssistantPlacement(null);
    if (doorId) setCancelledSchoolDoorClick(doorId);
  }, [schoolAssistantDoorId]);
  const clearCancelledSchoolDoorClick = useCallback(() => {
    setCancelledSchoolDoorClick(null);
  }, []);
  const openOverlay = useCallback(content => {
    setOverlayContent(content);
  }, []);
  const closeOverlay = useCallback(() => {
    setOverlayContent(null);
  }, []);
  const teleportTo = useCallback(roomId => {
    if (isTeleporting || roomId === currentRoom) return;
    setTeleportTarget(roomId);
    setIsTeleporting(true);
    setIsFastTeleport(true);
    setTeleportPhase('closing');
    setOverlayContent(null);
  }, [isTeleporting, currentRoom]);
  const requestDoorOpen = useCallback(roomId => {
    if (isTeleporting || roomId === currentRoom) return;
    setOverlayContent(null);
    setPendingDoorClick(roomId);
  }, [isTeleporting, currentRoom]);
  const startTeleportTransition = useCallback(() => {
    setTeleportPhase('teleporting');
  }, []);
  const openTeleportTransition = useCallback(() => {
    setTeleportPhase('opening');
  }, []);
  const completeTeleport = useCallback(() => {
    setPendingDoorClick(teleportTarget);
    setTeleportTarget(null);
  }, [teleportTarget]);
  const signalRoomReady = useCallback(() => {
    if (isFastTeleport) {
      setTeleportPhase('opening');
      setIsFastTeleport(false);
    }
  }, [isFastTeleport]);
  const finishPaperOpen = useCallback(() => {
    setTeleportPhase(null);
  }, []);
  const cancelTeleport = useCallback(() => {
    setTeleportTarget(null);
    setIsTeleporting(false);
    setTeleportPhase(null);
    setPendingDoorClick(null);
    setIsFastTeleport(false);
  }, []);
  const value = useMemo(() => ({
    currentRoom,
    hasEntered,
    exitRequested,
    overlayContent,
    enterRoom,
    exitRoom,
    requestExit,
    clearExitRequest,
    markEntered,
    openOverlay,
    closeOverlay,
    isInRoom: currentRoom !== null,
    teleportTarget,
    isTeleporting,
    teleportPhase,
    pendingDoorClick,
    isFastTeleport,
    schoolAssistantVisible,
    schoolLevel,
    schoolAssistantPlacement,
    approvedSchoolDoorClick,
    teleportTo,
    requestDoorOpen,
    startTeleportTransition,
    openTeleportTransition,
    completeTeleport,
    signalRoomReady,
    finishPaperOpen,
    cancelTeleport,
    requestSchoolLevel,
    chooseSchoolLevel,
    clearSchoolDoorApproval,
    cancelSchoolLevel,
    cancelledSchoolDoorClick,
    clearCancelledSchoolDoorClick
  }), [currentRoom, hasEntered, exitRequested, overlayContent, enterRoom, exitRoom, requestExit, clearExitRequest, markEntered, openOverlay, closeOverlay, teleportTarget, isTeleporting, teleportPhase, pendingDoorClick, isFastTeleport, schoolAssistantVisible, schoolLevel, schoolAssistantPlacement, approvedSchoolDoorClick, cancelledSchoolDoorClick, teleportTo, requestDoorOpen, startTeleportTransition, openTeleportTransition, completeTeleport, signalRoomReady, finishPaperOpen, cancelTeleport, requestSchoolLevel, chooseSchoolLevel, clearSchoolDoorApproval, cancelSchoolLevel, clearCancelledSchoolDoorClick]);
  return <SceneContext.Provider value={value}>
            {children}
        </SceneContext.Provider>;
};
export default SceneContext;
