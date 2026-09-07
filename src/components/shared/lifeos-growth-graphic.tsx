'use client';

import { memo, useEffect, useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import styles from './lifeos-growth-graphic.module.css';

interface LifeOSGrowthGraphicProps {
  /** The dashboard's actual daily score. Null means progress is unavailable. */
  progress: number | null;
}

const branches = [
  { path: 'M200 219 C181 204 166 195 143 186', x: 143, y: 186, angle: -35, tier: 0 },
  { path: 'M200 203 C218 188 236 181 259 166', x: 259, y: 166, angle: 35, tier: 0 },
  { path: 'M200 181 C184 167 167 153 151 133', x: 151, y: 133, angle: -35, tier: 1 },
  { path: 'M200 165 C219 149 230 128 238 109', x: 238, y: 109, angle: 30, tier: 1 },
  { path: 'M175 200 C160 202 142 203 123 198', x: 123, y: 198, angle: -65, tier: 1 },
  { path: 'M230 185 C251 188 269 183 283 177', x: 283, y: 177, angle: 55, tier: 1 },
  { path: 'M176 161 C159 160 142 150 132 140', x: 132, y: 140, angle: -60, tier: 2 },
  { path: 'M220 143 C239 146 256 137 271 124', x: 271, y: 124, angle: 55, tier: 2 },
  { path: 'M199 142 C185 128 176 111 177 94', x: 177, y: 94, angle: -20, tier: 2 },
  { path: 'M201 127 C210 112 215 91 211 76', x: 211, y: 76, angle: 15, tier: 2 },
];

export const LifeOSGrowthGraphic = memo(function LifeOSGrowthGraphic({ progress }: LifeOSGrowthGraphicProps) {
  const id = useId().replace(/:/g, '');
  const root = useRef<HTMLElement>(null);
  const score = progress !== null && Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : null;
  const tier = score === null || score < 30 ? 0 : score < 70 ? 1 : 2;
  const stage = score === null ? 'Room to grow' : score < 30 ? 'Taking root' : score < 70 ? 'Finding your rhythm' : 'Growing stronger';

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let visible = true;
    const sync = () => { element.dataset.paused = String(!visible || document.hidden); };
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.05 })
      : null;
    observer?.observe(element);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  return (
    <section ref={root} className={styles.hero} aria-labelledby={`${id}-heading`}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}><span /> LIFE OS · LIVING GROWTH</p>
        <h2 id={`${id}-heading`}>Small steps.<br /><span>A life in bloom.</span></h2>
        <p className={styles.description}>Let’s make today better than yesterday.<br />{' '}Every little effort gives your growth new roots.</p>
        <div className={styles.progressHeading}><span>Today’s progress</span><strong>{score === null ? 'Not yet available' : `${score}%`}</strong></div>
        {score !== null && <div className={styles.progressTrack} role="progressbar" aria-label="Today's Life OS progress" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${score}%` }} /></div>}
        <p className={styles.caption}>{score === null ? 'Your tree will reflect your progress when it’s available.' : 'Based on your daily Life OS score.'}</p>
      </div>
      <figure className={styles.visual} aria-label={`Living growth tree: ${stage}. ${score === null ? 'Neutral state; progress unavailable.' : `Today’s progress is ${score} percent.`}`}>
        <svg className={styles.svg} viewBox="0 0 400 330" fill="none" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={`${id}-branch`} x1="160" y1="265" x2="236" y2="75" gradientUnits="userSpaceOnUse"><stop stopColor="#57bda4" /><stop offset="1" stopColor="#d4f7d0" /></linearGradient>
            <radialGradient id={`${id}-aura`}><stop stopColor="#5ce2bd" stopOpacity=".13" /><stop offset="1" stopColor="#5ce2bd" stopOpacity="0" /></radialGradient>
            <radialGradient id={`${id}-seed`}><stop stopColor="#edffe1" /><stop offset=".25" stopColor="#a9f3c7" stopOpacity=".85" /><stop offset="1" stopColor="#6ae4bc" stopOpacity="0" /></radialGradient>
          </defs>
          <circle className={styles.aura} cx="200" cy="167" r="146" fill={`url(#${id}-aura)`} />
          <g className={styles.energy}><circle cx="200" cy="166" r="119" stroke="#b7eed5" strokeOpacity=".14" strokeWidth=".7" /><path d="M86 131 A119 119 0 0 1 137 65 M281 253 A119 119 0 0 0 314 200" stroke="#a5e2cb" strokeOpacity=".4" strokeLinecap="round" /></g>
          <ellipse cx="200" cy="273" rx="72" ry="10" stroke="#a1e6ca" strokeOpacity=".12" />
          <ellipse cx="200" cy="273" rx="42" ry="5" fill="#6fdeb2" fillOpacity=".045" />
          <circle className={styles.seed} cx="200" cy="262" r="15" fill={`url(#${id}-seed)`} />
          <circle className={styles.pulse} cx="200" cy="262" r="18" stroke="#baf4d2" strokeWidth=".8" />
          <g className={styles.hoverTree}>
            <g className={styles.sway}>
              <path className={styles.stem} pathLength="1" d={`M200 261 C196 231 204 209 200 182 C197 160 203 147 200 ${tier === 0 ? 145 : tier === 1 ? 115 : 89}`} stroke={`url(#${id}-branch)`} strokeWidth="2.2" strokeLinecap="round" />
              {branches.filter(branch => branch.tier <= tier).map((branch, index) => <g key={branch.path}>
                <path className={styles.branch} style={{ '--delay': `${0.85 + index * 0.095}s` } as CSSProperties} pathLength="1" d={branch.path} stroke={`url(#${id}-branch)`} strokeWidth={branch.tier === 0 ? 1.6 : 1.1} strokeLinecap="round" />
                <g transform={`translate(${branch.x} ${branch.y}) rotate(${branch.angle})`}><g className={styles.leaf} style={{ '--delay': `${1.65 + index * 0.1}s` } as CSSProperties}><path d="M0 2 C-10 -1 -10 -13 0 -17 C8 -10 8 -3 0 2Z" fill="#b9efc7" fillOpacity=".7" /><path d="M0 0 L0 -12" stroke="#e3ffda" strokeWidth=".6" /></g></g>
              </g>)}
              <circle className={styles.tip} cx="200" cy={tier === 0 ? 145 : tier === 1 ? 115 : 89} r="2.4" fill="#e0ffd7" />
            </g>
          </g>
          <g className={styles.particles} fill="#c7f6d7"><circle cx="112" cy="155" r="1.3" /><circle cx="260" cy="96" r="1.4" /><circle cx="295" cy="212" r="1" /><circle cx="155" cy="84" r="1" /></g>
          <circle cx="200" cy="262" r="2.3" fill="#e1ffce" className={styles.core} />
        </svg>
        <figcaption><span />{stage}</figcaption>
      </figure>
    </section>
  );
});
