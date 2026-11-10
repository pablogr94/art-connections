(() => {
  'use strict';
  const studies = Object.freeze([
    Object.freeze({id: '1', label: 'Estudio 1'}),
    Object.freeze({id: '2', label: 'Estudio 2'}),
    Object.freeze({id: '3', label: 'Estudio 3'}),
    Object.freeze({id: '4', label: 'Estudio 4'}),
    Object.freeze({id: '5', label: 'Estudio 5'}),
    Object.freeze({id: '6', label: 'Estudio 6'}),
    Object.freeze({id: '7', label: 'Estudio 7'})
  ]);
  function selectStudy(search) {
    const id = new URLSearchParams(search).get('study');
    return studies.find(study => study.id === id) || studies[0];
  }
  globalThis.StudyRegistry = Object.freeze({studies, selectStudy});
})();
