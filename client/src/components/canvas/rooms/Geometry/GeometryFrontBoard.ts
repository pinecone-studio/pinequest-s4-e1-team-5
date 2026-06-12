import * as THREE from "three";

type BoardMaterialFactory = (
  width: number,
  height: number,
) => {
  material: THREE.MeshStandardMaterial;
  redraw: (lines: string[]) => void;
  drawTopics: () => void;
  drawLabel: (label: string) => void;
  drawClear: () => void;
};

type Params = {
  scene: THREE.Scene;
  interactiveBoards: THREE.Mesh[];
  roomSize: number;
  boardHeight: number;
  boardY: number;
  frameMat: THREE.MeshStandardMaterial;
  makeModernBoard: BoardMaterialFactory;
};

export function addFrontBoard({
  scene,
  interactiveBoards,
  roomSize,
  boardHeight,
  boardY,
  frameMat,
  makeModernBoard,
}: Params) {
  const boardWidth = roomSize * 0.82;
  const { material, redraw, drawTopics, drawLabel, drawClear } =
    makeModernBoard(boardWidth, boardHeight);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth, boardHeight),
    material,
  );
  board.position.set(0, boardY, -roomSize / 2 + 0.03);
  board.name = "front_board";
  Object.assign(board, { redraw, drawTopics, drawLabel, drawClear });
  scene.add(board);
  interactiveBoards.push(board);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth + 0.1, boardHeight + 0.1),
    frameMat,
  );
  frame.position.set(0, boardY, -roomSize / 2 + 0.01);
  scene.add(frame);
}
