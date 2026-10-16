'use strict';
const C=PianoCore,$=id=>document.getElementById(id);
let context=null,master=null,compressor=null,epoch=0;
const pressed=new Map(),keyEls={equal:[],power:[]};
const hz=f=>f.toLocaleString('fr-FR',{maximumFractionDigits:3})+' Hz';
function noteName(type,i){return type==='equal'?C.eqName(i+21):(i%8===0?'Do':'Degré '+(i%8+1));}
async function ensureAudio(){
 if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Ce navigateur ne prend pas en charge le son Web Audio.');context=new Audio();master=context.createGain();compressor=context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=8;master.connect(compressor);compressor.connect(context.destination);volume();}
 await context.resume();
}
function volume(){if(master)master.gain.setTargetAtTime(Number($('volume').value)/100*.38,context.currentTime,.02);}
function end(id){const v=pressed.get(id);if(!v)return;pressed.delete(id);v.key.classList.remove('active');if(v.osc){const t=context.currentTime;v.gain.gain.cancelScheduledValues(t);v.gain.gain.setTargetAtTime(0,t,.025);v.osc.stop(t+.2);}}
function stop(){epoch++;for(const id of [...pressed.keys()])end(id);$('status').textContent='Sons coupés. Clique sur une touche pour reprendre.';}
async function begin(type,i,id,key){
 end(id);const marker={key,osc:null};pressed.set(id,marker);const version=epoch;
 try{await ensureAudio();if(version!==epoch||pressed.get(id)!==marker)return;
  const f=(type==='equal'?C.eq:C.power)[i],osc=context.createOscillator(),gain=context.createGain();
  const harmonics=$('timbre').value==='soft'?[0,1,.12,.035]:[0,1,.45,.22,.1,.055,.025];
  osc.setPeriodicWave(context.createPeriodicWave(new Float32Array(harmonics.length),new Float32Array(harmonics)));osc.frequency.value=f;
  const t=context.currentTime;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.32,t+.018);gain.gain.exponentialRampToValueAtTime(.17,t+.4);
  osc.connect(gain);gain.connect(master);marker.osc=osc;marker.gain=gain;osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start();
  key.classList.add('active');for(const kind of ['equal','power'])$('panel-'+kind).classList.toggle('is-heard',kind===type);
  $('detail-'+type).textContent=noteName(type,i)+' — '+hz(f);$('status').textContent=(type==='equal'?'Tempérament égal':'Puissance 2')+' · '+noteName(type,i)+' · '+hz(f);$('error').textContent='';
 }catch(e){end(id);$('error').textContent=e.message;}
}
for(const type of ['equal','power']){
 const arr=type==='equal'?C.eq:C.power,host=$('keys-'+type);let white=0;
 arr.forEach((f,i)=>{const pc=(i+21)%12,black=type==='equal'?[1,3,6,8,10].includes(pc):i%8===0;
  const key=document.createElement('button');key.type='button';key.className='key'+(black?' black':'');key.setAttribute('aria-label',noteName(type,i)+', '+hz(f));key.title=noteName(type,i)+' — '+hz(f);key.style.touchAction='none';
  if(type==='equal'){key.style.width=(black?22:34)+'px';key.style.left=(black?white*34-11:white*34)+'px';if(!black)white++;}else{key.style.width='38px';key.style.left=i*38+'px';}
  const label=document.createElement('span');label.textContent=type==='equal'?(pc===0?C.eqName(i+21):''):(i%8===0?'Do':String(i%8+1));
  if(type==='power'&&i%8===0){const small=document.createElement('small');small.textContent=String(f);label.append(small);}key.append(label);
  key.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();key.setPointerCapture(e.pointerId);begin(type,i,'p'+e.pointerId,key);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])key.addEventListener(event,e=>end('p'+e.pointerId));
  key.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat){e.preventDefault();begin(type,i,'k'+type+i,key);}});
  key.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();end('k'+type+i);}});
  key.addEventListener('blur',()=>end('k'+type+i));
  key.addEventListener('click',e=>{if(e.detail===0&&!pressed.has('k'+type+i)){begin(type,i,'a'+type+i,key);setTimeout(()=>end('a'+type+i),650);}});
  key.addEventListener('focus',()=>{$('detail-'+type).textContent=noteName(type,i)+' — '+hz(f);});
  host.append(key);keyEls[type].push(key);
 });host.style.width=(type==='equal'?white*34:arr.length*38)+'px';
}
$('volume').oninput=volume;$('timbre').onchange=stop;$('stop').onclick=stop;
window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('panel-equal').classList.add('is-heard');
requestAnimationFrame(()=>{for(const [type,i]of [['equal',39],['power',24]]){const k=keyEls[type][i],s=$('scroll-'+type);s.scrollLeft=Math.max(0,k.offsetLeft-s.clientWidth/3);}});
