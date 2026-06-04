import { useMemo, memo, Suspense, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import GalleryRoom from '../rooms/Gallery/GalleryRoom';
import StudioRoom from '../rooms/Studio/StudioRoom';
import AboutRoom from '../rooms/About/AboutRoom';
import ContactRoom from '../rooms/Contact/ContactRoom';
const ROOM_CONFIG = {
  corridorWidth: 2.2,
  corridorHeight: 2.4,
  corridorDepth: 2,
  roomWidth: 30,
  roomHeight: 20,
  roomDepth: 25
};
const SUBTITLES = {
  'THE GALLERY': 'Explore my creative projects',
  'THE STUDIO': 'Watch behind the scenes',
  'DEV DIARY': 'My development journey',
  "LET'S CONNECT": 'Get in touch with me'
};
const NATURAL_TILE_W = 1582 / 94 * 0.15;
const RoomInterior = memo(({
  label,
  showRoom,
  onReady,
  isExiting
}) => {
  const {
    corridorWidth,
    corridorHeight,
    corridorDepth,
    roomWidth,
    roomHeight,
    roomDepth
  } = ROOM_CONFIG;
  const halfDepth = corridorDepth / 2;
  const roomZ = -corridorDepth - roomDepth / 2;
  const floorTexSrc = useTexture('/textures/corridor/kawalekpodlogi.webp');
  const wallTexSrc = useTexture('/textures/corridor/wall_texture.webp');
  const ceilingTexSrc = useTexture('/textures/corridor/ceiling_texture.webp');
  const bbTexSrc = useTexture('/textures/corridor/texturadoprogow.webp');
  const materials = useMemo(() => {
    const floorTex = floorTexSrc.clone();
    floorTex.needsUpdate = true;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(corridorDepth / 2.5, corridorWidth / 2.5);
    const wallTexL = wallTexSrc.clone();
    wallTexL.needsUpdate = true;
    wallTexL.wrapS = wallTexL.wrapT = THREE.RepeatWrapping;
    wallTexL.repeat.set(corridorDepth / 2, corridorHeight / 2);
    const wallTexR = wallTexSrc.clone();
    wallTexR.needsUpdate = true;
    wallTexR.wrapS = wallTexR.wrapT = THREE.RepeatWrapping;
    wallTexR.repeat.set(corridorDepth / 2, corridorHeight / 2);
    const ceilTex = ceilingTexSrc.clone();
    ceilTex.needsUpdate = true;
    ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
    ceilTex.repeat.set(corridorDepth / 2.5, corridorWidth / 2.5);
    const bbLeft = bbTexSrc.clone();
    bbLeft.needsUpdate = true;
    bbLeft.wrapS = bbLeft.wrapT = THREE.RepeatWrapping;
    bbLeft.repeat.set(corridorDepth / NATURAL_TILE_W, 1);
    const bbRight = bbTexSrc.clone();
    bbRight.needsUpdate = true;
    bbRight.wrapS = bbRight.wrapT = THREE.RepeatWrapping;
    bbRight.repeat.set(corridorDepth / NATURAL_TILE_W, 1);
    return {
      corridorFloor: new THREE.MeshBasicMaterial({
        color: '#e0e0e0',
        map: floorTex,
        side: THREE.DoubleSide
      }),
      corridorWallL: new THREE.MeshBasicMaterial({
        color: '#e0e0e0',
        map: wallTexL,
        side: THREE.DoubleSide
      }),
      corridorWallR: new THREE.MeshBasicMaterial({
        color: '#e0e0e0',
        map: wallTexR,
        side: THREE.DoubleSide
      }),
      corridorCeiling: new THREE.MeshBasicMaterial({
        color: '#e0e0e0',
        map: ceilTex,
        side: THREE.DoubleSide
      }),
      bbLeft: new THREE.MeshBasicMaterial({
        color: '#e0e0e0',
        map: bbLeft,
        side: THREE.DoubleSide
      }),
      bbRight: new THREE.MeshBasicMaterial({
        color: '#e0e0e0',
        map: bbRight,
        side: THREE.DoubleSide
      }),
      threshold: new THREE.MeshBasicMaterial({
        color: '#e0e0e0',
        map: (() => {
          const t = bbTexSrc.clone();
          t.needsUpdate = true;
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(corridorWidth / NATURAL_TILE_W, 1);
          return t;
        })(),
        side: THREE.DoubleSide
      }),
      roomFloor: new THREE.MeshBasicMaterial({
        color: '#e5e5e5',
        side: THREE.DoubleSide
      }),
      roomCeiling: new THREE.MeshBasicMaterial({
        color: '#fafafa',
        side: THREE.DoubleSide
      }),
      roomWall: new THREE.MeshBasicMaterial({
        color: '#f0f0f0',
        side: THREE.DoubleSide
      }),
      roomBackWall: new THREE.MeshBasicMaterial({
        color: '#f5f5f5',
        side: THREE.DoubleSide
      })
    };
  }, [floorTexSrc, wallTexSrc, ceilingTexSrc, bbTexSrc]);
  const geometries = useMemo(() => ({
    corridorSideWall: new THREE.PlaneGeometry(corridorDepth, corridorHeight),
    corridorFloorCeiling: new THREE.PlaneGeometry(corridorWidth, corridorDepth),
    corridorBaseboard: new THREE.PlaneGeometry(corridorDepth, 0.15),
    threshold: new THREE.PlaneGeometry(corridorWidth, 0.15),
    roomFloorCeiling: new THREE.PlaneGeometry(roomWidth, roomDepth),
    roomSideWall: new THREE.PlaneGeometry(roomDepth, roomHeight),
    roomBackWall: new THREE.PlaneGeometry(roomWidth, roomHeight)
  }), []);
  const isGallery = label === 'THE GALLERY';
  useEffect(() => {
    if (showRoom && !['THE GALLERY', 'THE STUDIO', 'THE ABOUT', "LET'S CONNECT"].includes(label)) {
      onReady?.();
    }
  }, [showRoom, label, onReady]);
  return <group position={[0, -0.149, 0]}>
            {}
            {}
            <mesh position={[-corridorWidth / 2, 0, -halfDepth]} rotation={[0, Math.PI / 2, 0]} geometry={geometries.corridorSideWall} material={materials.corridorWallL} />

            {}
            <mesh position={[corridorWidth / 2, 0, -halfDepth]} rotation={[0, -Math.PI / 2, 0]} geometry={geometries.corridorSideWall} material={materials.corridorWallR} />

            {}
            <mesh position={[0, -corridorHeight / 2, -halfDepth]} rotation={[-Math.PI / 2, 0, 0]} geometry={geometries.corridorFloorCeiling} material={materials.corridorFloor} />

            {}
            <mesh position={[0, corridorHeight / 2, -halfDepth]} rotation={[Math.PI / 2, 0, 0]} geometry={geometries.corridorFloorCeiling} material={materials.corridorCeiling} />

            {}
            <mesh position={[-corridorWidth / 2 + 0.01, -corridorHeight / 2 + 0.075, -halfDepth]} rotation={[0, Math.PI / 2, 0]} geometry={geometries.corridorBaseboard} material={materials.bbLeft} />

            {}
            <mesh position={[corridorWidth / 2 - 0.01, -corridorHeight / 2 + 0.075, -halfDepth]} rotation={[0, -Math.PI / 2, 0]} geometry={geometries.corridorBaseboard} material={materials.bbRight} />

            {}
            <mesh position={[0, -corridorHeight / 2 + 0.005, -corridorDepth]} rotation={[-Math.PI / 2, 0, 0]} geometry={geometries.threshold} material={materials.threshold} />

            {}
            {showRoom && <group>
                    {isGallery ? <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <GalleryRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group> : label === 'THE STUDIO' ? <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <StudioRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group> : label === 'THE ABOUT' ? <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <AboutRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group> : label === "LET'S CONNECT" ? <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <ContactRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group> : <group position={[0, roomHeight / 2 - corridorHeight / 2, roomZ]}>
                            {}
                            <mesh position={[0, -roomHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={geometries.roomFloorCeiling} material={materials.roomFloor} />

                            {}
                            <gridHelper args={[Math.min(roomWidth, roomDepth), 20, '#cccccc', '#dddddd']} position={[0, -roomHeight / 2 + 0.01, 0]} />

                            {}
                            <mesh position={[0, roomHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={geometries.roomFloorCeiling} material={materials.roomCeiling} />

                            {}
                            <mesh position={[0, 0, -roomDepth / 2]} geometry={geometries.roomBackWall} material={materials.roomBackWall} />

                            {}
                            <mesh position={[-roomWidth / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} geometry={geometries.roomSideWall} material={materials.roomWall} />

                            {}
                            <mesh position={[roomWidth / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} geometry={geometries.roomSideWall} material={materials.roomWall} />

                            {}
                            <Text position={[0, 2, -roomDepth / 2 + 2]} fontSize={4} color="#1a1a1a" anchorX="center" anchorY="middle" maxWidth={roomWidth * 0.8} textAlign="center">
                                {label}
                            </Text>

                            {}
                            <Text position={[0, -1, -roomDepth / 2 + 2]} fontSize={0.8} color="#666666" anchorX="center" anchorY="middle" maxWidth={roomWidth * 0.7} textAlign="center">
                                {SUBTITLES[label] || ''}
                            </Text>

                            {}
                            {}
                            {}
                        </group>}
                </group>}
        </group>;
});
RoomInterior.displayName = 'RoomInterior';
export default RoomInterior;
