(function () {
  'use strict';

  var promptField = document.getElementById('claude-prompt');
  if (!promptField) return;

  function track(event, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({
      event: event,
      resource_id: 'auditoria-tienda-claude'
    }, details));
  }

  var fallbackLink = document.querySelector('[data-prompt-fallback]');
  document.querySelectorAll('[data-copy-prompt]').forEach(function (button) {
    var placement = button.dataset.copyPrompt;
    var status = document.querySelector('[data-copy-feedback="' + placement + '"]');
    var label = button.textContent;
    var reset;

    button.addEventListener('click', async function () {
      clearTimeout(reset);
      button.textContent = label;
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(promptField.value);
        button.textContent = 'Copiado';
        status.textContent = 'Prompt copiado al portapapeles.';
        reset = setTimeout(function () {
          button.textContent = label;
          status.textContent = '';
        }, 2400);
        track('resource_copy_prompt', { placement: placement });
      } catch (error) {
        promptField.focus();
        promptField.select();
        var manualStatus = document.querySelector('[data-copy-feedback="bloque"]');
        manualStatus.textContent = 'El navegador no pudo copiar el prompt. Seleccioná y copiá el texto desde este bloque.';
      }
    });
    button.hidden = false;
  });
  if (fallbackLink) fallbackLink.hidden = true;

  document.querySelector('[data-diagnosis-cta]').addEventListener('click', function () {
    track('resource_cta', { cta_id: 'diagnostico_inicial', source: 'guia-auditoria-claude' });
  });
})();
