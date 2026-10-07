/* Approximate municipal locations; institutional addresses verified 2026-10-07. */
(()=>{
'use strict';
const campuses=[
 {name:'São Carlos',municipality:'São Carlos',lat:-22.017,lon:-47.890,address:'Rodovia Washington Luís, km 235 · SP-310'},
 {name:'Araras',municipality:'Araras',lat:-22.357,lon:-47.384,address:'Rodovia Anhanguera, km 174 · SP-330'},
 {name:'Sorocaba',municipality:'Sorocaba',lat:-23.501,lon:-47.458,address:'Rodovia João Leme dos Santos, km 110 · SP-264 · Itinga'},
 {name:'Lagoa do Sino',municipality:'Buri',lat:-23.798,lon:-48.594,address:'Rodovia Lauri Simões de Barros, km 12 · SP-189 · Aracaçu'},
 {name:'São José do Rio Preto',municipality:'São José do Rio Preto',lat:-20.811,lon:-49.376,address:'Rua Dr. Eduardo Nielsen, 420 · Jardim Congonhas'}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let map,markers=[],observer,lastScope='',selected='',latest;
function details(c){const rows=latest.series.filter(s=>s.area==='infraestrutura'&&s.scope===c.name&&s.points.some(p=>p.year===latest.year));
 document.getElementById('campus-map-detail').innerHTML=`<h3>${esc(c.name)}</h3><p>${esc(c.address)} · ${esc(c.municipality)} / SP</p><p>${rows.length?rows.length+' indicadores de infraestrutura com valores qualificados em '+latest.year+'. Selecione o campus para explorar os gráficos.':'Sem indicador anual de infraestrutura qualificado para este campus em '+latest.year+'.'}</p>`;
}
function highlight(){markers.forEach(({campus,marker})=>marker.setStyle({color:campus.name===selected?'#cb902c':'#166184',fillColor:campus.name===selected?'#dfad48':'#166184',radius:campus.name===selected?13:9}));document.querySelectorAll('[data-campus-map]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.campusMap===selected)));}
function pick(c){selected=c.name;details(c);highlight();if(latest.series.some(s=>s.area==='infraestrutura'&&s.scope===c.name))latest.onSelect(c.name);}
function fallback(){const X=lon=>70+(lon+49.6)/2.6*640,Y=lat=>50+(-lat-20.5)/3.8*340;
 document.getElementById('campus-geography').innerHTML='<svg viewBox="0 0 800 470" role="img" aria-label="Distribuição espacial aproximada dos cinco campi"><rect width="800" height="470" rx="12" fill="var(--surface-2)"/><text x="35" y="32" class="chart-label">SÃO PAULO · LOCALIZAÇÃO APROXIMADA DOS MUNICÍPIOS</text>'+campuses.map(c=>`<g><circle cx="${X(c.lon)}" cy="${Y(c.lat)}" r="10" fill="var(--blue)"/><text x="${X(c.lon)+15}" y="${Y(c.lat)+5}" class="chart-label">${esc(c.name)}</text></g>`).join('')+'</svg>';
}
function render(options){latest=options;const section=document.getElementById('infrastructure-geography');section.hidden=!options.visible;if(!options.visible)return;
 if(options.scope!==lastScope){selected=options.scope;lastScope=options.scope;}
 if(!document.getElementById('campus-geography')){
 section.innerHTML=`<article class="dash-panel geography-panel"><div class="figure-top"><span>DISTRIBUIÇÃO ESPACIAL DOS CAMPI</span><button class="secondary" id="campus-map-reset">Mostrar todos os campi</button></div><h2 class="section-title">UFSCar no estado de São Paulo</h2><p class="chart-subtitle">5 campi · selecione um marcador ou um campus para detalhar</p><div class="geography-layout"><div id="campus-geography" aria-label="Mapa da distribuição dos campi da UFSCar"></div><div class="campus-map-sidebar"><div class="campus-map-list">${campuses.map(c=>`<button class="campus-map-card" data-campus-map="${esc(c.name)}" aria-pressed="false"><strong>${esc(c.name)}</strong><span>${esc(c.municipality)} / SP</span></button>`).join('')}</div><div id="campus-map-detail" class="campus-map-detail" aria-live="polite"><p>Selecione um campus para consultar o endereço e os indicadores disponíveis.</p></div></div></div><p class="scope-note">Marcadores indicam a localização aproximada dos municípios e não delimitam os terrenos. Localizações institucionais conferidas em 07/10/2026; os indicadores mantêm os anos de referência selecionados. Ausência de dados anuais não é tratada como zero.</p></article>`;
 document.querySelectorAll('[data-campus-map]').forEach(b=>b.onclick=()=>pick(campuses.find(c=>c.name===b.dataset.campusMap)));
 document.getElementById('campus-map-reset').onclick=()=>{selected='';detailsReset();highlight();if(map)map.fitBounds(campuses.map(c=>[c.lat,c.lon]),{padding:[35,35]});latest.onSelect('');};
 if(globalThis.L){
 map=L.map('campus-geography',{scrollWheelZoom:false}).fitBounds(campuses.map(c=>[c.lat,c.lon]),{padding:[35,35]});
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
 L.control.scale({imperial:false}).addTo(map);
 markers=campuses.map(c=>{const marker=L.circleMarker([c.lat,c.lon],{radius:9,color:'#166184',fillColor:'#166184',fillOpacity:.85,weight:3}).addTo(map).bindTooltip(esc(c.name),{permanent:true,direction:'top',className:'campus-map-label'}).bindPopup(`<strong>${esc(c.name)}</strong><br>${esc(c.address)}<br>${esc(c.municipality)} / SP`);marker.on('click',()=>pick(c));return {campus:c,marker};});
 if(globalThis.ResizeObserver){observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(document.getElementById('campus-geography'));}
 }else fallback();
 }
 if(selected){const c=campuses.find(c=>c.name===selected);if(c)details(c);}else detailsReset();highlight();if(map)map.invalidateSize();
}
function detailsReset(){document.getElementById('campus-map-detail').innerHTML='<p>Selecione um campus para consultar o endereço e os indicadores disponíveis.</p>';}
globalThis.CampusMap={render};
})();
