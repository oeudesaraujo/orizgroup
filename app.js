const stages = [ ['ENTENDER ANTES DE AGIR','Entramos no contexto do negócio, do mercado e das pessoas. Definimos prioridades e uma direção clara antes de escolher canais ou formatos.'], ['DAR FORMA À DIREÇÃO','Transformamos a estratégia em mensagens, identidade e experiências. Cada escolha criativa tem uma função na relação entre sua marca e as pessoas.'], ['ENCONTRAR AS PESSOAS CERTAS','Levamos a mensagem aos canais que fazem sentido para o negócio. Conectamos conteúdo, mídia e jornada para criar oportunidades de contato.'], ['TRANSFORMAR SINAIS EM CLAREZA','Organizamos a mensuração e acompanhamos o comportamento das pessoas. Lemos os dados no contexto dos objetivos, além das métricas isoladas.'], ['APRENDER. AJUSTAR. EVOLUIR.','Usamos os aprendizados para ajustar campanhas, experiências e prioridades. O fim de um ciclo alimenta a estratégia do próximo movimento.'] ];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-step]').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed','false'); }); button.classList.add('active'); button.setAttribute('aria-pressed','true'); const stage = stages[Number(button.dataset.step)]; document.querySelector('#step-number').textContent=stage[0]; document.querySelector('#step-copy').textContent=stage[1]; }));
const services = { performance: ['Performance','Conectamos mídia, mensagem e intenção para criar oportunidades de negócio.','Planejamento de mídia e definição de objetivos','Campanhas em Google Ads e Meta Ads','Acompanhamento e otimização contínua'], digital: ['Digital','Construímos uma base digital clara, acessível e conectada à jornada do seu público.','Sites institucionais e landing pages','SEO técnico e presença nas buscas locais','Tracking, mensuração e integrações'], marca: ['Marca','Damos clareza ao que sua marca representa e consistência à forma como ela se apresenta.','Posicionamento e estratégia de marca','Identidade visual e sistemas de comunicação','Direção criativa para os pontos de contato'] };
const dialog=document.querySelector('#detail-dialog');
function openDialog(label,title,content){document.querySelector('#dialog-label').textContent=label;document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-content').innerHTML=content;dialog.showModal();}
document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click',()=>{const [title,description,...items]=services[button.dataset.service];openDialog('CAPACIDADES / ORIZ',title,`<p>${description}</p><ul>${items.map(item=>`<li>${item}</li>`).join('')}</ul><a href="#contato" class="button dark" id="dialog-contact">Vamos conversar <span>↗</span></a>`);document.querySelector('#dialog-contact').addEventListener('click',()=>dialog.close());}));
document.querySelector('#contact-open')?.addEventListener('click',()=>openDialog('CONTATO / PRÉVIA V1','Uma conversa abre caminhos.','<p>Este espaço está pronto para receber o WhatsApp e o e-mail oficiais da Oriz.</p><p>Os canais de contato serão conectados após a revisão desta primeira versão.</p>'));
document.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.querySelector('#year').textContent=new Date().getFullYear();
// Scroll-linked choreography: one scheduled frame, only in-view surfaces.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motionSections = [...document.querySelectorAll('.hero,.manifesto,.capabilities,.method,.differences,.about,.contact')];
const manifestoHeading = document.querySelector('.manifesto h2');
if (manifestoHeading) {
  const walker = document.createTreeWalker(manifestoHeading, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => { const fragment=document.createDocumentFragment(); node.textContent.split(/(\s+)/).forEach(word => { if(!word.trim()) fragment.append(document.createTextNode(word)); else {const span=document.createElement('span');span.className='manifesto-word';span.textContent=word;fragment.append(span);} });node.replaceWith(fragment); });
}
const words = [...document.querySelectorAll('.manifesto-word')];
const clamp = value => Math.max(0, Math.min(1, value));
let scheduled = false;
function updateScrollMotion() {
  scheduled=false;
  if(motionPreference.matches) {document.documentElement.classList.remove('scroll-motion');return;}
  document.documentElement.classList.add('scroll-motion');
  const height=innerHeight;
  motionSections.forEach(section => {
    const rect=section.getBoundingClientRect();
    if(rect.bottom < -height*.3 || rect.top > height*1.3) return;
    const progress=clamp((height-rect.top)/(height+rect.height));
    section.style.setProperty('--scroll',progress.toFixed(4));
    section.style.setProperty('--travel',`${((progress-.5)*70).toFixed(2)}px`);
    section.style.setProperty('--turn',`${((progress-.5)*55).toFixed(2)}deg`);
    section.style.setProperty('--draw',clamp((height-rect.top)/(height*.85)).toFixed(4));
    if(section.classList.contains('manifesto')) {
      const reading=clamp((height*.8-rect.top)/Math.max(1,rect.height*.8));
      words.forEach((word,index)=>word.style.setProperty('--word-opacity',(.2+.8*clamp(reading*words.length-index)).toFixed(3)));
    }
    if(section.classList.contains('method'))section.style.setProperty('--method-progress',clamp((height*.75-rect.top)/(rect.height*.85)).toFixed(4));
  });
}
function scheduleMotion(){if(!scheduled){scheduled=true;requestAnimationFrame(updateScrollMotion);}}
addEventListener('scroll',scheduleMotion,{passive:true});addEventListener('resize',scheduleMotion);motionPreference.addEventListener('change',scheduleMotion);
updateScrollMotion();
