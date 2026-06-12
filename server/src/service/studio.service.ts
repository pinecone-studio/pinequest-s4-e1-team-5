type StudioPlatform = "youtube" | "blog" | "tiktok";

export type StudioSearchItem = {
  id: string;
  platform: StudioPlatform;
  title: string;
  description: string;
  image: string;
  paintedImage: string;
};

const rawStudioContent = [
  {
    id: "yt-001",
    platform: "youtube",
    title: "I Built a Website for Young Multi for $__,___",
    description:
      "It's late 2025, we're flying to space, and Young Multi... still didn't have his own website. So I took matters into my own hands.",
  },
  {
    id: "yt-002",
    platform: "youtube",
    title:
      "Turning an ordinary selfie into a professional AI photoshoot! How Google Nano Banana transformed my photo! (For Free)",
    description:
      "AI photoshoot editing video shown on the studio TV texture.",
  },
  {
    id: "yt-003",
    platform: "youtube",
    title: "React Three Fiber Crash Course",
    description: "Everything you need to know to get started with 3D in React.",
  },
  {
    id: "yt-004",
    platform: "youtube",
    title: "Shaders for Beginners",
    description: "Introduction to GLSL shaders in WebGL and Three.js.",
  },
  {
    id: "yt-005",
    platform: "youtube",
    title: "GSAP + Three.js Integration",
    description: "How to animate 3D objects with GSAP ScrollTrigger.",
  },
  {
    id: "yt-006",
    platform: "youtube",
    title: "Building Interactive 3D Scenes",
    description: "Raycasting, hover effects, and click interactions in Three.js.",
  },
  {
    id: "yt-007",
    platform: "youtube",
    title: "WebGL Performance Deep Dive",
    description: "Optimizing draw calls, geometry instancing, and more.",
  },
  {
    id: "yt-008",
    platform: "youtube",
    title: "Procedural Textures Tutorial",
    description: "Creating textures with noise and math functions.",
  },
  {
    id: "blog-001",
    platform: "blog",
    title: "Double Site of the Day confirmed! 🏆🏆",
    description:
      "You've probably noticed I've been sharing a bunch of SOTD certificates on my stories lately.",
  },
  {
    id: "blog-002",
    platform: "blog",
    title: "The Hand-Drawn Aesthetic",
    description: "How I achieved a sketch-like visual style using shaders.",
  },
  {
    id: "blog-003",
    platform: "blog",
    title: "Optimizing 3D for the Web",
    description: "Performance tips for smooth 60fps 3D experiences.",
  },
  {
    id: "blog-004",
    platform: "blog",
    title: "Creative Coding Journey",
    description: "My path from traditional dev to creative development.",
  },
  {
    id: "blog-005",
    platform: "blog",
    title: "The Future of Web Experiences",
    description: "Where I think interactive web is heading.",
  },
  {
    id: "blog-006",
    platform: "blog",
    title: "Design Systems for 3D",
    description: "Creating consistent 3D component libraries.",
  },
  {
    id: "blog-007",
    platform: "blog",
    title: "Accessibility in 3D Web",
    description: "Making immersive experiences accessible to everyone.",
  },
  {
    id: "blog-008",
    platform: "blog",
    title: "Audio in Web Experiences",
    description: "Adding spatial audio to enhance immersion.",
  },
  {
    id: "tt-001",
    platform: "tiktok",
    title: "Zaobserwuj mnie na TikToku! ✨",
    description: "TikTok follow card shown on the studio phone texture.",
  },
  {
    id: "tt-002",
    platform: "tiktok",
    title: "Coding a door animation 🚪",
    description: "POV: You open a door in Three.js",
  },
  {
    id: "tt-003",
    platform: "tiktok",
    title: "When the shader finally works 🎉",
    description: "The satisfaction of debugging shaders",
  },
  {
    id: "tt-004",
    platform: "tiktok",
    title: "Day in the life: WebGL Dev",
    description: "What I do as a creative developer",
  },
  {
    id: "tt-005",
    platform: "tiktok",
    title: "React vs Three.js POV 😅",
    description: "The struggle is real",
  },
  {
    id: "tt-006",
    platform: "tiktok",
    title: "Making a 3D button 🔘",
    description: "30 seconds of pure satisfaction",
  },
  {
    id: "tt-007",
    platform: "tiktok",
    title: "This shader took 3 hours 💀",
    description: "Was it worth it? Absolutely.",
  },
  {
    id: "tt-008",
    platform: "tiktok",
    title: "Hover effects compilation ✨",
    description: "My favorite micro-interactions",
  },
  {
    id: "tt-009",
    platform: "tiktok",
    title: "Loading screen ideas 🔄",
    description: "Creative preloader concepts",
  },
  {
    id: "tt-010",
    platform: "tiktok",
    title: "Cursor goes brrr 🖱️",
    description: "Custom cursor madness",
  },
  {
    id: "tt-011",
    platform: "tiktok",
    title: "Parallax scrolling magic 🪄",
    description: "Simple but effective",
  },
  {
    id: "tt-012",
    platform: "tiktok",
    title: "Text animation inspo 📝",
    description: "Typography that moves",
  },
] satisfies Array<{
  id: string;
  platform: StudioPlatform;
  title: string;
  description: string;
}>;

const youtubeImages = [
  "/textures/studio/tvfront_filmikprojektdlamultiego.webp",
  "/textures/studio/tvfront_filmikedytowaniezdjec.webp",
];
const youtubePaintedImages = [
  "/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp",
  "/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp",
];
const blogImages = ["/textures/studio/monitorfront_postnafbdoublewinner.webp"];
const blogPaintedImages = [
  "/textures/studio/monitorfront_postnafbdoublewinner_painted.webp",
];
const tiktokImages = ["/textures/studio/phonefront_followmeontiktok.webp"];
const tiktokPaintedImages = [
  "/textures/studio/phonefront_followmeontiktok_painted.webp",
];

let youtubeIndex = 0;
let blogIndex = 0;
let tiktokIndex = 0;
let youtubePaintedIndex = 0;
let blogPaintedIndex = 0;
let tiktokPaintedIndex = 0;

const studioContent: StudioSearchItem[] = rawStudioContent.map((item) => {
  const image =
    item.platform === "youtube"
      ? youtubeImages[youtubeIndex++ % youtubeImages.length]
      : item.platform === "blog"
        ? blogImages[blogIndex++ % blogImages.length]
        : tiktokImages[tiktokIndex++ % tiktokImages.length];
  const paintedImage =
    item.platform === "youtube"
      ? youtubePaintedImages[youtubePaintedIndex++ % youtubePaintedImages.length]
      : item.platform === "blog"
        ? blogPaintedImages[blogPaintedIndex++ % blogPaintedImages.length]
        : tiktokPaintedImages[tiktokPaintedIndex++ % tiktokPaintedImages.length];

  return {
    ...item,
    image,
    paintedImage,
  };
});

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export function searchStudioContent(query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return studioContent;
  }

  return studioContent.filter((item) => {
    const searchableText = normalize(
      `${item.title} ${item.description} ${item.platform}`,
    );
    return searchableText.includes(normalizedQuery);
  });
}

export function getStudioTitles() {
  return studioContent.map((item) => ({
    id: item.id,
    title: item.title,
    platform: item.platform,
  }));
}
