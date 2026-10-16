'use strict';
const C=PianoCore,$=id=>document.getElementById(id),types=['equal','power'];
const keyEls={equal:[],power:[]},pressed=new Map(),voices=new Set();
let context,master,epoch=0,lastManual=null,song=null,source='equal',target='equal',mode='original';
let converted=[],position=0,playing=false,clock=0,next=0,timer=null,playToken=0,frame=0,loadToken=0;
const hz=f=>f.toLocaleString('fr-FR',{maximumFractionDigits:3})+' Hz';
const scale=t=>t==='equal'?'Tempérament égal':'Harmoniques 8–16';
const frequencies=t=>t==='equal'?C.eq:C.power;
const noteName=(t,i)=>t==='equal'?C.eqName(i+21):(i%8===0?'Do':'Degré '+(i%8+1));
function heard(type){for(const t of types)$('panel-'+t).classList.toggle('is-heard',t===type);}
async function audio(){
 if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Ce navigateur ne prend pas en charge Web Audio.');context=new Audio();master=context.createGain();const compressor=context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=8;master.connect(compressor);compressor.connect(context.destination);volume();}
 await context.resume();
}
function volume(){if(master)master.gain.setTargetAtTime(Number($('volume').value)/100*.38,context.currentTime,.02);}
function sound(f,at,duration,velocity=1){
 if(voices.size>=160){$('error').textContent='Passage très dense : certaines voix sont omises (limite de 160 voix).';return null;}
 const osc=context.createOscillator(),gain=context.createGain();
 const harmonics=$('timbre').value==='soft'?[0,1,.12,.035]:[0,1,.45,.22,.1,.055,.025];
 osc.setPeriodicWave(context.createPeriodicWave(new Float32Array(harmonics.length),new Float32Array(harmonics)));osc.frequency.value=f;
 const amp=.32*velocity;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(amp,at+.012);gain.gain.setTargetAtTime(amp*.53,at+.018,.25);
 if(duration!==null)gain.gain.setTargetAtTime(0,at+duration,.025);
 osc.connect(gain);gain.connect(master);const v={osc,gain};voices.add(v);
 osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(v);};osc.start(at);if(duration!==null)osc.stop(at+duration+.2);return v;
}
function release(v){if(!v)return;const t=context.currentTime;try{v.gain.gain.cancelScheduledValues(t);v.gain.gain.setTargetAtTime(0,t,.015);v.osc.stop(t+.12);}catch{}voices.delete(v);}
function end(id){const v=pressed.get(id);if(!v)return;pressed.delete(id);release(v.voice);if(![...pressed.values()].some(n=>n.key===v.key))v.key.classList.remove('active');}
function endManual(){epoch++;for(const id of [...pressed.keys()])end(id);}
function clearKeys(){for(const t of types)for(const k of keyEls[t])k.classList.remove('active');}
function clearBlue(){for(const t of types){$('panel-'+t).classList.remove('has-comparison');for(const k of keyEls[t]){k.classList.remove('corresponding');k.style.removeProperty('--blue');}}}
function follow(type,indices){
 const keys=indices.map(i=>keyEls[type][i]).filter(Boolean);if(!keys.length)return;
 const s=$('scroll-'+type),left=Math.min(...keys.map(k=>k.offsetLeft)),right=Math.max(...keys.map(k=>k.offsetLeft+k.offsetWidth));
 if(left<s.scrollLeft+12||right>s.scrollLeft+s.clientWidth-12){const center=(left+right)/2;s.scrollLeft=Math.max(0,center-s.clientWidth/2);}
}
function blue(from,list,scroll=true){
 clearBlue();if(!$('compare').checked){$('comparison').textContent='Correspondances bleues désactivées.';return;}
 const to=from==='equal'?'power':'equal',arr=frequencies(to),weights=new Map();let outside=0;
 for(const f of list){const pair=C.bracket(f,arr);if(!pair.length)outside++;for(const b of pair)weights.set(b.index,Math.max(weights.get(b.index)||0,b.weight));}
 for(const [i,w]of weights){const k=keyEls[to][i];k.classList.add('corresponding');k.style.setProperty('--blue',w.toFixed(5));}
 $('panel-'+to).classList.toggle('has-comparison',weights.size>0);
 if(scroll&&weights.size)follow(to,[...weights.keys()]);
 if(list.length===1){const pair=C.bracket(list[0],arr);$('comparison').textContent=pair.length?scale(to)+' : '+pair.map(b=>noteName(to,b.index)+' · '+hz(arr[b.index])+' · bleu '+Math.round(b.weight*100)+' %').join(' / '):'Cette hauteur est hors de l’étendue de l’autre clavier.';}
 else $('comparison').textContent=weights.size+' touches de correspondance silencieuses'+(outside?' · '+outside+' hauteurs hors de l’autre clavier':'')+'.';
}
async function begin(type,i,id,key){
 pauseMidi();end(id);const marker={key,voice:null};pressed.set(id,marker);const version=epoch;
 const f=frequencies(type)[i];lastManual={type,f};heard(type);blue(type,[f]);follow(type,[i]);
 $('detail-'+type).textContent=noteName(type,i)+' — '+hz(f);$('status').textContent=scale(type)+' · '+noteName(type,i)+' · '+hz(f);
 try{await audio();if(version!==epoch||pressed.get(id)!==marker)return;marker.voice=sound(f,context.currentTime,null);key.classList.add('active');$('error').textContent='';}catch(e){end(id);$('error').textContent=e.message;}
}
for(const type of types){
 const arr=frequencies(type),host=$('keys-'+type);let white=0;
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
  key.addEventListener('focus',()=>{$('detail-'+type).textContent=noteName(type,i)+' — '+hz(f);});host.append(key);keyEls[type].push(key);
 });host.style.width=(type==='equal'?white*34:arr.length*38)+'px';
}
function now(){return playing?Math.min(song.duration,Math.max(position,position+context.currentTime-clock)):position;}
function timeLabel(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
function time(){if(!song)return;const t=now();$('seek').value=t;$('time').textContent=timeLabel(t)+' / '+timeLabel(song.duration);}
function pauseMidi(){
 playToken++;if(playing){position=now();playing=false;clearInterval(timer);cancelAnimationFrame(frame);for(const v of [...voices])release(v);clearKeys();clearBlue();}
 $('play').textContent='▶ Lire';time();if(song)$('status').textContent='Lecture en pause · '+scale(target);
}
function stop(){pauseMidi();endManual();if(song){position=0;time();}clearKeys();clearBlue();lastManual=null;$('status').textContent='Sons coupés.';$('comparison').textContent=$('compare').checked?'Bleu : proximité avec les notes voisines, sans les jouer.':'Correspondances bleues désactivées.';}
function refresh(){
 if(!song)return;lastManual=null;target=mode==='original'?source:(source==='equal'?'power':'equal');$('status').textContent='Prêt à lire · '+scale(target);$('comparison').textContent=$('compare').checked?'Bleu : proximité avec les notes voisines, sans les jouer.':'Correspondances bleues désactivées.';
 const result=C.convert(song.notes,source,target);converted=result.notes;
 $('source').value=source;$('original').setAttribute('aria-pressed',String(mode==='original'));$('converted').setAttribute('aria-pressed',String(mode==='converted'));heard(target);
 for(const t of types)$('panel-'+t).classList.toggle('is-origin',t===source);
 $('originHint').textContent=song.manual?'Accordage choisi manuellement.':song.tagged?(song.hasMTS?'Accordage reconnu : table MIDI Tuning'+(source==='power'?' et/ou repère Harmoniques 8–16.':'.'):'Accordage indiqué par le repère du fichier.'):'Aucun accordage reconnu : tempérament égal présumé. Tu peux modifier ce choix.';
 $('midiInfo').textContent=converted.length+' notes · lecture sur '+scale(target)+(result.clipped?(source===target?' · '+result.clipped+' notes au-delà des touches visibles, jouées à leur hauteur':' · '+result.clipped+' notes ramenées aux limites du clavier'):'')+(result.invalid?' · '+result.invalid+' notes hors de l’encodage Harmoniques 8–16 exclues':'')+'. '+song.warnings.join(' ');
 $('seek').max=song.duration;$('play').disabled=!converted.length;$('export').disabled=!converted.length;$('seek').disabled=false;$('source').disabled=false;$('original').disabled=false;$('converted').disabled=false;time();
}
function load(data,title){stop();song=data;source=data.source;mode='original';$('filename').textContent=title;$('error').textContent='';lastManual=null;refresh();const n=converted[0];if(n)follow(target,[n.index]);}
function schedule(){
 if(!playing)return;const t=now(),until=t+.15;
 while(next<converted.length&&converted[next].start<until){const n=converted[next++],end=n.start+n.duration;if(end>t){const start=Math.max(t,n.start);sound(n.frequency,Math.max(context.currentTime,clock+(start-position)),end-start,n.velocity);}}
}
let lastVisual='';
function animate(){
 if(!playing)return;const t=now();const active=converted.filter(n=>n.start<=t&&n.start+n.duration>t);const signature=active.map(n=>n.index+':'+n.originalFrequency).join(',');
 if(signature!==lastVisual){lastVisual=signature;clearKeys();for(const n of active)keyEls[target][n.index]?.classList.add('active');
  blue(target,active.map(n=>n.frequency),$('follow').checked);if($('follow').checked)follow(target,active.map(n=>n.index));
  if(active.length){const n=active[active.length-1];$('detail-'+target).textContent=(n.index>=0?noteName(target,n.index):'Hors clavier')+' — '+hz(n.frequency);}
 }
 time();if(t>=song.duration){pauseMidi();position=song.duration;time();$('status').textContent='Lecture terminée.';return;}frame=requestAnimationFrame(animate);
}
async function play(){
 if(playing){pauseMidi();return;}if(!song||!converted.length)return;endManual();const token=++playToken;
 try{await audio();if(token!==playToken)return;if(position>=song.duration-.01)position=0;clock=context.currentTime+.025;playing=true;next=0;lastVisual='!';lastManual=null;heard(target);$('error').textContent='';$('status').textContent='Lecture MIDI · '+scale(target);$('play').textContent='Ⅱ Pause';schedule();timer=setInterval(schedule,35);animate();}
 catch(e){pauseMidi();$('error').textContent='Lecture indisponible : '+e.message;}
}
function download(bytes,file){const url=URL.createObjectURL(new Blob([bytes],{type:'audio/midi'}));const a=document.createElement('a');a.href=url;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('volume').oninput=volume;$('timbre').onchange=()=>{pauseMidi();endManual();};$('stop').onclick=stop;$('play').onclick=play;
$('compare').onchange=()=>{lastVisual='!';if(lastManual)blue(lastManual.type,[lastManual.f]);else if(!playing){clearBlue();$('comparison').textContent=$('compare').checked?'Bleu : proximité avec les notes voisines, sans les jouer.':'Correspondances bleues désactivées.';}};
$('follow').onchange=()=>{lastVisual='!';};
$('original').onclick=()=>{pauseMidi();endManual();mode='original';clearBlue();refresh();};$('converted').onclick=()=>{pauseMidi();endManual();mode='converted';clearBlue();refresh();};
$('source').onchange=()=>{pauseMidi();endManual();source=$('source').value;song.manual=true;position=0;clearBlue();refresh();};
$('seek').oninput=()=>{const t=Number($('seek').value);pauseMidi();position=t;time();};
$('demo').onclick=()=>{loadToken++;load(C.demo('equal'),'Les huit marches · exemple tempéré');};$('demoPower').onclick=()=>{loadToken++;load(C.demo('power'),'Les huit marches · exemple harmoniques 8–16');};
$('export').onclick=()=>download(C.midiBytes(converted,target),'astra-'+(target==='power'?'harmoniques-8-16':'tempere')+'.mid');
$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;const token=++loadToken;pauseMidi();try{if(file.size>10*1024*1024)throw Error('Fichier trop volumineux : maximum 10 Mo.');const data=C.parseMidi(await file.arrayBuffer());if(token===loadToken)load(data,file.name);}catch(err){if(token===loadToken)$('error').textContent=err.message;}finally{e.target.value='';}};
window.addEventListener('blur',()=>{pauseMidi();endManual();});document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseMidi();endManual();}});
heard('equal');requestAnimationFrame(()=>{follow('equal',[39]);follow('power',[24]);});
