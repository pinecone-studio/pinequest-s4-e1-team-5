import { useCallback, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useScene } from '../../../context/SceneContext';

const ROOMS = [
  { id: 'gallery', label: 'THE GALLERY', icon: '◈', hint: 'projects', color: '#f7dd85' },
  { id: 'studio', label: 'THE STUDIO', icon: '⚡', hint: 'circuit lab', color: '#9ed8c1' },
  { id: 'about', label: 'ABOUT', icon: '★', hint: 'skills', color: '#d9c0ef' },
  { id: 'contact', label: 'CONTACT', icon: '✉', hint: 'message', color: '#efb9ad' }
];

const DOOR_WALK_TARGET_Z: Record<string, number> = {
  gallery: -2.2,
  studio: -16.2,
  about: -32.2,
  contact: -46.2
};

const panelStyle = {
  width: '12.6rem',
  padding: '0.68rem 0.72rem',
  color: '#161616',
  background:
    'linear-gradient(rgba(255, 255, 250, 0.9), rgba(255, 255, 250, 0.9)), url(/textures/paper-texture.webp) center/cover',
  border: '2px solid rgba(18, 18, 18, 0.82)',
  boxShadow: '5px 6px 0 rgba(18, 18, 18, 0.14)',
  transform: 'rotate(-1deg) translateY(-0.35rem)',
  fontFamily: '"Cabin Sketch", "Comic Sans MS", cursive',
  pointerEvents: 'auto',
  clipPath:
    'polygon(0 3%, 4% 0, 96% 1%, 100% 5%, 98% 94%, 94% 100%, 5% 98%, 0 94%)'
} as const;

const titleStyle = {
  display: 'block',
  marginBottom: '0.2rem',
  fontSize: '0.82rem',
  lineHeight: 1,
  letterSpacing: 0,
  textTransform: 'uppercase'
} as const;

const listStyle = {
  display: 'grid',
  gap: '0.34rem',
  marginTop: '0.5rem'
} as const;

const buttonStyle = {
  display: 'grid',
  gridTemplateColumns: '1.72rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '0.42rem',
  width: '100%',
  border: '1.5px solid rgba(18, 18, 18, 0.58)',
  background: 'rgba(255, 255, 255, 0.58)',
  color: '#161616',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.82rem',
  lineHeight: 1.08,
  padding: '0.28rem 0.36rem',
  textAlign: 'left'
} as const;

const iconStyle = {
  display: 'block',
  width: '1.55rem',
  height: '1.55rem',
  border: '1.5px solid rgba(18, 18, 18, 0.7)',
  borderRadius: '50%',
  textAlign: 'center',
  lineHeight: '1.45rem',
  fontWeight: 700
} as const;

type AvatarRoomSelectorProps = {
  setCameraOverride?: (active: boolean) => void;
};

export default function AvatarRoomSelector({ setCameraOverride }: AvatarRoomSelectorProps) {
  const anchorRef = useRef<THREE.Group>(null);
  const worldPosition = useRef(new THREE.Vector3());
  const visibleRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [walkingRoom, setWalkingRoom] = useState<string | null>(null);
  const { camera } = useThree();
  const { hasEntered, isInRoom, isTeleporting, requestDoorOpen } = useScene();

  useFrame(() => {
    if (!anchorRef.current) {
      return;
    }

    anchorRef.current.getWorldPosition(worldPosition.current);
    const distance = camera.position.z - worldPosition.current.z;
    const shouldShow =
      hasEntered &&
      !isInRoom &&
      !isTeleporting &&
      !walkingRoom &&
      distance < 8 &&
      distance > -4;

    if (visibleRef.current !== shouldShow) {
      visibleRef.current = shouldShow;
      setIsVisible(shouldShow);
    }
  });

  const handleRoomSelect = useCallback(
    (roomId: string) => {
      if (isTeleporting || walkingRoom) {
        return;
      }

      const targetZ = DOOR_WALK_TARGET_Z[roomId];

      if (typeof targetZ !== 'number') {
        requestDoorOpen(roomId);
        return;
      }

      setWalkingRoom(roomId);
      visibleRef.current = false;
      setIsVisible(false);
      setCameraOverride?.(true);
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);
      gsap.to(camera.position, {
        x: 0,
        y: 0.2,
        z: targetZ,
        duration: Math.max(1.1, Math.min(2.7, Math.abs(camera.position.z - targetZ) * 0.055)),
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(0, 0.13, camera.position.z - 10);
        },
        onComplete: () => {
          camera.rotation.set(0, 0, 0);
          setWalkingRoom(null);
          requestDoorOpen(roomId);
        }
      });
    },
    [camera, isTeleporting, requestDoorOpen, setCameraOverride, walkingRoom]
  );

  return (
    <group ref={anchorRef} position={[1.38, 0.62, -0.28]}>
      {isVisible ? (
        <Html center zIndexRange={[60, 0]}>
          <aside
            aria-label="Room shortcuts"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            style={panelStyle}
          >
            <strong style={titleStyle}>quest select</strong>
            <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}>
              walk to a door
            </span>
            <div style={listStyle}>
              {ROOMS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleRoomSelect(room.id)}
                  onMouseEnter={() => setHoveredRoom(room.id)}
                  onMouseLeave={() => setHoveredRoom(null)}
                  onFocus={() => setHoveredRoom(room.id)}
                  onBlur={() => setHoveredRoom(null)}
                  style={{
                    ...buttonStyle,
                    background:
                      hoveredRoom === room.id
                        ? `linear-gradient(90deg, ${room.color}, rgba(255,255,255,0.72))`
                        : buttonStyle.background,
                    transform: hoveredRoom === room.id ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow:
                      hoveredRoom === room.id ? '2px 3px 0 rgba(18,18,18,0.14)' : 'none'
                  }}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    style={{
                      ...iconStyle,
                      background: room.color
                    }}
                  >
                    {room.icon}
                  </span>
                  <span>
                    <span style={{ display: 'block' }}>{room.label}</span>
                    <small style={{ display: 'block', opacity: 0.65 }}>{room.hint}</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </aside>
        </Html>
      ) : null}
    </group>
  );
}
