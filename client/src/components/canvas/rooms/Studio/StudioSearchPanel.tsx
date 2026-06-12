import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  getStudioTitles,
  searchStudioContent,
  type StudioSearchItem,
  type StudioTitleItem
} from '../../../../lib/api';

const panelStyle = {
  position: 'fixed',
  top: '50%',
  right: 'clamp(1rem, 3.4vw, 4.3rem)',
  zIndex: 1200,
  width: 'min(19rem, calc(100vw - 2rem))',
  maxHeight: 'min(38rem, calc(100vh - 7rem))',
  padding: '0.78rem',
  color: '#202020',
  background: 'rgba(250, 250, 246, 0.82)',
  border: '1.5px solid rgba(30, 30, 30, 0.68)',
  boxShadow: '4px 5px 0 rgba(20, 20, 20, 0.12)',
  transform: 'translateY(-50%) rotate(-0.45deg)',
  fontFamily: '"Cabin Sketch", "Comic Sans MS", cursive',
  pointerEvents: 'auto',
  display: 'grid',
  gap: '0.55rem'
} as const;

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.46rem 0.58rem',
  color: '#202020',
  background: 'rgba(255, 255, 251, 0.88)',
  border: '1px solid rgba(30, 30, 30, 0.55)',
  boxShadow: '1px 1px 0 rgba(20, 20, 20, 0.1)',
  font: 'inherit',
  fontSize: '0.88rem'
} as const;

type StudioSearchPanelProps = {
  onSelectResult: (item: StudioSearchItem) => void;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function StudioSearchPanel({ onSelectResult }: StudioSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [titles, setTitles] = useState<StudioTitleItem[]>([]);
  const [results, setResults] = useState<StudioSearchItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    let active = true;

    getStudioTitles()
      .then(({ data }) => {
        if (active) {
          setTitles(data);
        }
      })
      .catch(() => {
        if (active) {
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setResults([]);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      searchStudioContent(trimmedQuery)
        .then(({ data }) => {
          if (!active) {
            return;
          }

          setResults(data);
          setStatus('idle');
        })
        .catch(() => {
          if (active) {
            setResults([]);
            setStatus('error');
          }
        });
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const matchingTitles = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return titles;
    }

    return titles.filter((item) => {
      const searchable = `${item.title} ${item.platform}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, titles]);

  const isSearching = query.trim().length > 0;

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <section aria-label="Studio title search" style={panelStyle}>
      <strong style={{ display: 'block', fontSize: '0.98rem', lineHeight: 1.1 }}>
        Studio title search
      </strong>
      <input
        aria-label="Search by content title"
        onChange={handleInputChange}
        placeholder="Title-аар хайх..."
        style={inputStyle}
        value={query}
      />

      <div
        aria-label="Quick title search"
        style={{
          display: 'grid',
          gap: '0.16rem',
          maxHeight: '14.5rem',
          overflowY: 'auto',
          paddingRight: '0.18rem'
        }}
      >
        {matchingTitles.map((item) => {
          const isActive = normalize(query) === normalize(item.title);

          return (
            <button
              key={item.id}
              onClick={() => setQuery(item.title)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.6rem minmax(0, 1fr)',
                alignItems: 'center',
                gap: '0.42rem',
                width: '100%',
                border: 0,
                background: isActive
                  ? 'rgba(255, 255, 251, 0.82)'
                  : 'transparent',
                color: '#202020',
                cursor: 'pointer',
                font: 'inherit',
                padding: '0.16rem 0.2rem',
                textAlign: 'left'
              }}
              title={item.title}
              type="button"
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'block',
                  justifySelf: 'end',
                  width: isActive ? '2.18rem' : '1.78rem',
                  height: isActive ? '0.22rem' : '0.18rem',
                  borderRadius: '999px',
                  background: isActive
                    ? '#202020'
                    : 'rgba(32, 32, 32, 0.42)',
                  boxShadow: isActive
                    ? '0 0 0 1px rgba(255, 255, 251, 0.9)'
                    : 'none'
                }}
              />
              <span
                style={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.78rem',
                  opacity: isActive ? 1 : 0.74
                }}
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gap: '0.42rem',
          maxHeight: '10.5rem',
          overflowY: 'auto',
          paddingTop: '0.08rem'
        }}
      >
        {status === 'loading' && <p style={{ margin: 0 }}>Searching...</p>}
        {status === 'error' && (
          <p style={{ margin: 0, color: '#7d2323' }}>
            Studio backend search ажилласангүй.
          </p>
        )}
        {isSearching && status === 'idle' && results.length === 0 && (
          <p style={{ margin: 0, opacity: 0.7 }}>Илэрц олдсонгүй.</p>
        )}
        {status !== 'loading' &&
          results.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectResult(item)}
              style={{
                display: 'grid',
                gridTemplateColumns: '3.8rem minmax(0, 1fr)',
                gap: '0.5rem',
                alignItems: 'center',
                border: '1px solid rgba(30, 30, 30, 0.28)',
                background: 'rgba(255, 255, 251, 0.76)',
                color: '#202020',
                cursor: 'pointer',
                font: 'inherit',
                padding: '0.36rem',
                textAlign: 'left'
              }}
              type="button"
            >
              <img
                alt=""
                src={item.paintedImage || item.image}
                style={{
                  width: '3.8rem',
                  height: '2.72rem',
                  objectFit: 'cover',
                  border: '1px solid rgba(30, 30, 30, 0.2)'
                }}
              />
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.title}
                </span>
                <small style={{ opacity: 0.68 }}>{item.platform}</small>
              </span>
            </button>
          ))}
      </div>
    </section>
  );
}
