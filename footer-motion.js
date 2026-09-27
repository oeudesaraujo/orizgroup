(() => {
  const logo=document.querySelector('.footer-logo');
  if(!logo)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  logo.textContent='';
  const word=document.createElement('span');word.className='footer-variable-word';word.setAttribute('aria-hidden','true');
  const letters=[...'oriz'].map(character=>{const letter=document.createElement('span');letter.className='footer-variable-letter';letter.textContent=character;word.append(letter);return letter;});
  logo.append(word);
  let frame=0,pointer=null;
  function measure(){letters.forEach(letter=>{letter.style.width='';letter.style.fontVariationSettings='"wght" 400, "slnt" 0, "wdth" 151';});const widths=letters.map(letter=>letter.getBoundingClientRect().width);letters.forEach((letter,i)=>letter.style.width=`${widths[i]}px`);}
  document.fonts.ready.then(measure);new ResizeObserver(measure).observe(logo);
  function update(){frame=0;if(reduced.matches||!pointer)return;const boxes=letters.map(letter=>letter.getBoundingClientRect());letters.forEach((letter,i)=>{const r=boxes[i];const distance=Math.hypot(pointer.x-r.left-r.width/2,pointer.y-Math.min(r.top+r.height/2,logo.getBoundingClientRect().bottom-30));const proximity=Math.max(0,1-distance/350);letter.style.fontVariationSettings=`"wght" ${400+500*proximity}, "slnt" ${-10*proximity}, "wdth" 151`;});}
  function reset(){pointer=null;cancelAnimationFrame(frame);frame=0;letters.forEach(letter=>letter.style.fontVariationSettings='"wght" 400, "slnt" 0, "wdth" 151');}
  logo.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced.matches)return;pointer={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(update);});
  logo.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
})();
