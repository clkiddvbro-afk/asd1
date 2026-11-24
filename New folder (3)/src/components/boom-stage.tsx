import { useMemo, useRef, useState } from "react";
import { playBoom } from "@/lib/boom-audio";

type Spark = {
  id: string;
  dx: string;
  dy: string;
  size: string;
  delay: string;
  core: boolean;
};

function makeSparks(burst: number): Spark[] {
  if (burst === 0) return [];
  return Array.from({ length: 42 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 42 + (i % 3) * 0.08;
    const dist = 18 + ((i * 17) % 38);
    return {
      id: `${burst}-${i}`,
      dx: `${Math.cos(angle) * dist}vw`,
      dy: `${Math.sin(angle) * dist}vh`,
      size: `${0.35 + (i % 5) * 0.12}rem`,
      delay: `${(i % 6) * 12}ms`,
      core: i % 4 === 0,
    };
  });
}

export function BoomStage() {
  const [armed, setArmed] = useState(false);
  const [blasts, setBlasts] = useState(0);
  const [burst, setBurst] = useState(0);
  const rigRef = useRef<HTMLDivElement>(null);
  const sparks = useMemo(() => makeSparks(burst), [burst]);

  function detonate() {
    const next = !armed;
    setArmed(next);
    setBlasts((count) => count + 1);
    setBurst((count) => count + 1);
    playBoom(next);
    if (navigator.vibrate) navigator.vibrate(next ? [28, 24, 90] : [18, 16, 40]);
    const rig = rigRef.current;
    if (!rig) return;
    rig.classList.remove("is-blasting");
    void rig.offsetWidth;
    rig.classList.add("is-blasting");
  }

  const tally = String(blasts).padStart(2, "0");

  return (
    <main className={armed ? "stage is-hot" : "stage"}>
      <div className="rig" ref={rigRef}>
        <p className="hero-word" aria-hidden="true">
          BOOM
        </p>
        {burst > 0 ? (
          <div className="blast" key={burst} aria-hidden="true">
            <span className="ring ring-a" />
            <span className="ring ring-b" />
            <span className="ring ring-c" />
            {sparks.map((spark) => (
              <span
                key={spark.id}
                className={spark.core ? "spark is-core" : "spark"}
                style={{
                  ["--dx" as string]: spark.dx,
                  ["--dy" as string]: spark.dy,
                  ["--size" as string]: spark.size,
                  animationDelay: spark.delay,
                }}
              />
            ))}
          </div>
        ) : null}
        <header className="topbar">
          <p className="brand">
            <span className="mark" aria-hidden="true" />
            Detonator
          </p>
          <p className={armed ? "status is-live" : "status"}>{armed ? "Armed" : "Safe"}</p>
        </header>
        <div className="pedestal">
          <div className="switch-row">
            <span className={armed ? "side" : "side is-active"}>Safe</span>
            <button
              type="button"
              className="switch"
              aria-pressed={armed}
              aria-label={armed ? "Disarm the page" : "Detonate the page"}
              onClick={detonate}
            >
              <span className="knob" aria-hidden="true">
                <span className="groove" />
                <span className="groove" />
                <span className="groove" />
              </span>
            </button>
            <span className={armed ? "side is-hot" : "side is-lure"}>Boom</span>
          </div>
          <p className="hint">{armed ? "Flip it again." : "Flip the switch."}</p>
        </div>
        <footer className="bottombar">
          <p className="hint hint-quiet">The whole page goes with it.</p>
          <p className="tally">
            <span className="tally-label">Blasts</span>
            <span className="tally-num">{tally}</span>
          </p>
        </footer>
        <p className="live" aria-live="polite">
          {blasts > 0 ? `Boom. Blast ${blasts}.` : ""}
        </p>
      </div>
    </main>
  );
}
