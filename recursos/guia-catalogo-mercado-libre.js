(function () {
  'use strict';
  var checks = document.querySelectorAll('[data-master-check]');
  var progress = document.querySelector('[data-review-progress]');
  var status = document.querySelector('[data-review-status]');
  var hint = document.querySelector('[data-state-hint]');
  function track(event) {
    window.dataLayer = window.dataLayer || [];
    // Deliberately exclude field IDs, answers, selected state and completion count.
    window.dataLayer.push({event:event, resource_id:'guia-catalogo-mercado-libre', resource_category:'Guías', resource_format:'guide'});
  }
  function updateProgress() {
    var count = Array.from(checks).filter(function (input) { return input.checked; }).length;
    if (progress) { progress.max = checks.length; progress.value = count; }
    if (status) status.textContent = count + ' de ' + checks.length + ' preguntas revisadas';
  }
  document.addEventListener('change', function (event) {
    var input = event.target;
    if (input.type !== 'checkbox' && input.type !== 'radio') return;
    if (input.matches('[data-master-check]')) updateProgress();
    if (hint && input.name === 'competition-state') {
      hint.textContent = input.value === 'unknown'
        ? 'Ese es el primer dato que tenés que buscar. Revisá el estado en el detalle de tu publicación antes de hacer cambios.'
        : 'Tomá este estado como punto de partida. Compará tus condiciones y revisá las recomendaciones de Mercado Libre.';
    }
    track('resource_checklist_interaction');
  });
  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-guide-action]');
    if (!link) return;
    var events = {start_review:'resource_start_review', quick_checklist:'resource_quick_checklist', final_cta:'resource_cta', more_resources:'resource_more_resources'};
    if (events[link.dataset.guideAction]) track(events[link.dataset.guideAction]);
  });
  updateProgress();
  track('resource_view');
})();
