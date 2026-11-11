// 키네틱 내비게이션: 버튼 글자 롤, 3겹 패널, 링크 리빌, 호버 물결과 배경 도형
(function () {
  const nav = document.getElementById('nav'), btn = document.getElementById('menu-btn');
  if (!nav || !btn) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...nav.querySelectorAll('.nav-list > li')];
  const shapes = [...nav.querySelectorAll('.nav-shapes g[data-shape]')];
  let open = false, timer;

  function set(state) {
    if (state === open) return;
    open = state;
    clearTimeout(timer);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    btn.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('nav-open', open);
    nav.inert = !open;
    if (open) {
      nav.classList.remove('is-closing');
      nav.classList.add('is-open');
      const first = nav.querySelector('a.nav-link');
      if (first) first.focus({ preventScroll: true });
      // 패널이 자리를 잡은 뒤 첫 항목의 도형을 띄운다
      timer = setTimeout(() => { if (open && items[0]) showShape(items[0].dataset.shape); }, reduced ? 0 : 520);
    } else {
      nav.classList.remove('is-open');
      nav.classList.add('is-closing');
      showShape(null);
      timer = setTimeout(() => nav.classList.remove('is-closing'), reduced ? 0 : 720);
    }
  }

  // 배경 도형: 요소가 0.08초 간격으로 튀어 오른다
  function showShape(id) {
    shapes.forEach(g => {
      const on = g.dataset.shape === id, els = [...g.children];
      if (on && !g._on) {
        g._on = true;
        els.forEach((e, k) => e.animate(
          [{ opacity: 0, transform: 'scale(.5) rotate(-10deg)' }, { opacity: 1, transform: 'scale(1) rotate(0deg)' }],
          { duration: reduced ? 1 : 600, delay: reduced ? 0 : k * 80, easing: 'cubic-bezier(.34, 1.56, .64, 1)', fill: 'both' }
        ));
      } else if (!on && g._on) {
        g._on = false;
        els.forEach(e => e.animate([{ opacity: 0, transform: 'scale(.8) rotate(0deg)' }], { duration: reduced ? 1 : 300, easing: 'ease-in', fill: 'both' }));
      }
    });
  }

  // 호버 물결: 가까운 항목일수록 많이, 먼저 밀린다
  items.forEach((li, i) => {
    const enter = () => {
      items.forEach((o, j) => {
        const d = Math.abs(i - j);
        o.style.setProperty('--shift', (d === 0 ? 28 : d === 1 ? 11 : d === 2 ? 4 : 0) + 'px');
        o.style.setProperty('--rd', d * 45 + 'ms');
      });
      showShape(li.dataset.shape);
    };
    li.addEventListener('mouseenter', enter);
    li.addEventListener('focusin', () => showShape(li.dataset.shape));
  });
  const list = nav.querySelector('.nav-list');
  list.addEventListener('mouseleave', () => {
    items.forEach(o => { o.style.setProperty('--shift', '0px'); o.style.setProperty('--rd', '0ms'); });
    showShape(null);
  });

  btn.addEventListener('click', () => set(!open));
  nav.querySelector('.nav-scrim').addEventListener('click', () => set(false));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));

  // 하위 메뉴: 십자 버튼으로 펼치고 접는다
  nav.querySelectorAll('.nav-toggle').forEach(t => {
    const sub = document.getElementById(t.getAttribute('aria-controls'));
    t.addEventListener('click', () => {
      const on = t.getAttribute('aria-expanded') !== 'true';
      t.setAttribute('aria-expanded', on);
      sub.hidden = !on;
    });
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) { set(false); btn.focus(); }
  });
})();
