(function(root){
'use strict';
const ratios=[1,9/8,5/4,11/8,3/2,13/8,7/4,15/8];
const eq=Array.from({length:88},(_,i)=>440*2**((i+21-69)/12));
const power=Array.from({length:57},(_,i)=>32*2**Math.floor(i/8)*ratios[i%8]);
const TAG='ASTRA_SCALE=power2;BASE=32;MIDI_BASE=24';
const eqName=n=>['Do','Do♯','Ré','Ré♯','Mi','Fa','Fa♯','Sol','Sol♯','La','Si♭','Si'][n%12]+(Math.floor(n/12)-1);
function nearest(f,arr){let best=0,d=Infinity;arr.forEach((v,i)=>{const x=Math.abs(Math.log2(f/v));if(x<d){d=x;best=i;}});return best;}
// The weights interpolate log-frequency (cents), never linear Hertz.
function bracket(f,arr){
 if(!Number.isFinite(f)||f<=0||f<arr[0]||f>arr[arr.length-1])return [];
 const exact=arr.findIndex(v=>Math.abs(1200*Math.log2(f/v))<1e-7);
 if(exact>=0)return [{index:exact,weight:1}];
 const hi=arr.findIndex(v=>v>f),lo=hi-1;
 const t=Math.log2(f/arr[lo])/Math.log2(arr[hi]/arr[lo]);
 return [{index:lo,weight:1-t},{index:hi,weight:t}];
}
function frequencyBytes(f){const value=Math.round((69+12*Math.log2(f/440))*16384);return [Math.floor(value/16384),(value>>7)&127,value&127];}
function decodeFrequency(a,b,c){return 440*2**((a+(b*128+c)/16384-69)/12);}
function parseMidi(buffer){
 const a=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);let p=0;
 const need=n=>{if(p+n>a.length)throw Error('Fichier MIDI tronqué.');};
 const u8=()=>{need(1);return a[p++];};
 const u16=()=>u8()*256+u8();
 const u32=()=>u8()*16777216+u8()*65536+u8()*256+u8();
 const str=n=>{need(n);let s='';for(let i=0;i<n;i++)s+=String.fromCharCode(a[p++]);return s;};
 const vlq=()=>{let v=0;for(let i=0;i<4;i++){let b=u8();v=v*128+(b&127);if(!(b&128))return v;}throw Error('Durée MIDI invalide.');};
 if(str(4)!=='MThd')throw Error('Ce fichier ne contient pas un MIDI standard (.mid).');
 let h=u32();if(h<6)throw Error('En-tête MIDI invalide.');
 const format=u16(),tracks=u16(),division=u16();
 if(format>1)throw Error('Le format MIDI 2 à séquences indépendantes n’est pas pris en charge. Utiliser un fichier de format 0 ou 1.');
 if(!division||(division&0x8000))throw Error('La synchronisation SMPTE n’est pas prise en charge dans cette version.');
 if(!tracks||tracks>256)throw Error('Nombre de pistes invalide ou trop élevé.');
 need(h-6);p+=h-6;
 let events=[],tempos=[{tick:0,us:500000,order:-1}],source=null,warnings=new Set(),endTick=0,order=0,tuning=new Map(),hasMTS=false;
 for(let tr=0;tr<tracks;tr++){
  if(str(4)!=='MTrk')throw Error('Piste MIDI invalide.');const size=u32();need(size);const end=p+size;
  let tick=0,running=0;
  const trackEnd=end;
  while(p<end){
   tick+=vlq();let status=u8();
   if(status<128){if(!running)throw Error('Événement MIDI sans statut.');p--;status=running;}
   if(status<240)running=status;else running=0;
   if(status===255){let type=u8(),len=vlq();need(len);if(p+len>end)throw Error('Métadonnée tronquée.');
    if(type===81&&len===3){const us=a[p]*65536+a[p+1]*256+a[p+2];if(!us)throw Error('Tempo nul.');tempos.push({tick,us,order:order++});}
    if(type===1||type===3){const text=new TextDecoder().decode(a.slice(p,p+len));
     if(text.startsWith(TAG)) {if(source&&source!=='power')throw Error('Indications d’accordage contradictoires.');source='power';}
     else if(text==='ASTRA_SCALE=equal'){if(source&&source!=='equal')throw Error('Indications d’accordage contradictoires.');source='equal';}
    }
    p+=len;if(type===47){p=end;break;}
   }else if(status===240||status===247){const len=vlq();need(len);if(p+len>end)throw Error('Message SysEx tronqué.');const data=a.slice(p,p+len);p+=len;
    if(status===240&&data[2]===8&&(data[0]===126||data[0]===127)){
     if(tick!==0||data[3]!==2||data[4]!==0||data.length!==7+data[5]*4||data[data.length-1]!==247)throw Error('Cet accordage MIDI embarqué n’est pas encore pris en charge. Seules les tables initiales MTS Single-note, programme 0, sont lues.');
     hasMTS=true;for(let j=0;j<data[5];j++){const o=6+4*j;if([data[o+1],data[o+2],data[o+3]].every(v=>v===127))continue;tuning.set(data[o],decodeFrequency(data[o+1],data[o+2],data[o+3]));}
    }else warnings.add('Messages SysEx autres que notre table d’accordage ignorés.');
   }
   else if(status<240){const kind=status>>4,ch=status&15,b=u8(),c=(kind===12||kind===13)?0:u8();if(b>127||c>127)throw Error('Donnée MIDI invalide.');
    if(kind===9||kind===8)events.push({tick,order:order++,ch,n:b,v:c,type:kind===8||c===0?'off':'on'});
    if(kind===11&&[64,120,123].includes(b))events.push({tick,order:order++,ch,type:b===64?'pedal':'alloff',v:c});
    if(kind===14)warnings.add('Pitch bends non reproduits ; les hauteurs sont fixes dans cette version.');
   }else throw Error('Événement système MIDI non pris en charge.');
   if(p>end)throw Error('Événement dépassant la piste.');
   if(events.length>100000)throw Error('Fichier trop dense : maximum 100 000 événements de notes.');
  }
  if(p>trackEnd)throw Error('Piste MIDI tronquée.');endTick=Math.max(endTick,tick);p=end;
 }
 tempos.sort((a,b)=>a.tick-b.tick||a.order-b.order);let prev=0,sec=0,us=500000;
 const map=[];for(const t of tempos){sec+=(t.tick-prev)*us/division/1e6;map.push({tick:t.tick,sec,us:t.us});prev=t.tick;us=t.us;}
 function seconds(t){let lo=0,hi=map.length;while(lo+1<hi){const m=(lo+hi)>>1;if(map[m].tick<=t)lo=m;else hi=m;}const x=map[lo];return x.sec+(t-x.tick)*x.us/division/1e6;}
 events.sort((a,b)=>a.tick-b.tick||a.order-b.order);
 const active=new Map(),held=Array.from({length:16},()=>[]),pedal=Array(16).fill(false),notes=[];
 function close(n,t){if(t>n.tick)notes.push({midi:n.n,start:seconds(n.tick),duration:seconds(t)-seconds(n.tick),velocity:n.v/127,channel:n.ch});}
 for(const e of events){
  if(e.ch===9){if(e.type==='on')warnings.add('Percussions du canal 10 exclues de la comparaison mélodique.');continue;}
  const k=e.ch+':'+e.n;
  if(e.type==='on'){if(!active.has(k))active.set(k,[]);active.get(k).push(e);}
  if(e.type==='off'){const q=active.get(k);if(q&&q.length){const n=q.shift();if(pedal[e.ch])held[e.ch].push(n);else close(n,e.tick);}}
  if(e.type==='pedal'){pedal[e.ch]=e.v>=64;if(!pedal[e.ch]){held[e.ch].forEach(n=>close(n,e.tick));held[e.ch]=[];}}
  if(e.type==='alloff'){for(const [k,q]of active){if(q.length&&q[0].ch===e.ch){q.forEach(n=>close(n,e.tick));active.delete(k);}}held[e.ch].forEach(n=>close(n,e.tick));held[e.ch]=[];}
 }
 for(const q of active.values())q.forEach(n=>close(n,endTick));held.flat().forEach(n=>close(n,endTick));
 notes.sort((a,b)=>a.start-b.start);if(!notes.length)throw Error('Aucune note mélodique exploitable dans ce fichier.');
 if(notes.length>20000)throw Error('Maximum 20 000 notes pour cette première version.');
 const duration=notes.reduce((d,n)=>Math.max(d,n.start+n.duration),0);if(duration>3600)throw Error('Durée maximale : une heure.');
 if(hasMTS){
  const near=(f,g)=>Math.abs(1200*Math.log2(f/g))<.004;
  const isPower=power.every((f,i)=>tuning.has(i+24)&&near(f,tuning.get(i+24)));
  const isEqual=[...tuning].every(([n,f])=>near(f,440*2**((n-69)/12)));
  const detected=isPower?'power':isEqual?'equal':null;
  if(!detected)throw Error('La table d’accordage utilise une autre gamme que les deux claviers disponibles.');
  if(source&&source!==detected)throw Error('Le repère de gamme et la table MIDI Tuning se contredisent.');
  source=detected;
 }
 return {notes,source:source||'equal',tagged:!!source,hasMTS,warnings:[...warnings],duration,format};
}
function convert(notes,source,target){
 const arr=target==='power'?power:eq;let clipped=0,invalid=0;
 const list=[];
 for(const n of notes){let f=source==='power'?power[n.midi-24]:440*2**((n.midi-69)/12);
  if(!f){invalid++;continue;}
  if(f<arr[0]||f>arr[arr.length-1])clipped++;
  const within=f>=arr[0]&&f<=arr[arr.length-1],index=source===target?(within?(source==='power'?n.midi-24:n.midi-21):-1):nearest(f,arr),sourceIndex=source==='power'?n.midi-24:n.midi-21;
  list.push({...n,frequency:source===target?f:arr[index],index,sourceIndex,originalFrequency:f,outputMidi:source===target?n.midi:target==='power'?24+index:21+index});
 }
 return {notes:list,clipped,invalid};
}
function midiBytes(notes,source){
 const vl=n=>{const b=[n&127];while((n=Math.floor(n/128)))b.unshift((n&127)|128);return b;};
 const word=n=>[(n>>8)&255,n&255],long=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
 const ascii=s=>Array.from(s,c=>c.charCodeAt(0));let events=[];
 for(const n of notes){const midi=n.outputMidi??n.midi;events.push({t:Math.round(n.start*960),off:false,data:[0x90,midi,Math.max(1,Math.min(127,Math.round(n.velocity*127)))]});events.push({t:Math.round((n.start+n.duration)*960),off:true,data:[0x80,midi,0]});}
 events.sort((a,b)=>a.t-b.t||Number(b.off)-Number(a.off));
 const tag=ascii(source==='power'?TAG+';RATIOS=1,9/8,5/4,11/8,3/2,13/8,7/4,15/8;VERSION=1':'ASTRA_SCALE=equal');let track=[0,255,81,3,7,161,32,0,255,1,...vl(tag.length),...tag];let tick=0;
 // Standard MIDI Tuning, plus an exact-ratio text marker for this application.
 const table=source==='power'?power.map((f,i)=>[24+i,...frequencyBytes(f)]):Array.from({length:128},(_,n)=>[n,n,0,0]);
 for(let i=0;i<table.length;i+=127){const group=table.slice(i,i+127),data=[127,127,8,2,0,group.length,...group.flat(),247];track.push(0,240,...vl(data.length),...data);}
 // Select tuning bank/program 0 on the exported melodic channel.
 for(const [cc,value]of [[101,0],[100,4],[6,0],[101,0],[100,3],[6,0],[101,127],[100,127]])track.push(0,176,cc,value);
 for(const e of events){track.push(...vl(e.t-tick),...e.data);tick=e.t;}
 track.push(0,255,47,0);
 return new Uint8Array([...ascii('MThd'),...long(6),...word(0),...word(1),...word(480),...ascii('MTrk'),...long(track.length),...track]);
}
function demo(source){
 const melody=[[0,1],[2,1],[4,1],[2,1],[1,1],[3,.5],[4,.5],[5,1],[4,1],[2,1],[4,1],[6,1],[7,1],[8,2],[7,1],[4,1],[5,1],[3,1],[1,1],[3,1],[4,1],[6,.5],[7,.5],[8,1],[6,1],[5,1],[4,1],[2,1],[1,1],[2,1],[1,1],[0,2]];
 const semis=[0,2,4,6,7,8,10,11,12];let time=.2,notes=[];
 for(const [d,b] of melody){notes.push({midi:source==='power'?48+d:60+semis[d],start:time,duration:b*.625-.045,velocity:.72,channel:0});time+=b*.625;}
 return {notes,source,tagged:true,warnings:[],duration:time,format:0};
}
const api={ratios,eq,power,TAG,eqName,nearest,bracket,frequencyBytes,decodeFrequency,parseMidi,convert,midiBytes,demo};root.PianoCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
