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

type RightBoardParams = {
  scene: THREE.Scene;
  interactiveBoards: THREE.Mesh[];
  roomSize: number;
  boardWidth: number;
  boardHeight: number;
  boardY: number;
  frameMat: THREE.MeshStandardMaterial;
  makeModernBoard: BoardMaterialFactory;
};

export function addRightBoard({
  scene,
  interactiveBoards,
  roomSize,
  boardWidth,
  boardHeight,
  boardY,
  frameMat,
  makeModernBoard,
}: RightBoardParams) {
  const { material, redraw, drawTopics, drawLabel, drawClear } =
    makeModernBoard(boardWidth, boardHeight);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth, boardHeight),
    material,
  );
  board.rotation.y = -Math.PI / 2;
  board.position.set(roomSize / 2 - 0.03, boardY, 0);
  board.name = "right_board";
  Object.assign(board, { redraw, drawTopics, drawLabel, drawClear });
  scene.add(board);
  interactiveBoards.push(board);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth + 0.1, boardHeight + 0.1),
    frameMat,
  );
  frame.rotation.y = -Math.PI / 2;
  frame.position.set(roomSize / 2 - 0.01, boardY, 0);
  scene.add(frame);
}
