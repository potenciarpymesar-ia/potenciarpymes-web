(function(){
  'use strict';
  // One request identity per unchanged payload, retained across uncertain retries.
  // Durable deduplication is the storage provider's responsibility, not this cache.
  window.ppCreateContactSubmitter = function(endpoint){
    var signature = '', requestId = '', pending = null;
    return function(payload){
      if (pending) return pending;
      var nextSignature = JSON.stringify(payload);
      if (nextSignature !== signature || !requestId) {
        signature = nextSignature;
        requestId = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'request-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
      }
      var controller = new AbortController();
      var timer = setTimeout(function(){controller.abort();}, 25000);
      pending = window.fetch(endpoint, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(Object.assign({}, payload, {requestId:requestId})), signal:controller.signal
      }).then(function(response){
        return response.json().then(function(data){
          var stored = data && data.stored === true && typeof data.leadId === 'string' && data.leadId.trim();
          var delivered = data && data.stored === false && data.delivery && data.delivery.status === 'accepted' && ['resend','n8n'].indexOf(data.delivery.provider) !== -1;
          if (!response.ok || !data || data.ok !== true || (!stored && !delivered)) {
            var error = new Error('Contact receipt not confirmed');
            error.code = data && data.error || 'contact_storage_unconfirmed';
            throw error;
          }
          requestId = '';
          return data;
        });
      }).finally(function(){clearTimeout(timer);pending = null;});
      return pending;
    };
  };
})();
