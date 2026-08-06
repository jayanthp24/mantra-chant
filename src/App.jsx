import { useState, useRef, useEffect, useCallback } from "react";

const CYCLE = 108;

const MANTRA_LINES = [
    "HARE KRISHNA, HARE KRISHNA",
    "KRISHNA KRISHNA, HARE HARE",
    "HARE RAMA, HARE RAMA",
    "RAMA RAMA, HARE HARE",
];

// Same words, split into 2-word chunks so medium/small screens get
// twice as many (shorter) rows instead of 4 long ones.
const MANTRA_LINES_MOBILE = MANTRA_LINES.flatMap((line) => {
    const words = line.split(" ");
    const chunks = [];
    for (let i = 0; i < words.length; i += 2) {
        chunks.push(words.slice(i, i + 2).join(" "));
    }
    return chunks;
});

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, "0");
    const s = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, "0");
    return `${m}:${s}`;
}

// Precompute the 108 bead positions around the ring once.
const BEADS = Array.from({ length: CYCLE }, (_, i) => {
    const angle = (i / CYCLE) * 2 * Math.PI - Math.PI / 2;
    return {
        x: 50 + 46 * Math.cos(angle),
        y: 50 + 46 * Math.sin(angle),
    };
});

export default function App() {
    const [count, setCount] = useState(0);
    const [rounds, setRounds] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);
    const [image, setImage] = useState(null);
    const [flash, setFlash] = useState(false);
    const [bump, setBump] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fileInputRef = useRef(null);
    const countRef = useRef(0);

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [running]);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const chant = useCallback(() => {
        setRunning(true);
        setBump((b) => b + 1);

        countRef.current += 1;

        if (countRef.current >= CYCLE) {
            countRef.current = 0;
            setRounds((r) => r + 1);
            setFlash(true);
            setTimeout(() => setFlash(false), 650);
        }

        setCount(countRef.current);
    }, []);

    const handleScreenClick = () => {
        if (menuOpen) {
            setMenuOpen(false);
            return;
        }
        chant();
    };

    // Every control element calls stopPropagation, so its click never
    // reaches handleScreenClick above.
    const handleControlClick = (fn) => (e) => {
        e.stopPropagation();
        fn();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            setImage(reader.result);
            e.target.value = "";
        };

        reader.onerror = () => {
            console.error("Unable to read file");
        };

        reader.readAsDataURL(file);
    };

    const reset = () => {
        countRef.current = 0;
        setCount(0);
        setRounds(0);
        setSeconds(0);
        setRunning(false);
    };

    const toggleFullscreen = async () => {
        try {
            const el = document.documentElement;

            if (!document.fullscreenElement) {
                await el.requestFullscreen();
                console.log("Entered fullscreen");
            } else {
                await document.exitFullscreen();
                console.log("Exited fullscreen");
            }
        } catch (err) {
            console.error("Fullscreen failed:", err);
            alert(err.message);
        }
    };

    return (
        <div
            onClick={handleScreenClick}
            style={{ minHeight: "100dvh" }}
            className="min-h-screen w-full select-none bg-[#070912] text-slate-100 flex flex-col items-center justify-between overflow-hidden relative cursor-pointer"
        >
            {/* ambient glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(168,85,247,0.10),transparent_60%)]" />

            {/* full-page mantra watermark — 4 words/row on large screens only */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 hidden lg:flex flex-col items-center justify-center gap-[1.5vw] px-1 opacity-[0.14]"
            >
                {MANTRA_LINES.map((line, i) => (
                    <p
                        key={i}
                        className="text-center font-black uppercase leading-[1.02] tracking-tight text-[clamp(2.2rem,8vw,6rem)] bg-gradient-to-b from-white via-white/70 to-white/10 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                        style={{ whiteSpace: "nowrap" }}
                    >
                        {line}
                    </p>
                ))}
            </div>

            {/* medium & small screens — 2 words/row, sized to fit all 8 rows within viewport height */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 flex lg:hidden flex-col items-center justify-center gap-[1vh] px-1 opacity-[0.14]"
            >
                {MANTRA_LINES_MOBILE.map((line, i) => (
                    <p
                        key={i}
                        className="text-center font-black uppercase leading-[1.05] tracking-tight text-[clamp(1.2rem,min(11vw,8.5vh),3rem)] bg-gradient-to-b from-white via-white/70 to-white/10 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
                        style={{ whiteSpace: "nowrap" }}
                    >
                        {line}
                    </p>
                ))}
            </div>

            {/* header */}
            <header className="relative z-10 w-full flex items-center justify-center pt-6 sm:pt-8 pb-2 px-4 sm:px-6">
                <h1 className="text-xs sm:text-sm tracking-[0.3em] sm:tracking-[0.35em] uppercase text-slate-400 font-medium">
                    Japa <span className="text-fuchsia-400">Mala</span>
                </h1>

                <div
                    className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleControlClick(() => setMenuOpen((o) => !o))}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-slate-300 transition-colors"
                        aria-label="More options"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="2.5" r="1.4" />
                            <circle cx="8" cy="8" r="1.4" />
                            <circle cx="8" cy="13.5" r="1.4" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#10131f] border border-white/10 shadow-xl overflow-hidden">
                            <button
                                onClick={handleControlClick(() => {
                                    fileInputRef.current?.click();
                                    setMenuOpen(false);
                                })}
                                className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.06] transition-colors border-b border-white/5"
                            >
                                {image ? "Change photo" : "Upload photo"}
                            </button>
                            <button
                                onClick={handleControlClick(async () => {
                                    await toggleFullscreen();
                                    setMenuOpen(false);
                                })}
                                className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.06] transition-colors"
                            >
                                {isFullscreen ? "Exit full screen" : "Full screen"}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* hidden file input, triggered from the dropdown */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                onClick={(e) => e.stopPropagation()}
            />

            {/* stat cards */}
            <div className="relative z-10 w-full max-w-xs sm:max-w-sm px-4 sm:px-6 flex items-start justify-between -mb-2">
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 cursor-default"
                >
                    <p className="text-[9px] sm:text-[10px] tracking-widest text-slate-500 font-semibold">TIME</p>
                    <p className="text-base sm:text-lg font-semibold text-teal-300 tabular-nums">{formatTime(seconds)}</p>
                </div>
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 text-right cursor-default"
                >
                    <p className="text-[9px] sm:text-[10px] tracking-widest text-slate-500 font-semibold">MALAS</p>
                    <p className="text-base sm:text-lg font-semibold text-emerald-400 tabular-nums">{rounds}</p>
                </div>
            </div>

            {/* main counter ring */}
            <main className="relative z-10 flex-1 flex items-center justify-center w-full px-4">
                <div
                    className="relative aspect-square w-full"
                    style={{ width: "clamp(220px, 78vw, 440px)" }}
                >
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-0">
                        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.6" />
                        {BEADS.map((b, i) => {
                            const isDone = i < count;
                            const isCurrent = i === count;
                            return (
                                <circle
                                    key={i}
                                    cx={b.x}
                                    cy={b.y}
                                    r={isCurrent ? 1.7 : 1.1}
                                    className="transition-all duration-200"
                                    fill={
                                        isCurrent
                                            ? "#f0abfc"
                                            : isDone
                                            ? "#f5b942"
                                            : "rgba(148,163,184,0.35)"
                                    }
                                />
                            );
                        })}
                    </svg>

                    {/* completion flash ring */}
                    <div
                        className={`absolute inset-0 rounded-full border-2 border-amber-300 transition-opacity duration-500 ${
                            flash ? "opacity-70 scale-105" : "opacity-0 scale-100"
                        }`}
                    />

                    {/* center circle */}
                    <div
                        key={bump}
                        className="absolute inset-[16%] rounded-full bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden animate-[pop_180ms_ease-out]"
                    >
                        {image ? (
                            <img src={image} alt="Chant focus" className="w-full h-full object-cover" />
                        ) : null}
                        <div
                            className={`absolute inset-0 flex items-center justify-center ${
                                image ? "bg-black/35" : ""
                            }`}
                        >
                            <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-lg tabular-nums">
                                {count}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* hint */}
            <div className="relative z-10 flex flex-col items-center gap-4 -mt-2 px-4 sm:px-6">
                <p className="flex items-center gap-2 text-[11px] sm:text-xs text-fuchsia-300/80 bg-fuchsia-500/10 border border-fuchsia-400/20 rounded-full px-3.5 sm:px-4 py-1.5 text-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0" />
                    Tap anywhere to chant &middot; 108 per mala
                </p>
            </div>

            {/* bottom controls */}
            <footer className="relative z-10 w-full flex flex-wrap items-center justify-center gap-3 pb-8 sm:pb-10 pt-6 px-4">
                <button
                    onClick={handleControlClick(() => setRunning((r) => !r))}
                    className="rounded-full px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-sm bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/20"
                >
                    {running ? "Pause" : "Start"}
                </button>
                <button
                    onClick={handleControlClick(reset)}
                    className="rounded-full px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-sm bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 transition-colors"
                >
                    Reset
                </button>
            </footer>

            <style>{`
                @keyframes pop {
                    0% { transform: scale(0.94); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}