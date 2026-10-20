(function(){
  "use strict";
  var resources = (window.POTENCIAR_RESOURCES || []).filter(function(item){return item.status === "published";});
  var categories = ["Lo probamos por vos","Prompts","Checklists","Plantillas","Herramientas","Guías","Comparativas"];
  var list = document.querySelector("[data-resource-list]");
  var filters = document.querySelector("[data-resource-filters]");
  var count = document.querySelector("[data-resource-count]");
  var experiment = document.querySelector("[data-experiment-feature]");
  if(!list || !filters || !count) return;
  var selected = "Todos";
  var labels = {checklist:"Checklist",guide:"Guía",tool:"Herramienta",template:"Plantilla",prompt:"Prompt",comparison:"Comparativa",experiment:"Prueba"};
  function emit(event, item, extra){
    window.dataLayer = window.dataLayer || [];
    var payload = {event:event};
    if(item){payload.resource_id=item.id;payload.resource_category=item.category;payload.resource_format=item.format;payload.access_type=item.accessType;payload.growth_goal=item.growthGoal;}
    if(extra) Object.keys(extra).forEach(function(key){payload[key]=extra[key];});
    window.dataLayer.push(payload);
  }
  function card(item){
    var a=document.createElement("a"); a.className="resource"; a.href=item.url;
    a.dataset.resourceId=item.id; a.dataset.resourceCategory=item.category;
    var no=document.createElement("span"); no.className="resource-no"; no.textContent=labels[item.format]||"Recurso";
    var title=document.createElement("h3"); title.textContent=item.title;
    var summary=document.createElement("p"); summary.textContent=item.summary;
    var arrow=document.createElement("span"); arrow.className="resource-arrow"; arrow.setAttribute("aria-hidden","true"); arrow.textContent="↗";
    a.append(no,title,summary,arrow);
    return a;
  }
  function render(){
    var featuredSection=document.querySelector("[data-featured-resource]");
    if(featuredSection) featuredSection.hidden=selected!=="Todos";
    var visible=resources.filter(function(item){return selected==="Todos"? !item.featured : item.category===selected;});
    list.replaceChildren();
    visible.forEach(function(item){list.appendChild(card(item));});
    count.textContent=visible.length+" "+(visible.length===1?"recurso":"recursos");
    filters.querySelectorAll("button").forEach(function(button){button.setAttribute("aria-pressed",String(button.dataset.category===selected));});
    var latest=resources.filter(function(item){return item.category==="Lo probamos por vos"&&item.experiment;})[0];
    if(experiment) {
      experiment.hidden=!latest;
      if(latest){
        experiment.querySelector("[data-experiment-title]").textContent=latest.experiment.tool;
        experiment.querySelector("[data-experiment-copy]").textContent=latest.summary;
        experiment.querySelector("[data-experiment-link]").href=latest.url;
        experiment.querySelector("[data-experiment-link]").dataset.experimentId=latest.id;
      }
    }
  }
  var present=categories.filter(function(category){return resources.some(function(item){return item.category===category;});});
  filters.hidden=false;
  ["Todos"].concat(present).forEach(function(category){
    var button=document.createElement("button"); button.type="button"; button.className="resource-filter";
    button.textContent=category; button.dataset.category=category; button.setAttribute("aria-pressed",String(category==="Todos"));
    button.addEventListener("click",function(){selected=category;render();emit("resource_filter",null,{resource_category:category});});
    filters.appendChild(button);
  });
  list.replaceChildren();
  render();
  document.addEventListener("click",function(e){
    var link=e.target.closest("a"); if(!link)return;
    var item=resources.find(function(resource){return resource.id===link.dataset.resourceId;});
    if(item){
      emit(item.format==="experiment"?"experiment_open":(item.format==="download"?"resource_download":"resource_open"),item);
      return;
    }
    if(link.matches("[data-social-follow]")){emit("social_follow",null,{social_network:"instagram"});return;}
    if(link.matches("[data-resource-cta]")){emit("resource_cta",null,{cta_id:link.dataset.ctaId||"resources_cta"});return;}
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push({event:"resource_click",resource_path:link.getAttribute("href"),page_path:location.pathname});
  });
})();