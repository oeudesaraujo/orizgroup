import * as THREE from 'three';
import { SVGLoader } from './vendor/SVGLoader.js';

const stage=document.querySelector('.brand-stage');
const canvas=document.querySelector('#brand-canvas');
const toggle=document.querySelector('.motion-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,100);
  camera.position.set(0,0,8.2);
  const sculpture=new THREE.Group();scene.add(sculpture);
  scene.add(new THREE.HemisphereLight(0xfff4e6,0x633022,2.1));
  function light(color,intensity,x,y,z){const lamp=new THREE.DirectionalLight(color,intensity);lamp.position.set(x,y,z);scene.add(lamp);}
  light(0xfff4df,4,-3,5,6);light(0xffffff,3,4,1,-3);light(0xff722e,1.3,-4,-2,2);
  const response=await fetch('./icone-oriz.svg');
  if(!response.ok)throw new Error('SVG unavailable');
  const paths=new SVGLoader().parse(await response.text()).paths;
  const material=new THREE.MeshPhysicalMaterial({color:0xff5a1f,metalness:.3,roughness:.28,clearcoat:.85,clearcoatRoughness:.22});
  paths.forEach(path=>SVGLoader.createShapes(path).forEach(shape=>{
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:220,bevelEnabled:true,bevelThickness:9,bevelSize:7,bevelSegments:5,curveSegments:48,steps:1});
    geometry.translate(-387.5,-415.5,-110);geometry.rotateX(Math.PI);geometry.scale(.004,.004,.004);
    geometry.computeVertexNormals();
    sculpture.add(new THREE.Mesh(geometry,material));
  }));
  let visible=true,paused=reduced.matches,frame=0,phase=0,last=0,pointerX=0,pointerY=0;
  sculpture.rotation.set(.12,-.48,-.09);
  function resize(){const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();renderStill();}
  function renderStill(){renderer.render(scene,camera);}
  function tick(now){frame=0;if(!visible||document.hidden)return;const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;
    if(!paused){phase+=elapsed;const progress=Number(document.querySelector('.hero').style.getPropertyValue('--scroll'))||0;
      const y=-.65+Math.sin(phase*.42)*.22+pointerX*.25+progress*.4;
      const x=.13+Math.sin(phase*.3)*.035+pointerY*.13;
      sculpture.rotation.y+=(y-sculpture.rotation.y)*.045;
      sculpture.rotation.x+=(x-sculpture.rotation.x)*.045;
      sculpture.rotation.z=-.09+Math.sin(phase*.28)*.035;
      sculpture.position.y=Math.sin(phase*.6)*.065;
    }
    renderStill();if(!paused)frame=requestAnimationFrame(tick);
  }
  function resume(){last=0;if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  function syncToggle(){toggle.textContent=paused?'Ativar movimento':'Pausar movimento';toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Ativar movimento do símbolo':'Pausar movimento do símbolo');}
  toggle.addEventListener('click',()=>{paused=!paused;syncToggle();resume();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncToggle();resume();});
  stage.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const r=stage.getBoundingClientRect();pointerX=(event.clientX-r.left)/r.width-.5;pointerY=(event.clientY-r.top)/r.height-.5;});
  stage.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)resume();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'80px'}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else resume();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);stage.classList.remove('is-ready');toggle.hidden=true;});
  syncToggle();resize();stage.classList.add('is-ready');resume();
} catch(error) {
  stage.classList.add('is-fallback');toggle.hidden=true;renderer?.dispose();
  console.warn('Oriz: símbolo estático disponível; renderização 3D indisponível.',error.message);
}
