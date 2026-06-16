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
  interactive: {
    params: InteractiveParam[];
    calculate: (p1: number, p2?: number, p3?: number) => number;
    unit: string;
  };
};

export const UNIQUE_TEXTURES = [
  { front: '/textures/gallery/monetuneprzod_painted.webp' },
  { front: '/textures/gallery/monetuneprzod_painted.webp' },
  { front: '/textures/gallery/monetuneprzod_painted.webp' },
  { front: '/textures/gallery/monetuneprzod_painted.webp' },
];

export const TOPICS: TopicData[] = [
  {
    id: 'newton',
    apiTopic: 'Newton Laws of Motion',
    title: 'НЬЮТОНЫ 2-Р ХУУЛЬ',
    formula: 'F = m · a',
    shortDetail: 'm — масс (кг)\na — хурдатгал (м/с²)',
    fullDetail:
      'Ньютоны 2-р хууль\nF = m · a\n\nm — биеийн масс (кг)\na — хурдатгал (м/с²)\n\nЖишээ: m=5кг, a=3м/с²\nF = 5×3 = 15 (Н)',
    textureIndex: 0,
    interactive: {
      params: [
        { name: 'm', label: 'Масс (m, кг)', min: 1, max: 50, default: 5 },
        { name: 'a', label: 'Хурдатгал (a, м/с²)', min: 1, max: 20, default: 3 },
      ],
      calculate: (m, a = 0) => m * a,
      unit: 'Н',
    },
  },
  {
    id: 'kinematics_v',
    apiTopic: 'Kinematics Velocity',
    title: 'ХУРД',
    formula: 'v = v₀ + a · t',
    shortDetail: 'v₀ — анхны хурд\na — хурдатгал\nt — хугацаа (с)',
    fullDetail:
      'Жигд хурдасгал хөдөлгөөн\nv = v₀ + a · t\n\nv₀ — анхны хурд (м/с)\na — хурдатгал (м/с²)\nt — хугацаа (с)\n\nЖишээ: v₀=2, a=3, t=4\nv = 2+3×4 = 14 (м/с)',
    textureIndex: 1,
    interactive: {
      params: [
        { name: 'v0', label: 'Анхны хурд (м/с)', min: 0, max: 30, default: 2 },
        { name: 'a', label: 'Хурдатгал (м/с²)', min: 0, max: 20, default: 3 },
        { name: 't', label: 'Хугацаа (с)', min: 1, max: 20, default: 4 },
      ],
      calculate: (v0, a = 0, t = 0) => v0 + a * t,
      unit: 'м/с',
    },
  },
  {
    id: 'kinematics_s',
    apiTopic: 'Kinematics Distance',
    title: 'НҮҮЛТ',
    formula: 's = v₀t + ½at²',
    shortDetail: 'v₀ — анхны хурд\na — хурдатгал\nt — хугацаа (с)',
    fullDetail:
      'Нүүлтийн томьёо\ns = v₀t + ½at²\n\nv₀ — анхны хурд (м/с)\na — хурдатгал (м/с²)\nt — хугацаа (с)\n\nЖишээ: v₀=0, a=9.8, t=3\ns ≈ 44.1 (м)',
    textureIndex: 2,
    interactive: {
      params: [
        { name: 'v0', label: 'Анхны хурд (м/с)', min: 0, max: 30, default: 0 },
        { name: 'a', label: 'Хурдатгал (м/с²)', min: 0, max: 20, default: 9.8 },
        { name: 't', label: 'Хугацаа (с)', min: 1, max: 20, default: 3 },
      ],
      calculate: (v0, a = 0, t = 0) => v0 * t + 0.5 * a * t * t,
      unit: 'м',
    },
  },
  {
    id: 'energy_k',
    apiTopic: 'Kinetic Energy',
    title: 'КИНЕТИК ЭНЕРГИ',
    formula: 'Eₖ = ½ · m · v²',
    shortDetail: 'm — масс (кг)\nv — хурд (м/с)',
    fullDetail:
      'Кинетик энерги\nEk = ½ · m · v²\n\nm — биеийн масс (кг)\nv — хурд (м/с)\n\nЖишээ: m=2кг, v=5м/с\nEk = ½×2×25 = 25 (Дж)',
    textureIndex: 3,
    interactive: {
      params: [
        { name: 'm', label: 'Масс (m, кг)', min: 1, max: 50, default: 2 },
        { name: 'v', label: 'Хурд (v, м/с)', min: 1, max: 30, default: 5 },
      ],
      calculate: (m, v = 0) => 0.5 * m * v * v,
      unit: 'Дж',
    },
  },
  {
    id: 'energy_p',
    apiTopic: 'Potential Energy',
    title: 'ПОТЕНЦИАЛ ЭНЕРГИ',
    formula: 'Eₚ = m · g · h',
    shortDetail: 'm — масс\ng ≈ 9.8 м/с²\nh — өндөр (м)',
    fullDetail:
      'Потенциал энерги\nEp = m · g · h\n\nm — масс (кг)\ng = 9.8 м/с²\nh — өндөр (м)\n\nЖишээ: m=3, h=10\nEp = 3×9.8×10 = 294 (Дж)',
    textureIndex: 0,
    interactive: {
      params: [
        { name: 'm', label: 'Масс (m, кг)', min: 1, max: 50, default: 3 },
        { name: 'h', label: 'Өндөр (h, м)', min: 1, max: 50, default: 10 },
      ],
      calculate: (m, h = 0) => m * 9.8 * h,
      unit: 'Дж',
    },
  },
  {
    id: 'ohm',
    apiTopic: 'Ohms Law Electricity',
    title: 'ОМЫ ХУУЛЬ',
    formula: 'U = I · R',
    shortDetail: 'I — гүйдэл (А)\nR — эсэргүүцэл (Ом)',
    fullDetail:
      'Омын хууль\nU = I · R\n\nU — хүчдэл (В)\nI — гүйдэл (А)\nR — эсэргүүцэл (Ом)\n\nЖишээ: I=2А, R=5Ом\nU = 2×5 = 10 (В)',
    textureIndex: 1,
    interactive: {
      params: [
        { name: 'I', label: 'Гүйдэл (I, А)', min: 1, max: 20, default: 2 },
        { name: 'R', label: 'Эсэргүүцэл (R, Ом)', min: 1, max: 50, default: 5 },
      ],
      calculate: (I, R = 0) => I * R,
      unit: 'В',
    },
  },
  {
    id: 'wave',
    apiTopic: 'Wave Properties',
    title: 'ДОЛГИОН',
    formula: 'v = λ · f',
    shortDetail: 'λ — долгионы урт (м)\nf — давтамж (Гц)',
    fullDetail:
      'Долгионы хурд\nv = λ · f\n\nλ — долгионы урт (м)\nf — давтамж (Гц)\nv — тархалтын хурд (м/с)\n\nЖишээ: λ=2м, f=10Гц\nv = 2×10 = 20 (м/с)',
    textureIndex: 2,
    interactive: {
      params: [
        { name: 'lambda', label: 'Долгионы урт (м)', min: 1, max: 20, default: 2 },
        { name: 'f', label: 'Давтамж (Гц)', min: 1, max: 100, default: 10 },
      ],
      calculate: (lambda, f = 0) => lambda * f,
      unit: 'м/с',
    },
  },
  {
    id: 'gravity',
    apiTopic: 'Free Fall Gravity',
    title: 'ЧӨЛӨӨТ УНАЛ',
    formula: 'h = ½ · g · t²',
    shortDetail: 'g ≈ 9.8 м/с²\nt — хугацаа (с)',
    fullDetail:
      'Чөлөөт унал\nh = ½ · g · t²\n\ng = 9.8 м/с² — таталцлын хурдатгал\nt — унах хугацаа (с)\nh — унах өндөр (м)\n\nЖишээ: t=3с\nh = ½×9.8×9 ≈ 44.1 (м)',
    textureIndex: 3,
    interactive: {
      params: [
        { name: 't', label: 'Хугацаа (t, с)', min: 1, max: 20, default: 3 },
      ],
      calculate: (t) => 0.5 * 9.8 * t * t,
      unit: 'м',
    },
  },
];

export const CARD_COUNT = TOPICS.length;
export const GAP = 2.8;
export const CARD_W = 1.5;
export const CARD_H = 2.5;
export const PAPER_REF_Y = -1.35;
