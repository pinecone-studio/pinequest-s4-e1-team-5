"use client";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/interactive.scss";
import { useScene } from "../../context/SceneContext";

const keyAngles = [0, 30, 45, 60, 90, 180, 270, 360];
const waveWidth = 440;
const waveHeight = 230;
const wavePadding = 32;
const circleSize = 280;
const center = circleSize / 2;
const radius = 92;
const circumference = 2 * Math.PI * radius;

const labWidth = 420;
const labHeight = 360;
const labCenterX = labWidth / 2;
const labCenterY = 178;
const labRadius = 106;
const labYScale = 0.58;
const graphWidth = 470;
const graphHeight = 260;
const graphPadding = 40;
const trigTableAngles = [0, 30, 45, 60, 90, 180, 270, 360];

type Speed = 0.65 | 1 | 1.45;
type TrigFeature = "sin" | "cos" | "tan";
type TrigTableRow = "rad" | "sin" | "cos" | "tan";

export function SineCosineVisualizer() {
  return (
    <section className="mt-8">
      <ChalkboardTrigVisualizer />
    </section>
  );
}

function ChalkboardTrigVisualizer() {
  const {
    thetaDeg,
    thetaRad,
    sinValue,
    cosValue,
    phaseDeg,
    isPlaying,
    speed,
    setSpeed,
    setThetaDeg,
    setIsPlaying,
    reset,
  } = useTrigController();
  const [selectedFeature, setSelectedFeature] = useState<TrigFeature>("sin");
  const [selectedAngle, setSelectedAngle] = useState<number | null>(0);

  const boardWidth = 980;
  const boardHeight = 520;
  const circleCenterX = 185;
  const circleCenterY = 340;
  const circleRadius = 112;
  const waveStartX = 300;
  const waveEndX = 900;
  const waveAmplitude = 106;
  const pointX = circleCenterX + cosValue * circleRadius;
  const pointY = circleCenterY - sinValue * circleRadius;
  const waveX = isPlaying
    ? waveEndX
    : waveStartX + (thetaDeg / 360) * (waveEndX - waveStartX);
  const sineWaveY = circleCenterY - sinValue * waveAmplitude;
  const cosineWaveY = circleCenterY - cosValue * waveAmplitude;
  const fullSinePath = isPlaying
    ? createScrollingWavePath(
        Math.sin,
        phaseDeg,
        waveStartX,
        waveEndX,
        circleCenterY,
        waveAmplitude,
      )
    : createChalkWavePath(
        Math.sin,
        360,
        waveStartX,
        waveEndX,
        circleCenterY,
        waveAmplitude,
      );
  const fullCosinePath = isPlaying
    ? createScrollingWavePath(
        Math.cos,
        phaseDeg,
        waveStartX,
        waveEndX,
        circleCenterY,
        waveAmplitude,
      )
    : createChalkWavePath(
        Math.cos,
        360,
        waveStartX,
        waveEndX,
        circleCenterY,
        waveAmplitude,
      );
  const activeSinePath = isPlaying
    ? fullSinePath
    : createChalkWavePath(
        Math.sin,
        thetaDeg,
        waveStartX,
        waveEndX,
        circleCenterY,
        waveAmplitude,
      );
  const activeCosinePath = isPlaying
    ? fullCosinePath
    : createChalkWavePath(
        Math.cos,
        thetaDeg,
        waveStartX,
        waveEndX,
        circleCenterY,
        waveAmplitude,
      );
  const selectedAngleX =
    selectedAngle === null
      ? null
      : waveStartX + (selectedAngle / 360) * (waveEndX - waveStartX);
  const selectedAngleSinY =
    selectedAngle === null
      ? null
      : circleCenterY -
        Math.sin((selectedAngle * Math.PI) / 180) * waveAmplitude;
  const sineProjectionPath = `M ${pointX.toFixed(2)} ${pointY.toFixed(2)} C ${((pointX + waveX) / 2).toFixed(2)} ${pointY.toFixed(2)}, ${((pointX + waveX) / 2).toFixed(2)} ${sineWaveY.toFixed(2)}, ${waveX.toFixed(2)} ${sineWaveY.toFixed(2)}`;
  const cosineProjectionPath = `M ${pointX.toFixed(2)} ${circleCenterY.toFixed(2)} C ${((pointX + waveX) / 2).toFixed(2)} ${circleCenterY.toFixed(2)}, ${((pointX + waveX) / 2).toFixed(2)} ${cosineWaveY.toFixed(2)}, ${waveX.toFixed(2)} ${cosineWaveY.toFixed(2)}`;
  const featureNote = createFeatureNote(
    selectedFeature,
    selectedAngle,
    thetaDeg,
  );

  function selectAngle(angle: number) {
    setIsPlaying(false);
    setThetaDeg(angle);
    setSelectedAngle(angle);
  }

  function selectFeature(feature: TrigFeature) {
    setSelectedFeature(feature);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-950 shadow-sm">
      <style>{`
        .chalk-line {
          filter: drop-shadow(0 0 2px rgba(15,23,42,0.2)) drop-shadow(0 0 7px rgba(14,165,233,0.16));
        }
 
        .chalk-trace {
          stroke-dasharray: 7 12;
          animation: chalk-trace-flow 1.45s linear infinite;
        }
 
        .chalk-point {
          animation: chalk-point-pulse 1.8s ease-in-out infinite;
        }
 
        .chalk-selected {
          filter: drop-shadow(0 0 4px rgba(14,165,233,0.45)) drop-shadow(0 0 14px rgba(14,165,233,0.2));
        }
 
        @keyframes chalk-trace-flow {
          to { stroke-dashoffset: -38; }
        }
 
        @keyframes chalk-point-pulse {
          0%, 100% { opacity: 0.78; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Тригонометрийн дүрслэл
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Тойргийн хөдөлгөөнөөс синус долгион үүсэх нь
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Нэгж тойрог дээрх цэгийн босоо координат нь sin θ, хэвтээ координат
            нь cos θ байдаг. Тэр хөдөлгөөн график дээр долгион болж үргэлжилнэ.
          </p>
        </div>
      </div>

      <div className="bg-[#f7f8fb] p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          className="h-auto w-full"
          role="img"
          aria-label="Хар самбар дээр нэгж тойргийн цэгээс синус долгион үүсэж буй анимац"
        >
          <defs>
            <filter id="chalkGlowWhite">
              <feGaussianBlur stdDeviation="1.6" result="softGlow" />
              <feMerge>
                <feMergeNode in="softGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            width={boardWidth}
            height={boardHeight}
            rx="24"
            fill="#ffffff"
          />

          <line
            x1="28"
            y1={circleCenterY}
            x2={waveEndX + 38}
            y2={circleCenterY}
            stroke="rgba(15,23,42,0.38)"
            strokeWidth="2"
            filter="url(#chalkGlowWhite)"
          />
          <line
            x1={circleCenterX}
            y1="18"
            x2={circleCenterX}
            y2={boardHeight - 34}
            stroke="rgba(15,23,42,0.28)"
            strokeWidth="1.8"
            filter="url(#chalkGlowWhite)"
          />

          <text
            x={waveEndX + 48}
            y={circleCenterY + 11}
            className="fill-slate-950 text-[34px]"
          >
            t
          </text>
          <text
            x={circleCenterX - 49}
            y="117"
            className="fill-slate-700 text-[24px]"
          >
            π
          </text>
          <text
            x={circleCenterX - 58}
            y="267"
            className="fill-slate-700 text-[24px]"
          >
            2π
          </text>
          <line
            x1={circleCenterX - 5}
            y1="106"
            x2={circleCenterX + 12}
            y2="106"
            stroke="#334155"
            strokeWidth="1.4"
          />
          <line
            x1={circleCenterX - 5}
            y1="260"
            x2={circleCenterX + 12}
            y2="260"
            stroke="#334155"
            strokeWidth="1.4"
          />

          <circle
            cx={circleCenterX}
            cy={circleCenterY}
            r={circleRadius}
            fill="none"
            stroke="rgba(15,23,42,0.42)"
            strokeWidth="2"
            filter="url(#chalkGlowWhite)"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const innerX = circleCenterX + Math.cos(rad) * (circleRadius - 7);
            const innerY = circleCenterY - Math.sin(rad) * (circleRadius - 7);
            const outerX = circleCenterX + Math.cos(rad) * (circleRadius + 9);
            const outerY = circleCenterY - Math.sin(rad) * (circleRadius + 9);

            return (
              <line
                key={angle}
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke="rgba(15,23,42,0.38)"
                strokeWidth="1.8"
              />
            );
          })}

          <text
            x={circleCenterX - 7}
            y={circleCenterY + 10}
            className="fill-slate-600 text-[16px]"
          >
            0
          </text>

          <path
            d={fullSinePath}
            fill="none"
            stroke={
              selectedFeature === "sin"
                ? "rgba(8,145,178,0.34)"
                : "rgba(15,23,42,0.12)"
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={selectedFeature === "sin" ? "3" : "2.4"}
          />
          <path
            d={fullCosinePath}
            fill="none"
            stroke={
              selectedFeature === "cos"
                ? "rgba(15,23,42,0.34)"
                : "rgba(15,23,42,0.12)"
            }
            strokeDasharray="9 10"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={selectedFeature === "cos" ? "3" : "2.2"}
          />
          <path
            d={activeSinePath}
            fill="none"
            stroke="#0891b2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={selectedFeature === "sin" ? "4.2" : "3.2"}
            className={`chalk-line ${selectedFeature === "sin" ? "chalk-selected" : ""}`}
          />
          <path
            d={activeCosinePath}
            fill="none"
            stroke="#0f172a"
            strokeDasharray="9 10"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={selectedFeature === "cos" ? "3.8" : "2.8"}
            className={`chalk-line ${selectedFeature === "cos" ? "chalk-selected" : ""}`}
          />
          <path
            d={sineProjectionPath}
            fill="none"
            stroke="#0891b2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={selectedFeature === "sin" ? "3" : "2"}
            className={`chalk-line chalk-trace ${selectedFeature === "sin" ? "chalk-selected" : ""}`}
          />
          <path
            d={cosineProjectionPath}
            fill="none"
            stroke={
              selectedFeature === "cos"
                ? "rgba(15,23,42,0.86)"
                : "rgba(15,23,42,0.36)"
            }
            strokeDasharray="5 11"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={selectedFeature === "cos" ? "2.8" : "1.8"}
          />

          <line
            x1={circleCenterX}
            y1={pointY}
            x2={pointX}
            y2={pointY}
            stroke={
              selectedFeature === "cos" ? "#0f172a" : "rgba(15,23,42,0.5)"
            }
            strokeWidth={selectedFeature === "cos" ? "3.6" : "2.6"}
            filter="url(#chalkGlowWhite)"
          />
          <line
            x1={pointX}
            y1={circleCenterY}
            x2={pointX}
            y2={pointY}
            stroke={
              selectedFeature === "sin" ? "#0891b2" : "rgba(15,23,42,0.5)"
            }
            strokeWidth={selectedFeature === "sin" ? "3.6" : "2.6"}
            filter="url(#chalkGlowWhite)"
          />
          <line
            x1={circleCenterX}
            y1={circleCenterY}
            x2={pointX}
            y2={pointY}
            stroke="#0f172a"
            strokeWidth="2.6"
            className="chalk-line"
          />

          <circle
            cx={pointX}
            cy={pointY}
            r="7.5"
            fill="#ffffff"
            stroke="#0891b2"
            strokeWidth="2.4"
            className="chalk-point"
            filter="url(#chalkGlowWhite)"
          />
          <circle
            cx={waveX}
            cy={sineWaveY}
            r="6.5"
            fill="#0891b2"
            className="chalk-point"
            filter="url(#chalkGlowWhite)"
          />
          <circle
            cx={waveX}
            cy={cosineWaveY}
            r="5.2"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.4"
            filter="url(#chalkGlowWhite)"
          />

          {selectedAngleX !== null && selectedAngleSinY !== null && (
            <g>
              <line
                x1={selectedAngleX}
                y1={circleCenterY - waveAmplitude - 18}
                x2={selectedAngleX}
                y2={circleCenterY + waveAmplitude + 18}
                stroke="rgba(8,145,178,0.42)"
                strokeDasharray="6 8"
                strokeWidth="1.8"
              />
              <circle
                cx={selectedAngleX}
                cy={selectedAngleSinY}
                r="5"
                fill="#0891b2"
                opacity="0.9"
                filter="url(#chalkGlowWhite)"
              />
            </g>
          )}

          <text
            x={waveStartX - 8}
            y={circleCenterY + 31}
            className="fill-slate-700 text-[24px]"
          >
            0
          </text>
          <text
            x={(waveStartX + waveEndX) / 2 - 12}
            y={circleCenterY + 31}
            className="fill-slate-700 text-[24px]"
          >
            π
          </text>
          <text
            x={waveEndX - 18}
            y={circleCenterY + 31}
            className="fill-slate-700 text-[24px]"
          >
            2π
          </text>
          <line
            x1={(waveStartX + waveEndX) / 2}
            y1={circleCenterY - 7}
            x2={(waveStartX + waveEndX) / 2}
            y2={circleCenterY + 8}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line
            x1={waveEndX}
            y1={circleCenterY - 7}
            x2={waveEndX}
            y2={circleCenterY + 8}
            stroke="#334155"
            strokeWidth="1.5"
          />
          <g>
            <circle cx={waveStartX + 16} cy="58" r="4" fill="#0891b2" />
            <text
              x={waveStartX + 28}
              y="64"
              className="fill-slate-700 text-[16px]"
            >
              sin θ
            </text>
            <line
              x1={waveStartX + 86}
              y1="58"
              x2={waveStartX + 125}
              y2="58"
              stroke="#0f172a"
              strokeDasharray="8 8"
              strokeWidth="2"
            />
            <text
              x={waveStartX + 135}
              y="64"
              className="fill-slate-600 text-[16px]"
            >
              cos θ
            </text>
          </g>
        </svg>

        <div className="grid gap-4 border-t border-slate-200 px-2 py-4 lg:grid-cols-[1fr_440px]">
          <div className="grid gap-3 sm:grid-cols-4">
            <DarkValueCard
              label="θ градус"
              value={`${Math.round(thetaDeg)}°`}
            />
            <DarkValueCard label="θ радиан" value={thetaRad.toFixed(3)} />
            <DarkValueCard label="sin θ" value={sinValue.toFixed(3)} />
            <DarkValueCard label="cos θ" value={cosValue.toFixed(3)} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((current) => !current)}
              className="h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {isPlaying ? "Түр зогсоох" : "Эхлүүлэх"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Дахин эхлүүлэх
            </button>
            <label className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700">
              Хурд
              <select
                value={speed}
                onChange={(event) =>
                  setSpeed(Number(event.target.value) as Speed)
                }
                className="bg-transparent text-slate-950 outline-none"
              >
                <option className="bg-white" value={0.65}>
                  Удаан
                </option>
                <option className="bg-white" value={1}>
                  Энгийн
                </option>
                <option className="bg-white" value={1.45}>
                  Хурдан
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm">
          {featureNote}
        </div>

        <TrigValuesTable
          activeAngle={thetaDeg}
          selectedAngle={selectedAngle}
          selectedFeature={selectedFeature}
          onAngleSelect={selectAngle}
          onFeatureSelect={selectFeature}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="range"
            min="0"
            max="360"
            value={Math.round(thetaDeg)}
            onChange={(event) => {
              const nextAngle = Number(event.target.value);
              setIsPlaying(false);
              setThetaDeg(nextAngle);
              setSelectedAngle(findKeyAngle(nextAngle));
            }}
            className="h-2 w-full accent-slate-950"
          />
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            {keyAngles.map((angle) => (
              <button
                key={angle}
                type="button"
                onClick={() => {
                  selectAngle(angle);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-950"
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrigVisualizer3D() {
  const trig = useTrigController();
  const {
    thetaDeg,
    thetaRad,
    sinValue,
    cosValue,
    isPlaying,
    speed,
    setSpeed,
    setThetaDeg,
    setIsPlaying,
    reset,
  } = trig;

  const pointX = labCenterX + cosValue * labRadius;
  const pointY = labCenterY - sinValue * labRadius * labYScale;
  const projectionBaseY = labCenterY;
  const arcPath = createProjectedArcPath(thetaDeg, 38);
  const waveX =
    graphPadding + (thetaDeg / 360) * (graphWidth - graphPadding * 2);
  const sineY = graphHeight / 2 - sinValue * 72;
  const cosineY = graphHeight / 2 - cosValue * 72;
  const traceWidth = Math.max(0, waveX - graphPadding);
  const orbitTrail = createOrbitTrail(thetaDeg, 7);
  const sineHeadPath = createGeneratedGraphSegment(Math.sin, thetaDeg, 34);
  const cosineHeadPath = createGeneratedGraphSegment(Math.cos, thetaDeg, 34);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-[#050713] text-white shadow-2xl shadow-slate-950/30">
      <style>{`
        .lab-grid-floor {
          background:
            linear-gradient(rgba(34, 211, 238, 0.13) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.13) 1px, transparent 1px);
          background-size: 34px 34px;
          transform: perspective(720px) rotateX(62deg);
          transform-origin: center top;
        }
 
        .lab-orbit {
          stroke-dasharray: ${2 * Math.PI * labRadius};
          stroke-dashoffset: ${2 * Math.PI * labRadius};
          animation: lab-ring-draw 1.2s ease-out forwards;
        }
 
        .lab-glow-pulse {
          animation: lab-glow-pulse 2.2s ease-in-out infinite;
        }
 
        .trace-flow {
          animation: trace-flow 1.25s linear infinite;
        }
 
        .graph-plane-3d {
          transform: perspective(780px) rotateX(50deg) rotateZ(-1.5deg);
          transform-origin: center bottom;
        }
 
        @keyframes lab-ring-draw {
          to { stroke-dashoffset: 0; }
        }
 
        @keyframes lab-glow-pulse {
          0%, 100% { opacity: 0.82; filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.46)); }
          50% { opacity: 1; filter: drop-shadow(0 0 16px rgba(217, 70, 239, 0.42)); }
        }
 
        @keyframes trace-flow {
          to { stroke-dashoffset: -28; }
        }
      `}</style>

      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.2),transparent_38%),radial-gradient(circle_at_88%_20%,rgba(168,85,247,0.16),transparent_32%),linear-gradient(135deg,#050713,#0b1020_58%,#070816)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-35 lab-grid-floor" />

        <div className="relative grid gap-4 p-4 lg:grid-cols-[260px_minmax(330px,1fr)_minmax(330px,1fr)] lg:p-5">
          <InfoPanel />

          <div className="rounded-3xl border border-cyan-100/15 bg-white/[0.045] p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Нэгж тойрог
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Эргэлтээс координат үүсэх нь
                </h3>
              </div>
              <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                θ = {Math.round(thetaDeg)}°
              </span>
            </div>

            <svg
              viewBox={`0 0 ${labWidth} ${labHeight}`}
              className="h-auto w-full"
              role="img"
              aria-label="3D маягийн нэгж тойрог дээр синус, косинусын проекц харуулж байна"
            >
              <defs>
                <radialGradient id="pointGlow3d" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
                <filter id="neon3d">
                  <feGaussianBlur stdDeviation="2.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="softBeam3d">
                  <feGaussianBlur stdDeviation="4" result="beamBlur" />
                  <feMerge>
                    <feMergeNode in="beamBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect
                width={labWidth}
                height={labHeight}
                rx="22"
                fill="rgba(2,6,23,0.54)"
              />
              <g
                transform={`translate(${labCenterX} ${labCenterY}) scale(1 ${labYScale})`}
              >
                <circle
                  className="lab-orbit"
                  cx="0"
                  cy="0"
                  r={labRadius}
                  fill="none"
                  stroke="#f8fafc"
                  strokeLinecap="round"
                  strokeWidth="2.2"
                  filter="url(#neon3d)"
                />
                <circle
                  cx="0"
                  cy="0"
                  r={labRadius + 18}
                  fill="none"
                  stroke="rgba(34,211,238,0.12)"
                  strokeWidth="1"
                />
              </g>

              <line
                x1={labCenterX - labRadius - 42}
                y1={labCenterY}
                x2={labCenterX + labRadius + 48}
                y2={labCenterY}
                stroke="#22d3ee"
                strokeWidth="1.6"
                filter="url(#neon3d)"
              />
              <line
                x1={labCenterX}
                y1={labCenterY + labRadius * labYScale + 38}
                x2={labCenterX}
                y2={labCenterY - labRadius * labYScale - 54}
                stroke="#d946ef"
                strokeWidth="1.6"
                filter="url(#neon3d)"
              />

              {[
                { angle: 0, label: "0°", dx: 26, dy: 2 },
                { angle: 90, label: "90°", dx: 0, dy: -22 },
                { angle: 180, label: "180°", dx: -30, dy: 2 },
                { angle: 270, label: "270°", dx: 0, dy: 24 },
                { angle: 360, label: "360°", dx: 34, dy: 20 },
              ].map((marker) => {
                const markerRad = (marker.angle * Math.PI) / 180;
                const x = labCenterX + Math.cos(markerRad) * labRadius;
                const y =
                  labCenterY - Math.sin(markerRad) * labRadius * labYScale;

                return (
                  <g key={marker.label}>
                    <circle cx={x} cy={y} r="3" fill="#e0f2fe" />
                    <text
                      x={x + marker.dx}
                      y={y + marker.dy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-cyan-100 text-[12px]"
                    >
                      {marker.label}
                    </text>
                  </g>
                );
              })}

              <path
                d={arcPath}
                fill="none"
                stroke="#f0abfc"
                strokeLinecap="round"
                strokeWidth="2.4"
                filter="url(#neon3d)"
              />
              <text
                x={labCenterX + 46}
                y={labCenterY - 17}
                className="fill-fuchsia-200 text-[14px] font-semibold"
              >
                θ
              </text>

              {orbitTrail.map((trail) => (
                <circle
                  key={trail.index}
                  cx={trail.x}
                  cy={trail.y}
                  r={trail.r}
                  fill={trail.color}
                  opacity={trail.opacity}
                  filter="url(#neon3d)"
                />
              ))}

              <line
                className="lab-glow-pulse"
                x1={labCenterX}
                y1={labCenterY}
                x2={pointX}
                y2={pointY}
                stroke="#ffffff"
                strokeLinecap="round"
                strokeWidth="2.6"
                filter="url(#neon3d)"
              />
              <line
                x1={labCenterX}
                y1={pointY}
                x2={pointX}
                y2={pointY}
                stroke="#22d3ee"
                strokeDasharray="6 7"
                strokeWidth="1.8"
                filter="url(#neon3d)"
              />
              <line
                x1={pointX}
                y1={projectionBaseY}
                x2={pointX}
                y2={pointY}
                stroke="#d946ef"
                strokeDasharray="6 7"
                strokeWidth="1.8"
                filter="url(#neon3d)"
              />

              <path
                className="trace-flow"
                d={`M ${pointX.toFixed(2)} ${pointY.toFixed(2)} C ${(pointX + labWidth - 42) / 2} ${(pointY - 24).toFixed(2)}, ${labWidth - 82} ${labCenterY - 64}, ${labWidth - 26} ${labCenterY - 42}`}
                fill="none"
                stroke="rgba(34,211,238,0.55)"
                strokeDasharray="3 9"
                strokeLinecap="round"
                strokeWidth="2"
                filter="url(#softBeam3d)"
              />

              <g>
                <rect
                  x={Math.min((labCenterX + pointX) / 2 - 44, labWidth - 104)}
                  y={pointY - 27}
                  width="88"
                  height="20"
                  rx="10"
                  fill="rgba(2,6,23,0.72)"
                  stroke="rgba(34,211,238,0.26)"
                />
                <text
                  x={Math.min((labCenterX + pointX) / 2, labWidth - 60)}
                  y={pointY - 13}
                  textAnchor="middle"
                  className="fill-cyan-100 text-[10px] font-medium"
                >
                  cos θ хэвтээ
                </text>
              </g>
              <g>
                <rect
                  x={Math.min(pointX + 9, labWidth - 105)}
                  y={(projectionBaseY + pointY) / 2 - 13}
                  width="94"
                  height="20"
                  rx="10"
                  fill="rgba(2,6,23,0.72)"
                  stroke="rgba(217,70,239,0.24)"
                />
                <text
                  x={Math.min(pointX + 56, labWidth - 58)}
                  y={(projectionBaseY + pointY) / 2 + 1}
                  textAnchor="middle"
                  className="fill-fuchsia-100 text-[10px] font-medium"
                >
                  sin θ босоо
                </text>
              </g>

              <circle cx={labCenterX} cy={labCenterY} r="4.5" fill="#ffffff" />
              <circle
                cx={pointX}
                cy={pointY}
                r="18"
                fill="url(#pointGlow3d)"
                opacity="0.5"
              />
              <circle
                cx={pointX}
                cy={pointY}
                r="7"
                fill="#020617"
                stroke="#67e8f9"
                strokeWidth="2.6"
                filter="url(#neon3d)"
              />
            </svg>
          </div>

          <div className="rounded-3xl border border-fuchsia-100/15 bg-white/[0.045] p-4 shadow-2xl shadow-fuchsia-950/20 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
                  Долгион график
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Тойргийн хөдөлгөөнөөс график үүснэ
                </h3>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-2">
              <svg
                viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                className="graph-plane-3d h-auto w-full overflow-visible"
                role="img"
                aria-label="3D маягийн синус ба косинус долгионы график"
              >
                <defs>
                  <pattern
                    id="graphGrid3d"
                    width="39"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 39 0 L 0 0 0 32"
                      fill="none"
                      stroke="rgba(148,163,184,0.18)"
                      strokeWidth="1"
                    />
                  </pattern>
                  <filter id="waveNeon3d">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="waveHeadGlow3d">
                    <feGaussianBlur stdDeviation="3.2" result="headBlur" />
                    <feMerge>
                      <feMergeNode in="headBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <clipPath id="waveTraceClip3d">
                    <rect
                      x={graphPadding}
                      y="0"
                      width={traceWidth}
                      height={graphHeight}
                    />
                  </clipPath>
                </defs>

                <rect
                  width={graphWidth}
                  height={graphHeight}
                  rx="22"
                  fill="rgba(2,6,23,0.9)"
                />
                <rect
                  width={graphWidth}
                  height={graphHeight}
                  rx="22"
                  fill="url(#graphGrid3d)"
                />
                <line
                  x1={graphPadding}
                  y1={graphHeight / 2}
                  x2={graphWidth - graphPadding}
                  y2={graphHeight / 2}
                  stroke="rgba(226,232,240,0.52)"
                />

                {[0, 90, 180, 270, 360].map((angle) => {
                  const x =
                    graphPadding +
                    (angle / 360) * (graphWidth - graphPadding * 2);
                  return (
                    <g key={angle}>
                      <line
                        x1={x}
                        y1={28}
                        x2={x}
                        y2={graphHeight - 38}
                        stroke="rgba(226,232,240,0.16)"
                      />
                      <text
                        x={x}
                        y={graphHeight - 20}
                        textAnchor="middle"
                        className="fill-slate-200 text-[10px]"
                      >
                        {angle}°
                      </text>
                      <text
                        x={x}
                        y={graphHeight - 7}
                        textAnchor="middle"
                        className="fill-slate-400 text-[9px]"
                      >
                        {radianLabel(angle)}
                      </text>
                    </g>
                  );
                })}

                <path
                  d={createGraphPath(Math.sin)}
                  fill="none"
                  stroke="rgba(217,70,239,0.18)"
                  strokeWidth="2.4"
                />
                <path
                  d={createGraphPath(Math.cos)}
                  fill="none"
                  stroke="rgba(34,211,238,0.18)"
                  strokeWidth="2.4"
                />
                <g clipPath="url(#waveTraceClip3d)">
                  <path
                    d={createGraphPath(Math.sin)}
                    fill="none"
                    stroke="rgba(217,70,239,0.18)"
                    strokeLinecap="round"
                    strokeWidth="7"
                    filter="url(#waveNeon3d)"
                  />
                  <path
                    d={createGraphPath(Math.cos)}
                    fill="none"
                    stroke="rgba(34,211,238,0.16)"
                    strokeLinecap="round"
                    strokeWidth="7"
                    filter="url(#waveNeon3d)"
                  />
                  <path
                    d={createGraphPath(Math.sin)}
                    fill="none"
                    stroke="#d946ef"
                    strokeLinecap="round"
                    strokeWidth="3"
                    filter="url(#waveNeon3d)"
                  />
                  <path
                    d={createGraphPath(Math.cos)}
                    fill="none"
                    stroke="#22d3ee"
                    strokeLinecap="round"
                    strokeWidth="3"
                    filter="url(#waveNeon3d)"
                  />
                </g>

                <path
                  d={sineHeadPath}
                  fill="none"
                  stroke="#f0abfc"
                  strokeLinecap="round"
                  strokeWidth="5.2"
                  opacity="0.9"
                  filter="url(#waveHeadGlow3d)"
                />
                <path
                  d={cosineHeadPath}
                  fill="none"
                  stroke="#67e8f9"
                  strokeLinecap="round"
                  strokeWidth="5.2"
                  opacity="0.86"
                  filter="url(#waveHeadGlow3d)"
                />

                <line
                  x1={waveX}
                  y1="26"
                  x2={waveX}
                  y2={graphHeight - 38}
                  stroke="#f8fafc"
                  strokeDasharray="5 7"
                  strokeWidth="1.4"
                />
                <line
                  className="trace-flow"
                  x1={graphPadding - 18}
                  y1={graphHeight / 2}
                  x2={waveX}
                  y2={sineY}
                  stroke="rgba(217,70,239,0.32)"
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
                <line
                  className="trace-flow"
                  x1={graphPadding - 18}
                  y1={graphHeight / 2}
                  x2={waveX}
                  y2={cosineY}
                  stroke="rgba(34,211,238,0.32)"
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
                <circle
                  cx={waveX}
                  cy={sineY}
                  r="11"
                  fill="#d946ef"
                  opacity="0.18"
                  filter="url(#waveHeadGlow3d)"
                />
                <circle
                  cx={waveX}
                  cy={sineY}
                  r="5.6"
                  fill="#d946ef"
                  filter="url(#waveNeon3d)"
                />
                <circle
                  cx={waveX}
                  cy={cosineY}
                  r="11"
                  fill="#22d3ee"
                  opacity="0.18"
                  filter="url(#waveHeadGlow3d)"
                />
                <circle
                  cx={waveX}
                  cy={cosineY}
                  r="5.6"
                  fill="#22d3ee"
                  filter="url(#waveNeon3d)"
                />
                <g>
                  <rect
                    x={graphPadding - 4}
                    y="9"
                    width="104"
                    height="20"
                    rx="10"
                    fill="rgba(2,6,23,0.72)"
                  />
                  <circle cx={graphPadding + 10} cy="19" r="3" fill="#d946ef" />
                  <text
                    x={graphPadding + 18}
                    y="23"
                    className="fill-fuchsia-100 text-[10px]"
                  >
                    sin θ
                  </text>
                  <circle cx={graphPadding + 62} cy="19" r="3" fill="#22d3ee" />
                  <text
                    x={graphPadding + 70}
                    y="23"
                    className="fill-cyan-100 text-[10px]"
                  >
                    cos θ
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-slate-950/55 p-4 lg:p-5">
          <p className="mb-4 max-w-4xl text-sm leading-6 text-slate-300">
            Нэгж тойрог дээрх цэгийн босоо координат нь sin θ, хэвтээ координат
            нь cos θ байдаг. Тиймээс тойргийн хөдөлгөөнөөс долгион график
            үүсдэг.
          </p>

          <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <div className="grid gap-3 sm:grid-cols-4">
              <DarkValueCard
                label="θ градус"
                value={`${Math.round(thetaDeg)}°`}
              />
              <DarkValueCard label="θ радиан" value={thetaRad.toFixed(3)} />
              <DarkValueCard
                label="sin θ"
                value={sinValue.toFixed(3)}
                tone="sin"
              />
              <DarkValueCard
                label="cos θ"
                value={cosValue.toFixed(3)}
                tone="cos"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying((current) => !current)}
                className="h-11 rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200"
              >
                {isPlaying ? "Түр зогсоох" : "Эхлүүлэх"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="h-11 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
              >
                Дахин эхлүүлэх
              </button>
              <label className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-slate-200">
                Хурд
                <select
                  value={speed}
                  onChange={(event) =>
                    setSpeed(Number(event.target.value) as Speed)
                  }
                  className="bg-transparent text-cyan-100 outline-none"
                >
                  <option className="bg-slate-950" value={0.65}>
                    Удаан
                  </option>
                  <option className="bg-slate-950" value={1}>
                    Энгийн
                  </option>
                  <option className="bg-slate-950" value={1.45}>
                    Хурдан
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <input
              type="range"
              min="0"
              max="360"
              value={Math.round(thetaDeg)}
              onChange={(event) => {
                setIsPlaying(false);
                setThetaDeg(Number(event.target.value));
              }}
              className="h-2 w-full accent-cyan-300"
            />
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-300">
              {keyAngles.map((angle) => (
                <button
                  key={angle}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setThetaDeg(angle);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-cyan-200/50 hover:text-cyan-100"
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SineCosineVisualizer2D() {
  const trig = useTrigController();
  const {
    thetaDeg,
    thetaRad,
    sinValue,
    cosValue,
    isPlaying,
    setThetaDeg,
    setIsPlaying,
    reset,
  } = trig;

  const pointX = center + cosValue * radius;
  const pointY = center - sinValue * radius;
  const waveX = wavePadding + (thetaDeg / 360) * (waveWidth - wavePadding * 2);
  const sineY = waveHeight / 2 - sinValue * 66;
  const cosineY = waveHeight / 2 - cosValue * 66;
  const traceWidth = Math.max(0, waveX - wavePadding);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-950 shadow-sm">
      <style>{`
        .drawn-circle {
          stroke-dasharray: ${circumference};
          stroke-dashoffset: ${circumference};
          animation: draw-circle 1.45s ease-out forwards;
        }
 
        .soft-pulse {
          animation: soft-pulse 2.4s ease-in-out infinite;
        }
 
        .teacher-marker {
          animation: teacher-marker 3.8s ease-in-out infinite;
        }
 
        @keyframes draw-circle {
          to { stroke-dashoffset: 0; }
        }
 
        @keyframes soft-pulse {
          0%, 100% { opacity: 0.78; filter: drop-shadow(0 0 2px rgba(14,165,233,0.18)); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(14,165,233,0.28)); }
        }
 
        @keyframes teacher-marker {
          0%, 100% { transform: translateY(0); opacity: 0.9; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
              Тригонометрийн дүрслэл
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Нэгж тойргоос синус, косинус долгион
            </h2>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="teacher-marker grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cyan-200 bg-white text-cyan-700 shadow-sm">
              <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
                <circle
                  cx="24"
                  cy="16"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 40c2.4-8 7-12 12-12s9.6 4 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <path
                  d="M33 14l7-6"
                  stroke="#0f172a"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-slate-950">
                θ / r = радиан
              </p>
              <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">
                sin θ нь тойрог дээрх цэгийн босоо координат, cos θ нь хэвтээ
                координат юм.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 bg-[#f7f8fb] p-5 lg:grid-cols-[320px_1fr] lg:p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <svg
            viewBox={`0 0 ${circleSize} ${circleSize}`}
            className="h-auto w-full"
            role="img"
            aria-label="Эргэж буй радиус, синус ба косинусын проекцийг харуулсан нэгж тойрог"
          >
            <defs>
              <pattern
                id="circleGrid"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 28 0 L 0 0 0 28"
                  fill="none"
                  stroke="rgba(15,23,42,0.055)"
                  strokeWidth="1"
                />
              </pattern>
              <filter id="lineGlow">
                <feGaussianBlur stdDeviation="1.25" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect
              width={circleSize}
              height={circleSize}
              rx="18"
              fill="#f8fafc"
            />
            <rect
              width={circleSize}
              height={circleSize}
              rx="18"
              fill="url(#circleGrid)"
            />
            <line
              x1={center}
              y1={22}
              x2={center}
              y2={circleSize - 22}
              stroke="rgba(15,23,42,0.18)"
              strokeWidth="1"
            />
            <line
              x1={22}
              y1={center}
              x2={circleSize - 22}
              y2={center}
              stroke="rgba(15,23,42,0.18)"
              strokeWidth="1"
            />

            <circle
              className="drawn-circle"
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#0f172a"
              strokeLinecap="round"
              strokeWidth="1.7"
            />

            {keyAngles.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x = center + Math.cos(rad) * (radius + 18);
              const y = center - Math.sin(rad) * (radius + 18);

              return (
                <g key={angle}>
                  <circle
                    cx={center + Math.cos(rad) * radius}
                    cy={center - Math.sin(rad) * radius}
                    r="2"
                    fill="rgba(15,23,42,0.38)"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-500 text-[9px]"
                  >
                    {angle}°
                  </text>
                </g>
              );
            })}

            <line
              className="soft-pulse"
              x1={center}
              y1={center}
              x2={pointX}
              y2={pointY}
              stroke="#0f172a"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <g>
              <line
                x1={center}
                y1={pointY}
                x2={pointX}
                y2={pointY}
                stroke="#0891b2"
                strokeWidth="1.5"
                strokeDasharray="5 6"
                filter="url(#lineGlow)"
              />
              <line
                x1={pointX}
                y1={center}
                x2={pointX}
                y2={pointY}
                stroke="#64748b"
                strokeWidth="1.3"
                strokeDasharray="5 6"
              />
              <text
                x={(center + pointX) / 2}
                y={pointY - 8}
                textAnchor="middle"
                className="fill-cyan-700 text-[10px]"
              >
                cos θ буюу хэвтээ
              </text>
              <text
                x={pointX + 10}
                y={(center + pointY) / 2}
                className="fill-slate-600 text-[10px]"
              >
                sin θ буюу босоо
              </text>
            </g>
            <circle cx={center} cy={center} r="3.6" fill="#0f172a" />
            <circle
              cx={pointX}
              cy={pointY}
              r="6"
              fill="#ffffff"
              stroke="#0891b2"
              strokeWidth="2.2"
              filter="url(#lineGlow)"
            />
          </svg>

          <div className="mt-3 grid gap-2 text-xs text-slate-600">
            <p>1. Радиус эргэнэ.</p>
            <p>2. Проекцийн шугамууд гарна.</p>
            <p>3. sin/cos долгион зураасаар трасслана.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <svg
              viewBox={`0 0 ${waveWidth} ${waveHeight}`}
              className="h-auto w-full"
              role="img"
              aria-label="Синус, косинусын долгионы трасслал ба хамт хөдөлж буй тэмдэглэгээ"
            >
              <defs>
                <pattern
                  id="waveGrid"
                  width="44"
                  height="34"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 44 0 L 0 0 0 34"
                    fill="none"
                    stroke="rgba(15,23,42,0.055)"
                    strokeWidth="1"
                  />
                </pattern>
                <filter id="waveLineGlow">
                  <feGaussianBlur stdDeviation="1.15" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <clipPath id="waveTraceClip">
                  <rect
                    x={wavePadding}
                    y="0"
                    width={traceWidth}
                    height={waveHeight}
                  />
                </clipPath>
              </defs>

              <rect
                width={waveWidth}
                height={waveHeight}
                rx="18"
                fill="#f8fafc"
              />
              <rect
                width={waveWidth}
                height={waveHeight}
                rx="18"
                fill="url(#waveGrid)"
              />
              <line
                x1={wavePadding}
                y1={waveHeight / 2}
                x2={waveWidth - wavePadding}
                y2={waveHeight / 2}
                stroke="rgba(15,23,42,0.2)"
                strokeWidth="1"
              />
              {[0, 90, 180, 270, 360].map((angle) => {
                const x =
                  wavePadding + (angle / 360) * (waveWidth - wavePadding * 2);
                return (
                  <g key={angle}>
                    <line
                      x1={x}
                      y1={28}
                      x2={x}
                      y2={waveHeight - 30}
                      stroke="rgba(15,23,42,0.08)"
                    />
                    <text
                      x={x}
                      y={waveHeight - 9}
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px]"
                    >
                      {angle}°
                    </text>
                  </g>
                );
              })}

              <path
                d={createWavePath(Math.sin)}
                fill="none"
                stroke="rgba(8,145,178,0.16)"
                strokeWidth="2"
              />
              <path
                d={createWavePath(Math.cos)}
                fill="none"
                stroke="rgba(15,23,42,0.14)"
                strokeWidth="2"
              />
              <g clipPath="url(#waveTraceClip)">
                <path
                  d={createWavePath(Math.sin)}
                  fill="none"
                  stroke="#0891b2"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  filter="url(#waveLineGlow)"
                />
                <path
                  d={createWavePath(Math.cos)}
                  fill="none"
                  stroke="#0f172a"
                  strokeLinecap="round"
                  strokeWidth="2.2"
                />
              </g>
              <line
                x1={waveX}
                y1={26}
                x2={waveX}
                y2={waveHeight - 30}
                stroke="rgba(15,23,42,0.42)"
                strokeDasharray="4 6"
              />
              <circle cx={waveX} cy={sineY} r="4.8" fill="#0891b2" />
              <circle
                cx={waveX}
                cy={cosineY}
                r="4.8"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="1.6"
              />
              <text
                x={wavePadding}
                y="18"
                className="fill-cyan-700 text-[11px]"
              >
                sin θ
              </text>
              <text
                x={wavePadding + 54}
                y="18"
                className="fill-slate-700 text-[11px]"
              >
                cos θ
              </text>
            </svg>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <ValueCard label="θ градус" value={`${Math.round(thetaDeg)}°`} />
            <ValueCard label="θ радиан" value={thetaRad.toFixed(3)} />
            <ValueCard label="sin θ босоо" value={sinValue.toFixed(3)} />
            <ValueCard label="cos θ хэвтээ" value={cosValue.toFixed(3)} />
          </div>

          <AngleSlider
            thetaDeg={thetaDeg}
            setThetaDeg={setThetaDeg}
            setIsPlaying={setIsPlaying}
            dark={false}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((current) => !current)}
              className="h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {isPlaying ? "Түр зогсоох" : "Эхлүүлэх"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Дахин эхлүүлэх
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoPanel() {
  return (
    <aside className="rounded-3xl border border-cyan-100/15 bg-white/[0.055] p-5 shadow-2xl shadow-slate-950/25 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
        Радиан тайлбар
      </p>
      <h2 className="mt-4 font-mono text-4xl font-semibold tracking-tight text-white">
        θ / r = π
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Нумын урт / радиус = өнцөг (радиан)
      </p>

      <div className="mt-6 space-y-3 text-sm">
        <div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/10 p-3 text-cyan-100">
          <span className="font-mono font-semibold">cos θ</span> = x координат
        </div>
        <div className="rounded-2xl border border-fuchsia-200/15 bg-fuchsia-300/10 p-3 text-fuchsia-100">
          <span className="font-mono font-semibold">sin θ</span> = y координат
        </div>
      </div>
    </aside>
  );
}

function DarkValueCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "sin" | "cos";
}) {
  const toneClass =
    tone === "sin"
      ? "text-cyan-700"
      : tone === "cos"
        ? "text-slate-950"
        : "text-slate-950";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-xl font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function TrigValuesTable({
  activeAngle,
  selectedAngle,
  selectedFeature,
  onAngleSelect,
  onFeatureSelect,
}: {
  activeAngle: number;
  selectedAngle: number | null;
  selectedFeature: TrigFeature;
  onAngleSelect: (angle: number) => void;
  onFeatureSelect: (feature: TrigFeature) => void;
}) {
  return (
    <div className="mb-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] border-collapse text-center text-sm text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-36 px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Өнцөг
            </th>
            {trigTableAngles.map((angle) => (
              <th
                key={angle}
                className={`border-l border-slate-200 p-0 text-lg font-semibold ${
                  selectedAngle === angle ||
                  isActiveTableAngle(activeAngle, angle)
                    ? "bg-slate-950 text-white"
                    : "text-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onAngleSelect(angle)}
                  className="h-full w-full px-3 py-3 transition hover:bg-slate-100"
                >
                  {angle}°
                </button>
              </th>
            ))}
          </tr>
          <tr className="border-b border-slate-200 bg-white">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Радиан
            </th>
            {trigTableAngles.map((angle) => (
              <td
                key={angle}
                className={`border-l border-slate-200 p-0 font-mono text-base ${
                  selectedAngle === angle ||
                  isActiveTableAngle(activeAngle, angle)
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onAngleSelect(angle)}
                  className="h-full w-full px-3 py-2 transition hover:bg-slate-100"
                >
                  {trigTableValue(angle, "rad")}
                </button>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["sin", "cos", "tan"] as const).map((row) => (
            <tr key={row} className="border-b border-slate-200 last:border-b-0">
              <th
                className={`p-0 text-left text-2xl font-semibold capitalize ${
                  selectedFeature === row
                    ? "bg-slate-950 text-white"
                    : "text-slate-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onFeatureSelect(row)}
                  className="h-full w-full px-3 py-3 text-left transition hover:bg-slate-100"
                >
                  {row}
                </button>
              </th>
              {trigTableAngles.map((angle) => (
                <td
                  key={`${row}-${angle}`}
                  className={`border-l border-slate-200 p-0 font-mono text-lg ${
                    selectedAngle === angle ||
                    selectedFeature === row ||
                    isActiveTableAngle(activeAngle, angle)
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onAngleSelect(angle);
                      onFeatureSelect(row);
                    }}
                    className="h-full w-full px-3 py-3 transition hover:bg-slate-100"
                  >
                    {trigTableValue(angle, row)}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isActiveTableAngle(activeAngle: number, tableAngle: number) {
  const distance = Math.abs(activeAngle - tableAngle);
  return Math.min(distance, 360 - distance) <= 3;
}

function findKeyAngle(angle: number) {
  return (
    trigTableAngles.find((keyAngle) => isActiveTableAngle(angle, keyAngle)) ??
    null
  );
}

function trigTableValue(angle: number, row: TrigTableRow) {
  const values: Record<number, Record<TrigTableRow, string>> = {
    0: { rad: "0", sin: "0", cos: "1", tan: "0" },
    30: { rad: "π/6", sin: "1/2", cos: "√3/2", tan: "1/√3" },
    45: { rad: "π/4", sin: "1/√2", cos: "1/√2", tan: "1" },
    60: { rad: "π/3", sin: "√3/2", cos: "1/2", tan: "√3" },
    90: { rad: "π/2", sin: "1", cos: "0", tan: "Тодорхойгүй" },
    180: { rad: "π", sin: "0", cos: "-1", tan: "0" },
    270: { rad: "3π/2", sin: "-1", cos: "0", tan: "Тодорхойгүй" },
    360: { rad: "2π", sin: "0", cos: "1", tan: "0" },
  };

  return values[angle][row];
}

function createFeatureNote(
  selectedFeature: TrigFeature,
  selectedAngle: number | null,
  activeAngle: number,
) {
  if (selectedFeature === "tan") {
    return "tan θ нь sin θ / cos θ харьцаа. Тангенсын тусгай дүрслэлийг дараагийн алхамд нэмнэ.";
  }

  if (selectedAngle !== null) {
    return `${selectedAngle}° дээр sin θ = ${trigTableValue(selectedAngle, "sin")}, cos θ = ${trigTableValue(selectedAngle, "cos")}.`;
  }

  if (selectedFeature === "sin") {
    return "sin θ нь тойрог дээрх цэгийн босоо координат.";
  }

  if (selectedFeature === "cos") {
    return "cos θ нь тойрог дээрх цэгийн хэвтээ координат.";
  }

  return `${Math.round(activeAngle)}° дээр point, projection, graph marker бүгд нэг θ утгаар хөдөлж байна.`;
}

function ValueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function AngleSlider({
  thetaDeg,
  setThetaDeg,
  setIsPlaying,
  dark,
}: {
  thetaDeg: number;
  setThetaDeg: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  dark: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "rounded-3xl border border-white/10 bg-white/[0.045] p-4"
          : "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      }
    >
      <input
        type="range"
        min="0"
        max="360"
        value={Math.round(thetaDeg)}
        onChange={(event) => {
          setIsPlaying(false);
          setThetaDeg(Number(event.target.value));
        }}
        className={`h-2 w-full ${dark ? "accent-cyan-300" : "accent-slate-950"}`}
      />
      <div
        className={`mt-3 flex flex-wrap justify-between gap-2 text-[11px] ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {keyAngles.map((angle) => (
          <button
            key={angle}
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setThetaDeg(angle);
            }}
            className={
              dark
                ? "rounded-full border border-white/10 px-2 py-1 transition hover:border-cyan-200/50 hover:text-cyan-100"
                : "rounded-full border border-slate-200 bg-white px-2 py-1 transition hover:border-slate-400 hover:text-slate-950"
            }
          >
            {angle}°
          </button>
        ))}
      </div>
    </div>
  );
}

function useTrigController() {
  const [rawThetaDeg, setRawThetaDeg] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const values = useMemo(() => {
    const thetaDeg = normalizeDegrees(rawThetaDeg);
    const thetaRad = (thetaDeg * Math.PI) / 180;
    const sinValue = Math.sin(thetaRad);
    const cosValue = Math.cos(thetaRad);

    return {
      thetaDeg,
      thetaRad,
      sinValue,
      cosValue,
      phaseDeg: rawThetaDeg,
    };
  }, [rawThetaDeg]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const tick = (time: number) => {
      if (previousTimeRef.current === null) {
        previousTimeRef.current = time;
      }

      const delta = time - previousTimeRef.current;
      previousTimeRef.current = time;
      setRawThetaDeg((current) => current + delta * 0.03 * speed);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      previousTimeRef.current = null;
    };
  }, [isPlaying, speed]);

  function reset() {
    setIsPlaying(false);
    setRawThetaDeg(0);
  }

  function setThetaDeg(value: number) {
    setRawThetaDeg(value);
  }

  return {
    isPlaying,
    speed,
    setSpeed,
    setThetaDeg,
    setIsPlaying,
    reset,
    ...values,
  };
}

function normalizeDegrees(value: number) {
  const normalized = ((value % 360) + 360) % 360;

  if (normalized === 0 && value > 0 && Math.round(value) % 360 === 0) {
    return 360;
  }

  return normalized;
}

function createProjectedArcPath(thetaDeg: number, arcRadius: number) {
  const endDeg = Math.max(0.1, Math.min(thetaDeg, 359.9));
  const endRad = (endDeg * Math.PI) / 180;
  const startX = labCenterX + arcRadius;
  const startY = labCenterY;
  const endX = labCenterX + Math.cos(endRad) * arcRadius;
  const endY = labCenterY - Math.sin(endRad) * arcRadius * labYScale;
  const largeArcFlag = endDeg > 180 ? 1 : 0;

  return `M ${startX.toFixed(2)} ${startY.toFixed(2)} A ${arcRadius} ${(arcRadius * labYScale).toFixed(2)} 0 ${largeArcFlag} 0 ${endX.toFixed(2)} ${endY.toFixed(2)}`;
}

function radianLabel(angle: number) {
  const labels: Record<number, string> = {
    0: "0",
    90: "π/2",
    180: "π",
    270: "3π/2",
    360: "2π",
  };

  return labels[angle];
}

function createOrbitTrail(thetaDeg: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = thetaDeg - index * 7.5;
    const rad = (angle * Math.PI) / 180;
    const progress = 1 - index / count;

    return {
      index,
      x: labCenterX + Math.cos(rad) * labRadius,
      y: labCenterY - Math.sin(rad) * labRadius * labYScale,
      r: 3 + progress * 3.2,
      opacity: 0.1 + progress * 0.46,
      color: index % 2 === 0 ? "#67e8f9" : "#f0abfc",
    };
  });
}

function createGeneratedGraphSegment(
  fn: (value: number) => number,
  thetaDeg: number,
  windowDeg: number,
) {
  const endDeg = Math.max(0, thetaDeg);
  const startDeg = Math.max(0, endDeg - windowDeg);
  const samples = 16;

  const points = Array.from({ length: samples }, (_, index) => {
    const progress = index / (samples - 1);
    const degree = startDeg + (endDeg - startDeg) * progress;
    const rad = (degree * Math.PI) / 180;
    const x = graphPadding + (degree / 360) * (graphWidth - graphPadding * 2);
    const y = graphHeight / 2 - fn(rad) * 72;

    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return points.join(" ");
}

function createChalkWavePath(
  fn: (value: number) => number,
  thetaDeg: number,
  startX: number,
  endX: number,
  axisY: number,
  amplitude: number,
) {
  const clampedTheta = Math.max(0, Math.min(thetaDeg, 360));
  const samples = Math.max(2, Math.ceil(clampedTheta / 3));

  const points = Array.from({ length: samples }, (_, index) => {
    const progress = samples === 1 ? 0 : index / (samples - 1);
    const degree = clampedTheta * progress;
    const rad = (degree * Math.PI) / 180;
    const x = startX + (degree / 360) * (endX - startX);
    const y = axisY - fn(rad) * amplitude;

    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return points.join(" ");
}

function createScrollingWavePath(
  fn: (value: number) => number,
  phaseDeg: number,
  startX: number,
  endX: number,
  axisY: number,
  amplitude: number,
) {
  const samples = 160;

  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const degree = phaseDeg - 360 + progress * 360;
    const rad = (degree * Math.PI) / 180;
    const x = startX + progress * (endX - startX);
    const y = axisY - fn(rad) * amplitude;

    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return points.join(" ");
}

function createWavePath(fn: (value: number) => number) {
  const points = Array.from({ length: 145 }, (_, index) => {
    const progress = index / 144;
    const angle = progress * Math.PI * 2;
    const x = wavePadding + progress * (waveWidth - wavePadding * 2);
    const y = waveHeight / 2 - fn(angle) * 66;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return points.join(" ");
}

function createGraphPath(fn: (value: number) => number) {
  const points = Array.from({ length: 161 }, (_, index) => {
    const progress = index / 160;
    const angle = progress * Math.PI * 2;
    const x = graphPadding + progress * (graphWidth - graphPadding * 2);
    const y = graphHeight / 2 - fn(angle) * 72;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return points.join(" ");
}
