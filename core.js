(function(root){
'use strict';
const ratios=[1,9/8,5/4,11/8,3/2,13/8,7/4,15/8];
const eq=Array.from({length:88},(_,i)=>440*2**((i+21-69)/12));
const power=Array.from({length:57},(_,i)=>32*2**Math.floor(i/8)*ratios[i%8]);
const eqName=n=>['Do','Do♯','Ré','Ré♯','Mi','Fa','Fa♯','Sol','Sol♯','La','Si♭','Si'][n%12]+(Math.floor(n/12)-1);
root.PianoCore={ratios,eq,power,eqName};
})(globalThis);
