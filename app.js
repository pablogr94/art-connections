(() => {
  'use strict';
  const data = window.ART_BOARD;
  const model = window.BoardModel;
  const board = document.querySelector('#board');
  const status = document.querySelector('#status');
  const results = document.querySelector('#row-results');
  const undo = document.querySelector('#undo');
  const viewer = document.querySelector('#viewer');
  const byId = new Map(data.works.map(work => [work.id, work]));
  const ids = data.works.map(work => work.id);
  const key = data.id + ':order';
  const hintKey = data.id + ':hints';
  const hints = ['Un personaje', 'Una fuente de luz', 'Un recurso de perspectiva', 'Un movimiento'];
  let hintCount = 0;
  const initial = [0,5,10,15,8,13,2,7,4,1,14,11,12,9,6,3].map(i => ids[i]);
  let order = initial.slice();
  let history = [];
  let drag = null;
  let suppressClickUntil = 0;
  let viewerIndex = 0;
  let viewerInvoker = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (model.validOrder(saved, ids)) order = saved;
    const savedHints = JSON.parse(localStorage.getItem(hintKey));
    if (Number.isInteger(savedHints) && savedHints >= 0 && savedHints <= hints.length) hintCount = savedHints;
  } catch { /* Storage is optional, including when opened as a local file. */ }

  function persist() {
    try { localStorage.setItem(key, JSON.stringify(order)); } catch { /* Keep playing without storage. */ }
  }
  function renderHints() {
    const container = document.querySelector('#hints');
    container.replaceChildren();
    hints.slice(0, hintCount).forEach((text, index) => {
      const item = document.createElement('span');
      item.textContent = `${index + 1}. ${text}`;
      container.append(item);
    });
    const button = document.querySelector('#hint');
    button.textContent = hintCount === hints.length ? 'Todas las pistas reveladas · 4/4' : `Pedir pista · ${hintCount}/4`;
    button.disabled = hintCount === hints.length;
  }
  document.querySelector('#hint').addEventListener('click', () => {
    hintCount = model.nextHintCount(hintCount, hints.length);
    try { localStorage.setItem(hintKey, JSON.stringify(hintCount)); } catch { /* Clues still work without persistence. */ }
    renderHints();
  });
  function clearResults() {
    results.classList.remove('visible');
    results.replaceChildren();
  }
  function render() {
    board.replaceChildren();
    order.forEach((id, index) => {
      const work = byId.get(id);
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.dataset.index = index;
      tile.dataset.id = id;
      tile.setAttribute('aria-label', `Ampliar obra, fila ${Math.floor(index / 4) + 1}, columna ${index % 4 + 1}. Arrastra para intercambiar.`);
      const image = document.createElement('img');
      image.src = work.thumb;
      image.alt = '';
      image.draggable = false;
      image.addEventListener('error', () => { tile.setAttribute('aria-label', 'Imagen no disponible. Toca para consultar la ficha.'); }, {once: true});
      const number = document.createElement('span');
      number.className = 'number';
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      tile.append(image, number);
      board.append(tile);
    });
    undo.disabled = !history.length;
  }
  function change(next, message) {
    history.push(order.slice());
    if (history.length > 100) history.shift();
    order = next;
    clearResults();
    persist();
    render();
    status.textContent = message;
  }
  function focusTile(index) {
    board.querySelector(`[data-index="${index}"]`)?.focus({preventScroll: true});
  }
  function showArtwork(index) {
    viewerIndex = (index + order.length) % order.length;
    const work = byId.get(order[viewerIndex]);
    document.querySelector('#viewer-title').textContent = `Obra ${String(viewerIndex + 1).padStart(2, '0')} / 16`;
    const image = document.querySelector('#full-image');
    image.src = work.image;
    image.alt = `Vista completa de la obra ${viewerIndex + 1}`;
    document.querySelector('#art-details').open = false;
    document.querySelector('#art-title').textContent = work.title;
    document.querySelector('#art-source').href = work.source;
  }
  function openViewer(index) {
    viewerInvoker = index;
    showArtwork(index);
    document.body.classList.add('modal-open');
    viewer.showModal();
    document.querySelector('#close-viewer').focus();
  }
  function finishDrag(cancelled = false) {
    if (!drag) return;
    const state = drag;
    drag = null;
    state.ghost?.remove();
    state.tile.classList.remove('drag-source');
    board.querySelectorAll('.drop-target').forEach(tile => tile.classList.remove('drop-target'));
    document.body.style.cursor = '';
    if (state.tile.hasPointerCapture(state.pointerId)) state.tile.releasePointerCapture(state.pointerId);
    if (state.moved) {
      suppressClickUntil = performance.now() + 450;
      if (!cancelled && state.target !== null && state.target !== state.index) {
        change(model.swap(order, state.index, state.target), 'Obras intercambiadas. Puedes seguir ajustando las filas.');
        focusTile(state.target);
      }
    }
  }
  board.addEventListener('pointerdown', event => {
    const tile = event.target.closest('.tile');
    if (!tile || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    drag = {tile, index: Number(tile.dataset.index), pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false, target: null, ghost: null};
    tile.setPointerCapture(event.pointerId);
  });
  board.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      clearResults();
      drag.tile.classList.add('drag-source');
      const ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.width = drag.tile.getBoundingClientRect().width + 'px';
      ghost.append(drag.tile.querySelector('img').cloneNode());
      document.body.append(ghost);
      drag.ghost = ghost;
      document.body.style.cursor = 'grabbing';
    }
    drag.ghost.style.left = event.clientX + 'px';
    drag.ghost.style.top = event.clientY + 'px';
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.tile');
    drag.target = target && board.contains(target) ? Number(target.dataset.index) : null;
    board.querySelectorAll('.drop-target').forEach(tile => tile.classList.remove('drop-target'));
    if (target && drag.target !== drag.index) target.classList.add('drop-target');
    event.preventDefault();
  });
  board.addEventListener('pointerup', event => { if (drag?.pointerId === event.pointerId) finishDrag(); });
  board.addEventListener('pointercancel', () => finishDrag(true));
  window.addEventListener('blur', () => finishDrag(true));
  board.addEventListener('lostpointercapture', () => finishDrag(true));
  board.addEventListener('dragstart', event => event.preventDefault());
  board.addEventListener('contextmenu', event => event.preventDefault());
  board.addEventListener('click', event => {
    const tile = event.target.closest('.tile');
    if (!tile || performance.now() < suppressClickUntil) return;
    openViewer(Number(tile.dataset.index));
  });
  board.addEventListener('keydown', event => {
    const tile = event.target.closest('.tile');
    if (!tile) return;
    if (event.key === 'Escape') { finishDrag(true); return; }
    const index = Number(tile.dataset.index);
    const offsets = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4};
    if (!event.shiftKey || !(event.key in offsets)) return;
    event.preventDefault();
    const target = index + offsets[event.key];
    if (target < 0 || target >= 16 || (event.key === 'ArrowLeft' && index % 4 === 0) || (event.key === 'ArrowRight' && index % 4 === 3)) return;
    change(model.swap(order, index, target), 'Obras intercambiadas con el teclado.');
    focusTile(target);
  });
  document.querySelector('#close-viewer').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => { document.body.classList.remove('modal-open'); focusTile(viewerInvoker); });
  document.querySelector('#previous').addEventListener('click', () => showArtwork(viewerIndex - 1));
  document.querySelector('#next').addEventListener('click', () => showArtwork(viewerIndex + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showArtwork(viewerIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  document.querySelector('#shuffle').addEventListener('click', () => {
    const next = order.slice();
    for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; }
    change(next, 'Una nueva distribución. Las conexiones siguen siendo las mismas.');
  });
  undo.addEventListener('click', () => {
    if (!history.length) return;
    order = history.pop(); clearResults(); persist(); render();
    status.textContent = 'Último movimiento deshecho.';
  });
  function check() {
    const matches = model.checkRows(order, data.works);
    results.replaceChildren();
    matches.forEach(group => {
      const row = document.createElement('div');
      row.className = 'row-result' + (group === null ? '' : ' correct');
      if (group !== null) { const label = document.createElement('span'); label.className = 'row-label'; label.textContent = data.groups.find(g => g.id === group).label; row.append(label); }
      results.append(row);
    });
    results.classList.add('visible');
    const count = matches.filter(group => group !== null).length;
    status.textContent = count === 4 ? 'Las cuatro filas coinciden con la propuesta. ¿Las conexiones te convencen?' : `${count} de 4 filas coinciden con la propuesta. No hay penalización: sigue probando.`;
  }
  document.querySelector('#check').addEventListener('click', check);
  document.querySelector('#reveal').addEventListener('click', () => {
    change(data.works.map(work => work.id), 'Esta es la propuesta de investigación, no una solución validada.');
    check();
    status.textContent = 'Propuesta visible. Los grupos son provisionales; deshaz para volver a tu tablero.';
  });
  renderHints();
  render();
})();
