export type InteractiveParam = {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
};

export type TopicData = {
  id: string;
  apiTopic: string;
  title: string;
  formula: string;
  shortDetail: string;
  fullDetail: string;
  textureIndex: number;
  // 🌟 Интерактив хэсэгт зориулсан шинэ талбарууд
  interactive: {
    params: InteractiveParam[];
    calculate: (p1: number, p2?: number, p3?: number) => number;
    unit: string;
  };
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
    interactive: {
      params: [
        { name: 'a', label: 'Суурь (a)', min: 1, max: 20, default: 6 },
        { name: 'h', label: 'Өндөр (h)', min: 1, max: 20, default: 4 },
      ],
      calculate: (a, h = 0) => 0.5 * a * h,
      unit: 'см²',
    },
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
    interactive: {
      params: [
        { name: 'a', label: 'Катет (a)', min: 1, max: 20, default: 3 },
        { name: 'b', label: 'Катет (b)', min: 1, max: 20, default: 4 },
      ],
      calculate: (a, b = 0) => Math.sqrt(a * a + b * b),
      unit: 'см',
    },
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
    interactive: {
      params: [
        { name: 'r', label: 'Радиус (r)', min: 1, max: 15, default: 5 },
      ],
      calculate: (r) => Math.PI * r * r,
      unit: 'см²',
    },
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
    interactive: {
      params: [
        { name: 'a', label: 'Урт (a)', min: 1, max: 25, default: 8 },
        { name: 'b', label: 'Өргөн (b)', min: 1, max: 25, default: 5 },
      ],
      calculate: (a, b = 0) => a * b,
      unit: 'см²',
    },
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
    interactive: {
      params: [
        { name: 'a', label: 'Дээд Суурь (a)', min: 1, max: 20, default: 4 },
        { name: 'b', label: 'Доод Суурь (b)', min: 1, max: 20, default: 8 },
        { name: 'h', label: 'Өндөр (h)', min: 1, max: 20, default: 5 },
      ],
      calculate: (a, b = 0, h = 0) => ((a + b) * h) / 2,
      unit: 'см²',
    },
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
    interactive: {
      params: [
        { name: 'r', label: 'Радиус (r)', min: 1, max: 12, default: 3 },
      ],
      calculate: (r) => (4 / 3) * Math.PI * Math.pow(r, 3),
      unit: 'см³',
    },
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
    interactive: {
      params: [
        { name: 'r', label: 'Радиус (r)', min: 1, max: 15, default: 2 },
        { name: 'h', label: 'Өндөр (h)', min: 1, max: 25, default: 5 },
      ],
      calculate: (r, h = 0) => Math.PI * r * r * h,
      unit: 'см³',
    },
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
    interactive: {
      params: [
        { name: 'dx', label: 'Δx (x₂ - x₁)', min: 1, max: 20, default: 3 },
        { name: 'dy', label: 'Δy (y₂ - y₁)', min: 1, max: 20, default: 4 },
      ],
      calculate: (dx, dy = 0) => Math.sqrt(dx * dx + dy * dy),
      unit: 'нэгж',
    },
  },
];

export const CARD_COUNT = TOPICS.length;
export const GAP = 2.8;
export const CARD_W = 1.5;
export const CARD_H = 2.5;
export const PAPER_REF_Y = -1.35;