export type TopicData = {
  id: string;
  apiTopic: string;
  title: string;
  formula: string;
  shortDetail: string;
  fullDetail: string;
  textureIndex: number;
};

export const UNIQUE_TEXTURES = [
  {
    front: '/textures/gallery/monetuneprzod_painted.webp',
    painted: '/textures/gallery/monetuneprzod_painted.webp',
  },
  {
    front: '/textures/gallery/monetuneprzod_painted.webp',
    painted: '/textures/gallery/monetuneprzod_painted.webp',
  },
  {
    front: '/textures/gallery/monetuneprzod_painted.webp',
    painted: '/textures/gallery/monetuneprzod_painted.webp',
  },
  {
    front: '/textures/gallery/monetuneprzod_painted.webp',
    painted: '/textures/gallery/monetuneprzod_painted.webp',
  },
];

export const TOPICS: TopicData[] = [
  {
    id: 'triangle',
    apiTopic: 'Triangles',
    title: 'ГУРВАЛЖИН',
    formula: 'S = ½ · a · h',
    shortDetail: 'a — суурь,  h — өндөр\nP = a + b + c',
    fullDetail:
      'Гурвалжний талбай\nS = ½ · a · h\n\na — суурь тал\nh — перпендикуляр өндөр\n\nЖишээ: a=6, h=4\nS = ½ × 6 × 4 = 12 (см²)',
    textureIndex: 0,
  },
  {
    id: 'pythagorean',
    apiTopic: 'Pythagorean Theorem',
    title: 'ПИФАГОРЫН ТЕО.',
    formula: 'a² + b² = c²',
    shortDetail: 'a, b — катет\nc — гипотенуз',
    fullDetail:
      'Пифагорын теорем\na² + b² = c²\n\na, b — тэгш өнцгийн хоёр тал\nc — гипотенуз\n\nЖишээ: a=3, b=4\nc = √(9+16) = 5',
    textureIndex: 1,
  },
  {
    id: 'circle',
    apiTopic: 'Circles',
    title: 'ТОЙРОГ',
    formula: 'S = π · r²',
    shortDetail: 'r — радиус\nC = 2 · π · r',
    fullDetail:
      'Тойргийн талбай\nS = π · r²\n\nr — радиус\nC = 2πr — тойрогийн урт\n\nЖишээ: r=5\nS = π × 25 ≈ 78.54 (см²)',
    textureIndex: 2,
  },
  {
    id: 'rectangle',
    apiTopic: 'Rectangles and Polygons',
    title: 'ТЭГШ ӨНЦӨГТ',
    formula: 'S = a · b',
    shortDetail: 'a — урт,  b — өргөн\nP = 2(a + b)',
    fullDetail:
      'Тэгш өнцөгтийн талбай\nS = a · b\n\na — урт,  b — өргөн\nP = 2(a+b)\n\nЖишээ: a=8, b=5\nS = 40 (см²)',
    textureIndex: 3,
  },
  {
    id: 'trapezoid',
    apiTopic: 'Trapezoid',
    title: 'ТРАПЕЦ',
    formula: 'S = (a+b) · h / 2',
    shortDetail: 'a, b — суурь,  h — өндөр',
    fullDetail:
      'Трапецийн талбай\nS = (a+b) · h / 2\n\na, b — зэрэгцэх талууд\nh — өндөр\n\nЖишээ: a=4, b=8, h=5\nS = 30 (см²)',
    textureIndex: 0,
  },
  {
    id: 'sphere',
    apiTopic: 'Volume of Solids',
    title: 'БӨМБӨРЦӨГ',
    formula: 'V = 4/3 · π · r³',
    shortDetail: 'r — радиус\nS = 4 · π · r²',
    fullDetail:
      'Бөмбөрцөгийн эзэлхүүн\nV = 4/3 · π · r³\n\nГадаргуу:\nS = 4πr²\n\nЖишээ: r=3\nV ≈ 113.1 (см³)',
    textureIndex: 1,
  },
  {
    id: 'cylinder',
    apiTopic: 'Volume of Cylinder',
    title: 'ЦИЛИНДР',
    formula: 'V = π · r² · h',
    shortDetail: 'r — радиус,  h — өндөр\nS = 2πr(r+h)',
    fullDetail:
      'Цилиндрийн эзэлхүүн\nV = π · r² · h\n\nНийт гадаргуу:\nS = 2πr(r+h)\n\nЖишээ: r=2, h=5\nV ≈ 62.8 (см³)',
    textureIndex: 2,
  },
  {
    id: 'coordinate',
    apiTopic: 'Coordinate Geometry',
    title: 'КООРДИНАТ',
    formula: 'd = √((x₂-x₁)²+(y₂-y₁)²)',
    shortDetail: 'Хоёр цэгийн хоорондох зай',
    fullDetail:
      'Зайн томьёо\nd = √((x₂-x₁)²+(y₂-y₁)²)\n\nДунд цэг:\nM = ((x₁+x₂)/2, (y₁+y₂)/2)\n\nЖишээ: A(1,2), B(4,6)\nd = 5',
    textureIndex: 3,
  },
];

export const CARD_COUNT = TOPICS.length;
export const GAP = 2.8;
export const CARD_W = 1.5;
export const CARD_H = 2.5;
export const PAPER_REF_Y = -1.35;
