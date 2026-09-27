(() => {
const trigger=document.querySelector('.menu-toggle');
const menu=document.querySelector('.fullscreen-menu');
const closeButton=menu.querySelector('.menu-close');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let closing=false,closeTimer,previousOverflow='';
menu.querySelectorAll('nav a').forEach((link,i)=>link.style.setProperty('--link-order',i));
// Per-character variable font proximity, equivalent to the supplied React effect.
const characters=[];
menu.querySelectorAll('nav a').forEach(link=>{
  const label=[...link.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim().toLocaleUpperCase('pt-BR');
  link.setAttribute('aria-label',label);
  const text=document.createElement('span');text.className='proximity-text';text.setAttribute('aria-hidden','true');
  [...label].forEach(character=>{const span=document.createElement('span');span.className='proximity-letter';span.textContent=character===' '?'\u00a0':character;text.append(span);characters.push(span);});
  [...link.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.remove());link.prepend(text);
});
let proximityFrame=0,cursor=null;
function measureLetters(){characters.forEach(letter=>{letter.style.width='';letter.style.fontVariationSettings='"wght" 400, "slnt" 0';});const widths=characters.map(letter=>letter.getBoundingClientRect().width);characters.forEach((letter,i)=>{if(widths[i])letter.style.width=`${widths[i]}px`;});}
document.fonts.ready.then(measureLetters);new ResizeObserver(()=>{if(menu.open)measureLetters();}).observe(menu.querySelector('nav'));
function updateProximity(){proximityFrame=0;if(!menu.open||reduced.matches)return;
  const positions=characters.map(letter=>letter.getBoundingClientRect());
  characters.forEach((letter,index)=>{const r=positions[index];const distance=cursor?Math.hypot(cursor.x-r.left-r.width/2,cursor.y-r.top-r.height/2):200;const strength=Math.max(0,1-distance/200);letter.style.fontVariationSettings=`"wght" ${400+strength*500}, "slnt" ${-10*strength}`;});
}
menu.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced.matches)return;cursor={x:event.clientX,y:event.clientY};if(!proximityFrame)proximityFrame=requestAnimationFrame(updateProximity);});
function resetProximity(){cursor=null;cancelAnimationFrame(proximityFrame);proximityFrame=0;characters.forEach(letter=>letter.style.fontVariationSettings='"wght" 400, "slnt" 0');}
menu.addEventListener('pointerleave',resetProximity);menu.addEventListener('close',resetProximity);reduced.addEventListener('change',resetProximity);
function openMenu(){if(menu.open)return;clearTimeout(closeTimer);closing=false;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';menu.classList.remove('is-closing');menu.showModal();trigger.setAttribute('aria-expanded','true');closeButton.focus({preventScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>menu.classList.add('is-open')));}
function finishClose(){menu.close();menu.classList.remove('is-closing');document.body.style.overflow=previousOverflow;trigger.setAttribute('aria-expanded','false');closing=false;trigger.focus({preventScroll:true});}
function closeMenu(after){if(!menu.open||closing)return;closing=true;menu.classList.add('is-closing');menu.classList.remove('is-open');clearTrail();closeTimer=setTimeout(()=>{finishClose();after?.();},reduced.matches?0:720);}
trigger.addEventListener('click',openMenu);closeButton.addEventListener('click',()=>closeMenu());menu.addEventListener('cancel',event=>{event.preventDefault();closeMenu();});
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const href=link.getAttribute('href');closeMenu(()=>{if(href.startsWith('#')){const target=href==='#'?document.querySelector('.header'):document.querySelector(href);history.pushState(null,'',href);target?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});}}else location.href=href;});}));
// Original 5×7 pixel lettering, kept sharp at every display size.
const letters={O:['01110','11011','11011','11011','11011','11011','01110'],R:['11110','11011','11011','11110','11100','11010','11011'],I:['11111','00100','00100','00100','00100','00100','11111'],Z:['11111','00011','00110','01100','11000','11000','11111']};
const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 23 7');svg.setAttribute('aria-hidden','true');
[...'ORIZ'].forEach((letter,index)=>letters[letter].forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1'){const rect=document.createElementNS(svg.namespaceURI,'rect');rect.setAttribute('x',index*6+x);rect.setAttribute('y',y);rect.setAttribute('width','1');rect.setAttribute('height','1');svg.append(rect);}})));menu.querySelector('.pixel-word').append(svg);
// Equivalent to the supplied PixelTrail: grid-snapped pixels fading independently.
const canvas=menu.querySelector('.pixel-trail'),context=canvas.getContext('2d');
const pixels=new Map(),pixelSize=20,fadeDuration=650,delay=30;let frame=0,width=0,height=0,lastCell=null;
function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context?.setTransform(dpr,0,0,dpr,0,0);pixels.clear();}
new ResizeObserver(resize).observe(canvas);
function draw(now){frame=0;if(!context)return;context.clearRect(0,0,width,height);for(const [key,pixel] of pixels){const life=(now-pixel.time-delay)/fadeDuration;if(life>=1){pixels.delete(key);continue;}context.fillStyle=`rgba(255,239,215,${.75*(1-Math.max(0,life))})`;context.fillRect(pixel.x*pixelSize,pixel.y*pixelSize,pixelSize,pixelSize);}if(pixels.size&&menu.open&&!document.hidden)frame=requestAnimationFrame(draw);}
function stamp(x,y,time){pixels.set(`${x},${y}`,{x,y,time});}
canvas.addEventListener('pointermove',event=>{if(reduced.matches||closing||event.pointerType==='touch')return;const rect=canvas.getBoundingClientRect();const x=Math.floor((event.clientX-rect.left)/pixelSize),y=Math.floor((event.clientY-rect.top)/pixelSize);const now=performance.now();if(lastCell){const dx=x-lastCell.x,dy=y-lastCell.y,steps=Math.max(Math.abs(dx),Math.abs(dy));for(let i=0;i<=steps;i++)stamp(Math.round(lastCell.x+dx*i/(steps||1)),Math.round(lastCell.y+dy*i/(steps||1)),now);}else stamp(x,y,now);lastCell={x,y};if(!frame)frame=requestAnimationFrame(draw);});canvas.addEventListener('pointerleave',()=>{lastCell=null;});
function clearTrail(){cancelAnimationFrame(frame);frame=0;pixels.clear();lastCell=null;context?.clearRect(0,0,width,height);}
reduced.addEventListener('change',clearTrail);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTrail();});
})();
