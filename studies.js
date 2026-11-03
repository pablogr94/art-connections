(() => {
  'use strict';
  const studies = Object.freeze([
    Object.freeze({id: '1', label: 'Estudio 1'}),
    Object.freeze({id: '2', label: 'Estudio 2'}),
    Object.freeze({id: '3', label: 'Estudio 3'})
  ]);
  function selectStudy(search) {
    const id = new URLSearchParams(search).get('study');
    return studies.find(study => study.id === id) || studies[0];
  }
  globalThis.StudyRegistry = Object.freeze({studies, selectStudy});
})();
