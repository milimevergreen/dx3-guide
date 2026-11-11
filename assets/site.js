// 공통: 읽은 가이드 표시, 도식 무대의 구간 전환
(function () {
  const KEY = 'dx3-read';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* 저장 불가 환경에서는 표시만 생략 */ } };

  const no = document.body.dataset.guide;
  if (no && !load().includes(no)) save([...load(), no]);
  const read = load();
  document.querySelectorAll('a.row[data-guide]').forEach(a => a.classList.toggle('done', read.includes(a.dataset.guide)));

  // sections의 data-cap을 설명으로, data-on/data-hot이 현재 구간을 포함하는 요소를 켠다
  window.GuideStage = function (opts) {
    const o = opts || {};
    const stage = document.getElementById('stage'), caption = document.getElementById('caption'), legs = document.getElementById('legs');
    const sections = [...document.querySelectorAll('.text section')];
    const has = (list, i) => list.split(',').includes(String(i));
    sections.forEach((s, i) => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + s.id;
      a.setAttribute('aria-label', (i + 1) + '번째 구간');
      a.appendChild(document.createElement('i'));
      li.appendChild(a);
      legs.appendChild(li);
    });
    let current = -1;
    function show(i) {
      if (i === current) return;
      current = i;
      if (caption) caption.textContent = sections[i].dataset.cap || '';
      [...legs.children].forEach((li, k) => { li.dataset.s = k < i ? 'past' : k === i ? 'now' : 'next'; });
      stage.querySelectorAll('[data-on]').forEach(n => n.classList.toggle('on', has(n.dataset.on, i)));
      stage.querySelectorAll('[data-hot]').forEach(n => n.classList.toggle('hot', has(n.dataset.hot, i)));
      if (o.onStep) o.onStep(i);
    }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) show(+e.target.dataset.step);
    }), { rootMargin: '-48% 0px -48% 0px' });
    sections.forEach(s => io.observe(s));
    show(0);
  };
})();
