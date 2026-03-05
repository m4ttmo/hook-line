import { useState, useEffect, useCallback } from "react";

const TMDB_KEY = "3d5de9bc75efc0818a12aaaf8f88f0b5";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";

// ── Storage ──────────────────────────────────────────────────────────────────
const db = {
  get: (k) => {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch {
      return null;
    }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtMoney = (n) => {
  if (!n) return "$0";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
};

const currentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};
const currentSeason = () => new Date().getFullYear();

// ── Schedule Logic ────────────────────────────────────────────────────────────
// Week cycle:
//   Friday 23:00  → screens WIPE, draft window OPENS
//   Monday 00:00  → draft LOCKS (no more picks / swaps)
//   Friday 23:00  → repeat
//
// Draft OPEN window: Fri 23:00 → Mon 00:00  (Fri night, Sat, Sun)
// Draft LOCKED:      Mon 00:00 → Fri 23:00

const getScheduleState = (now = new Date()) => {
  const day = now.getDay(); // 0=Sun 1=Mon … 6=Sat
  const h = now.getHours();

  // Open: Saturday (6), Sunday (0), or Friday at/after 23:00
  const isOpenDay = day === 0 || day === 6 || (day === 5 && h >= 23);
  const locked = !isOpenDay;

  // Next lock = coming Monday 00:00
  const nextLock = new Date(now);
  const daysToMon = day === 1 ? 7 : (8 - day) % 7;
  nextLock.setDate(now.getDate() + daysToMon);
  nextLock.setHours(0, 0, 0, 0);

  // Next wipe = coming Friday 23:00
  const nextWipe = new Date(now);
  let daysToFri = (5 - day + 7) % 7;
  if (daysToFri === 0 && h >= 23) daysToFri = 7; // already wiped tonight
  nextWipe.setDate(now.getDate() + daysToFri);
  nextWipe.setHours(23, 0, 0, 0);

  const countdown = (target) => {
    const diff = Math.max(0, target - now);
    const totalMins = Math.floor(diff / 60000);
    const days = Math.floor(totalMins / 1440);
    const hrs = Math.floor((totalMins % 1440) / 60);
    const mins = totalMins % 60;
    if (days > 0) return `${days}d ${hrs}h`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return {
    locked,
    nextLockIn: locked ? null : countdown(nextLock),
    nextWipeIn: countdown(nextWipe),
  };
};

// Returns true if screens were just wiped this session
const checkAndWipeScreens = (username) => {
  const wipeKey = `fbo_wipe_${username}`;
  const lastWipe = db.get(wipeKey) || 0;
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours();

  // Most recent Friday-23:00 timestamp
  let daysBack = (day - 5 + 7) % 7;
  if (daysBack === 0 && h < 23) daysBack = 7; // haven't hit 23:00 yet today
  const lastFriAt23 = new Date(now);
  lastFriAt23.setDate(now.getDate() - daysBack);
  lastFriAt23.setHours(23, 0, 0, 0);

  if (lastFriAt23.getTime() > lastWipe && Date.now() >= lastFriAt23.getTime()) {
    db.set(`fbo_screens_${username}`, Array(8).fill(null));
    db.set(wipeKey, Date.now());
    return true;
  }
  return false;
};

// ── Revenue simulation ────────────────────────────────────────────────────────
const simulateRevenue = (movie) => {
  if (!movie) return 0;
  const seed = movie.id % 1000;
  const base =
    (movie.popularity || 10) * 80000 + (movie.vote_average || 5) * 500000;
  const jitter = 0.85 + (seed / 1000) * 0.3;
  return Math.round(base * jitter);
};

// ── TMDB ──────────────────────────────────────────────────────────────────────
async function fetchNowPlaying() {
  const r = await fetch(
    `${TMDB_BASE}/movie/now_playing?api_key=${TMDB_KEY}&language=en-US&page=1`
  );
  const d = await r.json();
  return d.results || [];
}
async function fetchTrending() {
  const r = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`);
  const d = await r.json();
  return d.results || [];
}
async function searchMovies(q) {
  if (!q.trim()) return [];
  const r = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
      q
    )}`
  );
  const d = await r.json();
  return d.results?.slice(0, 12) || [];
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid #e5e7eb",
          borderTopColor: "#f59e0b",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}

// ── Schedule Banner ───────────────────────────────────────────────────────────
function ScheduleBanner({ wiped }) {
  const [s, setS] = useState(() => getScheduleState());
  useEffect(() => {
    const t = setInterval(() => setS(getScheduleState()), 30000);
    return () => clearInterval(t);
  }, []);

  if (wiped)
    return (
      <div
        style={{
          background: "linear-gradient(90deg,#fef3c7,#fffbf0)",
          border: "1.5px solid #f59e0b",
          borderRadius: 14,
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>🎬</span>
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 14,
              color: "#92400e",
            }}
          >
            New week — fresh lineup!
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#b45309" }}>
            Your screens have been cleared. The draft window is open — pick your
            films before Monday!
          </p>
        </div>
      </div>
    );

  if (s.locked)
    return (
      <div
        style={{
          background: "linear-gradient(90deg,#fef2f2,#fff5f5)",
          border: "1.5px solid #fca5a5",
          borderRadius: 14,
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 14,
              color: "#991b1b",
            }}
          >
            Draft Locked
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#b91c1c" }}>
            Your picks are locked in. Screens wipe and the new draft window
            opens in <strong>{s.nextWipeIn}</strong>.
          </p>
        </div>
        <div
          style={{
            background: "#fee2e2",
            borderRadius: 10,
            padding: "8px 16px",
            textAlign: "center",
            minWidth: 90,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "#b91c1c",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Wipes in
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 18,
              fontWeight: 800,
              color: "#991b1b",
            }}
          >
            {s.nextWipeIn}
          </p>
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: "linear-gradient(90deg,#ecfdf5,#f0fdf4)",
        border: "1.5px solid #6ee7b7",
        borderRadius: 14,
        padding: "14px 20px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 24 }}>✅</span>
      <div style={{ flex: 1 }}>
        <p
          style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#065f46" }}
        >
          Draft Window Open
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: "#047857" }}>
          Pick your films now! Draft locks <strong>Monday midnight</strong> —
          closes in <strong>{s.nextLockIn}</strong>.
        </p>
      </div>
      <div
        style={{
          background: "#d1fae5",
          borderRadius: 10,
          padding: "8px 16px",
          textAlign: "center",
          minWidth: 90,
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            color: "#047857",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Locks in
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 18,
            fontWeight: 800,
            color: "#065f46",
          }}
        >
          {s.nextLockIn}
        </p>
      </div>
    </div>
  );
}

// ── Week Timeline ─────────────────────────────────────────────────────────────
function WeekTimeline() {
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours();

  const steps = [
    {
      label: "Fri 23:00",
      sub: "Screens wipe\nDraft opens",
      active: day === 5 && h >= 23,
    },
    {
      label: "Sat–Sun",
      sub: "Pick your\nfilms",
      active: day === 0 || day === 6,
    },
    { label: "Mon 00:00", sub: "Draft\nlocks", active: day === 1 && h < 4 },
    {
      label: "Mon–Fri",
      sub: "Films earn at\nthe box office",
      active: day >= 1 && day <= 5 && !(day === 5 && h >= 23),
    },
    { label: "Fri 23:00", sub: "Results tallied\n& reset", active: false },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "18px 20px",
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #f3f4f6",
      }}
    >
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 12,
          fontWeight: 700,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Weekly Schedule
      </p>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 9,
                  left: "50%",
                  width: "100%",
                  height: 2,
                  background: step.active ? "#f59e0b" : "#e5e7eb",
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                zIndex: 1,
                flexShrink: 0,
                background: step.active ? "#f59e0b" : "#e5e7eb",
                boxShadow: step.active
                  ? "0 0 0 4px rgba(245,158,11,0.2)"
                  : "none",
              }}
            />
            <p
              style={{
                margin: "6px 0 2px",
                fontSize: 11,
                fontWeight: 700,
                color: step.active ? "#111827" : "#6b7280",
                textAlign: "center",
              }}
            >
              {step.label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                color: "#9ca3af",
                textAlign: "center",
                whiteSpace: "pre-line",
                lineHeight: 1.3,
              }}
            >
              {step.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Movie Picker Modal ────────────────────────────────────────────────────────
function MoviePicker({ screenIndex, onPick, onClose, nowPlaying, trending }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState("now");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      setResults(await searchMovies(query));
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const list = query.trim() ? results : tab === "now" ? nowPlaying : trending;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 680,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "24px 24px 16px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              🎟 Pick Movie for Screen {screenIndex + 1}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "#f3f4f6",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: "pointer",
                fontSize: 16,
                color: "#6b7280",
              }}
            >
              ✕
            </button>
          </div>
          <input
            autoFocus
            placeholder="Search any movie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 14,
              boxSizing: "border-box",
              border: "1.5px solid #e5e7eb",
              outline: "none",
              fontFamily: "'DM Sans',sans-serif",
            }}
          />
          {!query.trim() && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {[
                ["now", "Now Playing"],
                ["trending", "Trending"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans',sans-serif",
                    background: tab === k ? "#111827" : "#f3f4f6",
                    color: tab === k ? "#fff" : "#6b7280",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
          {searching ? (
            <Spinner />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                gap: 14,
              }}
            >
              {list.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => onPick(movie)}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    cursor: "pointer",
                    border: "2px solid transparent",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "";
                  }}
                >
                  {movie.poster_path ? (
                    <img
                      src={`${IMG_BASE}${movie.poster_path}`}
                      alt={movie.title}
                      style={{
                        width: "100%",
                        display: "block",
                        aspectRatio: "2/3",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        aspectRatio: "2/3",
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                      }}
                    >
                      🎬
                    </div>
                  )}
                  <div style={{ padding: "8px 10px", background: "#fff" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#111827",
                        lineHeight: 1.3,
                      }}
                    >
                      {movie.title}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    >
                      ⭐ {movie.vote_average?.toFixed(1)} ·{" "}
                      {movie.release_date?.slice(0, 4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cinema Page ───────────────────────────────────────────────────────────────
function CinemaPage({ username, onRevenueChange }) {
  const [wiped] = useState(() => checkAndWipeScreens(username));
  const [schedule, setSchedule] = useState(() => getScheduleState());
  const [screens, setScreens] = useState(
    () => db.get(`fbo_screens_${username}`) || Array(8).fill(null)
  );
  const [picking, setPicking] = useState(null);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setSchedule(getScheduleState()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const [np, tr] = await Promise.all([fetchNowPlaying(), fetchTrending()]);
      setNowPlaying(np);
      setTrending(tr);
      setLoading(false);
    })();
  }, []);

  const saveScreens = (next) => {
    setScreens(next);
    db.set(`fbo_screens_${username}`, next);
    const rev = db.get(`fbo_revenue_${username}`) || {};
    const wk = `${currentSeason()}_W${currentWeek()}`;
    rev[wk] = next.reduce((s, m) => s + simulateRevenue(m), 0);
    db.set(`fbo_revenue_${username}`, rev);
    onRevenueChange();
  };

  const pickMovie = (movie) => {
    if (schedule.locked) return;
    const next = [...screens];
    next[picking] = movie;
    saveScreens(next);
    setPicking(null);
  };
  const removeMovie = (i) => {
    if (schedule.locked) return;
    const next = [...screens];
    next[i] = null;
    saveScreens(next);
  };
  const openPicker = (i) => {
    if (schedule.locked) return;
    setPicking(i);
  };

  const totalRevenue = screens.reduce((s, m) => s + simulateRevenue(m), 0);
  const filled = screens.filter(Boolean).length;

  return (
    <div>
      <ScheduleBanner wiped={wiped} />
      <WeekTimeline />

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Weekly Revenue",
            value: fmtMoney(totalRevenue),
            icon: "💰",
            color: "#10b981",
          },
          {
            label: "Screens Filled",
            value: `${filled} / 8`,
            icon: "🎭",
            color: "#3b82f6",
          },
          {
            label: "Draft Status",
            value: schedule.locked ? "🔒 Locked" : "✅ Open",
            icon: "📅",
            color: schedule.locked ? "#ef4444" : "#10b981",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "18px 20px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#9ca3af",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: s.color,
                }}
              >
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lock reminder bar */}
      {schedule.locked && (
        <div
          style={{
            background: "#fff7f7",
            border: "1.5px dashed #fca5a5",
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>🔒</span>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#b91c1c",
              fontWeight: 600,
            }}
          >
            The draft is locked Mon–Fri. You can view your lineup but cannot
            make changes until Friday night.
          </p>
        </div>
      )}

      {/* Screens grid */}
      {loading ? (
        <Spinner />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
            gap: 16,
          }}
        >
          {screens.map((movie, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                border: "1.5px solid #f3f4f6",
                transition: "transform 0.2s, box-shadow 0.2s",
                opacity: schedule.locked && !movie ? 0.55 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
              }}
            >
              <div style={{ position: "relative" }}>
                {/* Screen badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 4,
                    background: "#111827",
                    color: "#f59e0b",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  SCREEN {i + 1}
                </div>

                {movie ? (
                  <>
                    {movie.poster_path ? (
                      <img
                        src={`${IMG_BASE}${movie.poster_path}`}
                        alt={movie.title}
                        style={{
                          width: "100%",
                          aspectRatio: "2/3",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          aspectRatio: "2/3",
                          background: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 48,
                        }}
                      >
                        🎬
                      </div>
                    )}
                    {/* Remove btn only when unlocked */}
                    {!schedule.locked && (
                      <button
                        onClick={() => removeMovie(i)}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "rgba(239,68,68,0.9)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          width: 28,
                          height: 28,
                          cursor: "pointer",
                          fontSize: 14,
                          zIndex: 4,
                        }}
                      >
                        ✕
                      </button>
                    )}
                    {/* Frosted lock overlay when draft is locked */}
                    {schedule.locked && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 3,
                          background: "rgba(17,24,39,0.45)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          backdropFilter: "blur(1px)",
                        }}
                      >
                        <span style={{ fontSize: 28 }}>🔒</span>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          Locked
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty screen */
                  <div
                    style={{
                      aspectRatio: "2/3",
                      background: schedule.locked
                        ? "linear-gradient(145deg,#f1f5f9,#e2e8f0)"
                        : "linear-gradient(145deg,#f9fafb,#f3f4f6)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: schedule.locked ? "not-allowed" : "pointer",
                      gap: 8,
                    }}
                    onClick={() => openPicker(i)}
                  >
                    {schedule.locked ? (
                      <>
                        <span style={{ fontSize: 28 }}>🔒</span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            fontWeight: 600,
                          }}
                        >
                          Locked
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: "#f59e0b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          +
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            fontWeight: 600,
                          }}
                        >
                          Pick a Film
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div style={{ padding: "12px 14px" }}>
                {movie ? (
                  <>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#111827",
                        lineHeight: 1.3,
                      }}
                    >
                      {movie.title}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: 12,
                        color: "#9ca3af",
                      }}
                    >
                      ⭐ {movie.vote_average?.toFixed(1)}
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#10b981",
                      }}
                    >
                      {fmtMoney(simulateRevenue(movie))}{" "}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: "#9ca3af",
                        }}
                      >
                        est. this week
                      </span>
                    </p>
                    {!schedule.locked && (
                      <button
                        onClick={() => openPicker(i)}
                        style={{
                          marginTop: 8,
                          width: "100%",
                          padding: "7px 0",
                          background: "#f9fafb",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 600,
                          color: "#374151",
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        Swap Film
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => openPicker(i)}
                    disabled={schedule.locked}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      background: schedule.locked ? "#f3f4f6" : "#111827",
                      color: schedule.locked ? "#9ca3af" : "#f59e0b",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: schedule.locked ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {schedule.locked ? "🔒 Draft Locked" : "+ Add Film"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {picking !== null && !schedule.locked && (
        <MoviePicker
          screenIndex={picking}
          onPick={pickMovie}
          onClose={() => setPicking(null)}
          nowPlaying={nowPlaying}
          trending={trending}
        />
      )}
    </div>
  );
}

// ── Leagues Page ──────────────────────────────────────────────────────────────
function LeaguePage({ username }) {
  const [myLeagues, setMyLeagues] = useState(
    () => db.get(`fbo_myleagues_${username}`) || []
  );
  const [allLeagues, setAllLeagues] = useState(
    () => db.get("fbo_leagues") || {}
  );
  const [tab, setTab] = useState("my");
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState("");
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [lbMode, setLbMode] = useState("week");

  const refresh = () => {
    setAllLeagues(db.get("fbo_leagues") || {});
    setMyLeagues(db.get(`fbo_myleagues_${username}`) || []);
  };

  const createLeague = () => {
    if (!createName.trim()) return;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const leagues = db.get("fbo_leagues") || {};
    leagues[code] = {
      name: createName,
      code,
      members: [username],
      created: Date.now(),
    };
    db.set("fbo_leagues", leagues);
    const mine = db.get(`fbo_myleagues_${username}`) || [];
    mine.push(code);
    db.set(`fbo_myleagues_${username}`, mine);
    setCreateName("");
    setMsg(`League created! Share code: ${code}`);
    refresh();
  };

  const joinLeague = () => {
    const code = joinCode.trim().toUpperCase();
    const leagues = db.get("fbo_leagues") || {};
    if (!leagues[code]) {
      setMsg("League not found");
      return;
    }
    if (leagues[code].members.includes(username)) {
      setMsg("Already in this league");
      return;
    }
    leagues[code].members.push(username);
    db.set("fbo_leagues", leagues);
    const mine = db.get(`fbo_myleagues_${username}`) || [];
    mine.push(code);
    db.set(`fbo_myleagues_${username}`, mine);
    setJoinCode("");
    setMsg(`Joined "${leagues[code].name}"!`);
    refresh();
  };

  const getLeaderboard = (leagueCode, mode = "week") => {
    const leagues = db.get("fbo_leagues") || {};
    const league = leagues[leagueCode];
    if (!league) return [];
    return league.members
      .map((user) => {
        const rev = db.get(`fbo_revenue_${user}`) || {};
        let total = 0;
        if (mode === "week") {
          const wk = `${currentSeason()}_W${currentWeek()}`;
          total = rev[wk] || 0;
          if (!total) {
            const sc = db.get(`fbo_screens_${user}`) || [];
            total = sc.reduce((s, m) => s + simulateRevenue(m), 0);
          }
        } else {
          total = Object.values(rev).reduce((a, b) => a + b, 0);
          if (!total) {
            const sc = db.get(`fbo_screens_${user}`) || [];
            total = sc.reduce(
              (s, m) => s + simulateRevenue(m) * (5 + ((m?.id || 0) % 8)),
              0
            );
          }
        }
        return { user, total };
      })
      .sort((a, b) => b.total - a.total);
  };

  const MEDAL = ["#f59e0b", "#94a3b8", "#d97706"];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          ["my", "My Leagues"],
          ["create", "Create"],
          ["join", "Join"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => {
              setTab(k);
              setMsg("");
            }}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              fontFamily: "'DM Sans',sans-serif",
              background: tab === k ? "#111827" : "#f3f4f6",
              color: tab === k ? "#fff" : "#6b7280",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {msg && (
        <div
          style={{
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: 10,
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {msg}
        </div>
      )}

      {tab === "create" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            maxWidth: 420,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            Create a New League
          </h3>
          <input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="League name..."
            onKeyDown={(e) => e.key === "Enter" && createLeague()}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1.5px solid #e5e7eb",
              fontSize: 14,
              marginBottom: 12,
              boxSizing: "border-box",
              fontFamily: "'DM Sans',sans-serif",
              outline: "none",
            }}
          />
          <button
            onClick={createLeague}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "#f59e0b",
              color: "#111827",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Create League
          </button>
        </div>
      )}

      {tab === "join" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            maxWidth: 420,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            Join a League
          </h3>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter league code..."
            onKeyDown={(e) => e.key === "Enter" && joinLeague()}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1.5px solid #e5e7eb",
              fontSize: 14,
              marginBottom: 12,
              boxSizing: "border-box",
              fontFamily: "'DM Sans',sans-serif",
              outline: "none",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          />
          <button
            onClick={joinLeague}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "#111827",
              color: "#f59e0b",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Join League
          </button>
        </div>
      )}

      {tab === "my" &&
        (myLeagues.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}
          >
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏆</p>
            <p style={{ fontSize: 15, fontWeight: 600 }}>
              You're not in any leagues yet.
            </p>
            <p style={{ fontSize: 13 }}>Create one or join with a code!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {myLeagues.map((code) => {
              const l = allLeagues[code];
              if (!l) return null;
              const isSelected = selectedLeague === code;
              const lb = isSelected ? getLeaderboard(code, lbMode) : [];
              return (
                <div
                  key={code}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedLeague(isSelected ? null : code)}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: 16,
                          color: "#111827",
                        }}
                      >
                        {l.name}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        Code:{" "}
                        <strong style={{ color: "#f59e0b", letterSpacing: 1 }}>
                          {code}
                        </strong>{" "}
                        · {l.members.length} member
                        {l.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span style={{ fontSize: 18, color: "#9ca3af" }}>
                      {isSelected ? "▲" : "▼"}
                    </span>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        borderTop: "1px solid #f3f4f6",
                        padding: "16px 20px",
                      }}
                    >
                      <div
                        style={{ display: "flex", gap: 8, marginBottom: 16 }}
                      >
                        {[
                          ["week", `Week ${currentWeek()}`],
                          ["season", `${currentSeason()} Season`],
                        ].map(([k, lbl]) => (
                          <button
                            key={k}
                            onClick={() => setLbMode(k)}
                            style={{
                              padding: "5px 14px",
                              borderRadius: 20,
                              border: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "'DM Sans',sans-serif",
                              background: lbMode === k ? "#111827" : "#f3f4f6",
                              color: lbMode === k ? "#fff" : "#6b7280",
                            }}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {lb.map((entry, idx) => (
                          <div
                            key={entry.user}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "10px 14px",
                              borderRadius: 10,
                              background:
                                entry.user === username ? "#fffbf0" : "#f9fafb",
                              border:
                                entry.user === username
                                  ? "1.5px solid #f59e0b"
                                  : "1.5px solid transparent",
                            }}
                          >
                            <span
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: 13,
                                flexShrink: 0,
                                background: idx < 3 ? MEDAL[idx] : "#f3f4f6",
                                color: idx < 3 ? "#fff" : "#9ca3af",
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                fontWeight: entry.user === username ? 700 : 500,
                                fontSize: 14,
                                color: "#111827",
                              }}
                            >
                              {entry.user}
                              {entry.user === username && (
                                <span
                                  style={{ fontSize: 11, color: "#f59e0b" }}
                                >
                                  {" "}
                                  (you)
                                </span>
                              )}
                            </span>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#10b981",
                              }}
                            >
                              {fmtMoney(entry.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handle = () => {
    setError("");
    if (!form.username || !form.password) {
      setError("Fill in all fields");
      return;
    }
    const users = db.get("fbo_users") || {};
    if (mode === "signup") {
      if (users[form.username]) {
        setError("Username taken");
        return;
      }
      users[form.username] = {
        password: form.password,
        email: form.email,
        created: Date.now(),
      };
      db.set("fbo_users", users);
      onLogin(form.username);
    } else {
      if (
        !users[form.username] ||
        users[form.username].password !== form.password
      ) {
        setError("Invalid credentials");
        return;
      }
      onLogin(form.username);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#fffbf0 0%,#fff7e6 50%,#fef3c7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
          padding: "0 24px",
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "#111827",
              borderRadius: 16,
              padding: "12px 24px",
            }}
          >
            <span style={{ fontSize: 28 }}>🎬</span>
            <span
              style={{
                color: "#f59e0b",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 28,
                letterSpacing: 2,
              }}
            >
              BOXOFFICE BOSS
            </span>
          </div>
          <p style={{ color: "#6b7280", marginTop: 12, fontSize: 15 }}>
            Pick your films. Fill your screens. Beat the league.
          </p>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 36,
            boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
            border: "1px solid #f3f4f6",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 0,
              marginBottom: 28,
              background: "#f9fafb",
              borderRadius: 10,
              padding: 4,
            }}
          >
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: "'DM Sans',sans-serif",
                  background: mode === m ? "#111827" : "transparent",
                  color: mode === m ? "#fff" : "#6b7280",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          {[
            {
              key: "username",
              label: "Username",
              type: "text",
              placeholder: "your_username",
            },
            ...(mode === "signup"
              ? [
                  {
                    key: "email",
                    label: "Email",
                    type: "email",
                    placeholder: "you@example.com",
                  },
                ]
              : []),
            {
              key: "password",
              label: "Password",
              type: "password",
              placeholder: "••••••••",
            },
          ].map((f) => (
            <div key={f.key} style={{ marginBottom: 16, textAlign: "left" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                {f.label}
              </label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [f.key]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handle()}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  border: "1.5px solid #e5e7eb",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              />
            </div>
          ))}
          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button
            onClick={handle}
            style={{
              width: "100%",
              padding: "12px 0",
              background: "#f59e0b",
              color: "#111827",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: "0 2px 12px rgba(245,158,11,0.4)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "";
            }}
          >
            {mode === "login" ? "Enter the Cinema" : "Open for Business"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => db.get("fbo_session"));
  const [page, setPage] = useState("cinema");
  const [rev, setRev] = useState(0);

  const login = (u) => {
    db.set("fbo_session", u);
    setUser(u);
  };
  const logout = () => {
    db.set("fbo_session", null);
    setUser(null);
  };
  const onRevenueChange = useCallback(() => setRev((r) => r + 1), []);

  if (!user) return <AuthPage onLogin={login} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap');
        * { box-sizing:border-box; }
        @keyframes spin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#f1f5f9; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
      `}</style>

      <nav
        style={{
          background: "#111827",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 20px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            height: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginRight: 40,
            }}
          >
            <span style={{ fontSize: 22 }}>🎬</span>
            <span
              style={{
                color: "#f59e0b",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 22,
                letterSpacing: 2,
              }}
            >
              BOXOFFICE BOSS
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {[
              ["cinema", "🎭 My Cinema"],
              ["leagues", "🏆 Leagues"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setPage(k)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "'DM Sans',sans-serif",
                  background: page === k ? "#f59e0b" : "transparent",
                  color: page === k ? "#111827" : "#9ca3af",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                background: "#1f2937",
                borderRadius: 20,
                padding: "5px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {user[0].toUpperCase()}
              </div>
              <span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>
                {user}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                background: "transparent",
                border: "1px solid #374151",
                borderRadius: 8,
                color: "#6b7280",
                padding: "5px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            {page === "cinema" ? `${user}'s Cinema` : "Leagues"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#9ca3af" }}>
            {page === "cinema"
              ? `Week ${currentWeek()} · ${currentSeason()} Season — Pick your films and maximise your box office!`
              : "Create or join leagues, compare your weekly and season earnings"}
          </p>
        </div>
        {page === "cinema" && (
          <CinemaPage
            key={rev}
            username={user}
            onRevenueChange={onRevenueChange}
          />
        )}
        {page === "leagues" && <LeaguePage username={user} />}
      </main>
    </div>
  );
}
