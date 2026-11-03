(function (root) {
  'use strict';
  function swap(order, from, to) {
    const result = order.slice();
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= result.length || to >= result.length) return result;
    [result[from], result[to]] = [result[to], result[from]];
    return result;
  }
  function validOrder(order, ids) {
    return Array.isArray(order) && order.length === ids.length && new Set(order).size === ids.length && order.every(id => ids.includes(id));
  }
  function checkRows(order, works) {
    if (!validOrder(order, works.map(work => work.id))) return [null, null, null, null];
    const byId = new Map(works.map(work => [work.id, work.eligibleGroups || [work.group]]));
    return Array.from({length: 4}, (_, row) => {
      const candidates = order.slice(row * 4, row * 4 + 4).map(id => byId.get(id));
      return candidates[0].find(group => candidates.every(groups => groups.includes(group))) ?? null;
    });
  }
  function isComplete(order, works) {
    const matches = checkRows(order, works);
    return matches.every(group => group !== null) && new Set(matches).size === 4;
  }
  function nextHintCount(current, total) {
    const count = Number.isInteger(current) && current >= 0 ? current : 0;
    return Math.min(count + 1, total);
  }
  const model = { swap, validOrder, checkRows, isComplete, nextHintCount };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.BoardModel = model;
})(typeof window !== 'undefined' ? window : globalThis);
