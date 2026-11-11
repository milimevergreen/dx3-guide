(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INK = '#141414', PAPER = '#f7f7f7', RED = '#cd3131';

  function el(name, attrs, parent, text) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  const ROUTE = [[190, 648], [290, 610], [400, 575], [530, 590], [665, 612], [800, 640], [900, 628], [975, 590], [1040, 520], [1062, 468], [1130, 520], [1190, 620], [1290, 745]];
  const STOP = { home: 0, school: 2, station: 5, hospital: 7, shrine: 9, warehouse: 12 };
  const STEPS_PER = 18;

  function spline(pts, n) {
    const P = [pts[0], ...pts, pts[pts.length - 1]], o = [];
    for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < n; k++) {
      const t = k / n, a = P[i - 1], b = P[i], c = P[i + 1], d = P[i + 2];
      o.push([0, 1].map(q => 0.5 * (2 * b[q] + (c[q] - a[q]) * t + (2 * a[q] - 5 * b[q] + 4 * c[q] - d[q]) * t * t + (3 * b[q] - a[q] - 3 * c[q] + d[q]) * t * t * t)));
    }
    o.push(pts[pts.length - 1]);
    return o;
  }
  const SAMPLES = spline(ROUTE, STEPS_PER);
  const LAST = SAMPLES.length - 1;
  const stopT = name => (STOP[name] * STEPS_PER) / LAST;
  const r1 = n => Math.round(n * 10) / 10;

  // 출발점에서 멀어질수록 좁아지는 경로
  function taper(t, factor) {
    const end = Math.max(2, Math.round(t * LAST)), left = [], right = [];
    for (let i = 0; i <= end; i++) {
      const a = SAMPLES[Math.max(0, i - 1)], b = SAMPLES[Math.min(LAST, i + 1)], p = SAMPLES[i];
      const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
      const w = (34 * Math.pow(1 - i / LAST, 1.4) + 3) * factor / 2;
      left.push([p[0] - dy / m * w, p[1] + dx / m * w]);
      right.push([p[0] + dy / m * w, p[1] - dx / m * w]);
    }
    return 'M' + [...left, ...right.reverse()].map(q => r1(q[0]) + ' ' + r1(q[1])).join('L') + 'Z';
  }
  const tip = t => SAMPLES[Math.max(0, Math.min(LAST, Math.round(t * LAST)))];

  // 좌표 격자: k가 클수록 (cx, cy)를 중심으로 당겨지고 소용돌이친다
  function warp(x, y, cx, cy, k) {
    if (k <= 0) return [x, y];
    const dx = x - cx, dy = y - cy, rr = dx * dx + dy * dy;
    const R = 90 + 190 * k, g = Math.exp(-rr / (R * R));
    const pull = 1 - Math.min(.9, .78 * k) * g, ang = 1.25 * k * g;
    const cs = Math.cos(ang), sn = Math.sin(ang);
    const tb = 30 * k * k * Math.exp(-rr / (R * R * 1.5));
    return [
      cx + (dx * cs - dy * sn) * pull + tb * Math.sin(y * .023 + x * .011 + 1.3),
      cy + (dx * sn + dy * cs) * pull + tb * Math.cos(x * .019 - y * .013)
    ];
  }
  function gridPath(cx, cy, k) {
    let d = '';
    for (let x = 0; x <= 1600; x += 60) for (let y = -500; y <= 1500; y += 20) {
      const p = warp(x, y, cx, cy, k);
      d += (y > -500 ? 'L' : 'M') + r1(p[0]) + ' ' + r1(p[1]);
    }
    for (let y = -500; y <= 1500; y += 60) for (let x = 0; x <= 1600; x += 20) {
      const p = warp(x, y, cx, cy, k);
      d += (x ? 'L' : 'M') + r1(p[0]) + ' ' + r1(p[1]);
    }
    return d;
  }

  // 격자에서 떨어져 나오는 사각형: [dx, dy, 크기, 나타나는 k]
  const SCATTER = [
    [-46, -30, 14, .45], [38, -58, 10, .5], [70, 22, 18, .58], [-84, 40, 9, .62], [18, 74, 12, .66],
    [-128, -72, 8, .72], [120, -26, 11, .76], [-30, 118, 7, .8], [150, 84, 15, .86], [-170, 20, 6, .9],
    [96, -120, 8, .94], [-110, 132, 10, 1], [196, -64, 6, 1.05], [-210, -110, 7, 1.1]
  ];
  function scatter(parent) {
    const nodes = SCATTER.map(() => el('rect', { fill: INK, opacity: 0 }, parent));
    return (cx, cy, k) => nodes.forEach((n, i) => {
      const s = SCATTER[i], m = .7 + .5 * k, size = s[2] * (.6 + .5 * k);
      n.setAttribute('x', r1(cx + s[0] * m - size / 2));
      n.setAttribute('y', r1(cy + s[1] * m - size / 2));
      n.setAttribute('width', r1(size));
      n.setAttribute('height', r1(size));
      n.setAttribute('opacity', k >= s[3] ? 1 : 0);
    });
  }

  const LABELS = [
    { t: 'N市', x: 1440, y: 626, s: 28, w: 700, ls: 10, city: 1 },
    { t: 'N湾', x: 560, y: 925, s: 22, w: 700, ls: 16 },
    { t: 'N川', x: 838, y: 300, s: 13, w: 500, ls: 4, r: -62 },
    { t: '春日町', x: 440, y: 768, s: 14, w: 500, ls: 4 },
    { t: '港町', x: 860, y: 784, s: 14, w: 500, ls: 4 },
    { t: '緑ヶ丘高校', x: 400, y: 542, s: 13, w: 700 },
    { t: 'N駅', x: 800, y: 614, s: 13, w: 700 },
    { t: '市民病院', x: 1000, y: 610, s: 13, w: 700, a: 'start' },
    { t: '春日神社', x: 1078, y: 450, s: 13, w: 700, a: 'start' },
    { t: '倉庫街', x: 1314, y: 724, s: 13, w: 700, a: 'start' },
    { t: '鳴瀬山', x: 1290, y: 132, s: 14, w: 500, ls: 2 },
    { t: '612', x: 1290, y: 188, s: 11, w: 500, m: 1 },
    { t: '鷹ノ巣山', x: 228, y: 142, s: 14, w: 500, ls: 2 },
    { t: '438', x: 228, y: 198, s: 11, w: 500, m: 1 }
  ];

  // hideCity: 시 이름을 지도 밖 캡션에 따로 적는 경우 지도 안의 라벨을 뺀다
  function drawBase(svg, base, scale, hideCity) {
    const k = scale || 1;
    el('image', { href: base, x: 0, y: -500, width: 1600, height: 2000, preserveAspectRatio: 'none' }, svg);
    const g = el('g', { 'aria-hidden': 'true' }, svg);
    el('path', { d: 'M1290 156l-7 12h14zM228 166l-7 12h14z', fill: INK }, g);
    LABELS.forEach(l => {
      if (hideCity && l.city) return;
      const a = { x: l.x, y: l.y, 'text-anchor': l.a || 'middle', class: l.m ? 'map-label map-num' : 'map-label', 'font-size': r1(l.s * k), 'font-weight': l.w, fill: INK, 'letter-spacing': l.ls || 0, lang: 'ja' };
      if (l.r) a.transform = `rotate(${l.r} ${l.x} ${l.y})`;
      el('text', a, g, l.t);
    });
  }

  function animate(ms, fn, done) {
    if (reduced) { fn(1); if (done) done(); return; }
    const s = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - s) / ms);
      fn(1 - Math.pow(2, -10 * p));
      if (p < 1) requestAnimationFrame(tick); else if (done) done();
    })(s);
  }

  window.NCity = { el, ROUTE, STOP, SAMPLES, stopT, taper, tip, gridPath, scatter, drawBase, animate, reduced, INK, PAPER, RED };
})();
