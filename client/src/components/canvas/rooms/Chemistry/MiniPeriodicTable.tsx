import React from 'react';
import { ELEMENTS } from '../../../../constants/element';

const CATEGORY_COLORS: Record<string, string> = {
  'alkali-metal':         '#10B981',
  'alkaline-earth':       '#EF4444',
  'transition-metal':     '#eab308',
  'post-transition-metal':'#a3e635',
  'metalloid':            '#8b5cf6',
  'nonmetal':             '#60A5FA',
  'halogen':              '#f9a8d4',
  'noble-gas':            '#92400e',
  'lanthanide':           '#14b8a6',
  'actinide':             '#db2777',
};

export default function MiniPeriodicTable() {
  return (
    <div
      style={{
        width: 180,
        height: 340,
        background: '#020202',
        borderRadius: 6,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflow: 'hidden',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ color: '#4ade80', fontSize: 7, textAlign: 'center', letterSpacing: 2, marginBottom: 2, fontWeight: 700 }}>
        ҮЕЛЭХ СИСТЕМ
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', gap: 1 }}>
        {ELEMENTS.filter(e => e.period <= 7).map((ele) => {
          const col = ele.group - 1;
          const row = ele.period - 1;
          return (
            <div
              key={ele.number}
              title={ele.name}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                width: '100%',
                aspectRatio: '1',
                backgroundColor: CATEGORY_COLORS[ele.category] || '#94a3b8',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 4,
                color: '#000',
                fontWeight: 700,
                lineHeight: 1,
                overflow: 'hidden',
              }}
            >
              {ele.symbol}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 1, marginTop: 2 }}>
        {ELEMENTS.filter(e => e.period === 8 || e.period === 9).map((ele) => (
          <div
            key={ele.number}
            title={ele.name}
            style={{
              gridRow: ele.period === 8 ? 1 : 2,
              width: '100%',
              aspectRatio: '1',
              backgroundColor: CATEGORY_COLORS[ele.category] || '#94a3b8',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 4,
              color: '#000',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {ele.symbol}
          </div>
        ))}
      </div>
    </div>
  );
}
