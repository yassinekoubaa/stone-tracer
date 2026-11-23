'use strict';
{
  const history=[], preferred=new Map();
  const children=new Map(nodes.map(k=>[k,nodes.filter(n=>o.parents[n].includes(k))]));
  const order=['value','v','k','q','score','w','msg','pre','act','neuron','y','z','margin'];
  const simple={tokens:'Input token',e:'Token embedding',x:'Position added',k:'Key',v:'Value',q:'Query',value:'Value to send',score:'Attention score',w:'Attention weight',msg:'Incoming message',y:'Messages merge',pre:'Neuron input',act:'Neuron activation',neuron:'Neuron message',z:'Final merge',margin:'Answer'};
  const what={
    e:'The model looks up the learned vector for this token.',
    x:'The model adds a vector for the token’s position to its embedding.',
    k:'This key lets the readout compare this position with its query.',
    q:'The readout makes a query that it will compare with each of the four keys.',
    v:'This branch carries the content the position can send.',
    value:'The model transforms that content into the vector it can add at the readout.',
    score:'The readout compares its query with this position’s key to get one score.',
    w:'All four scores meet here. Normalizing them gives this source its share of attention.',
    msg:'The attention weight multiplies the value vector. Their product is one message.',
    y:'All four incoming messages join the readout’s existing state. The sum continues down a shortcut and into twelve neurons.',
    pre:'This neuron reads the merged state and produces its own input.',
    act:'The neuron bends its input through a nonlinear function.',
    neuron:'The activation scales the vector this neuron sends to the final merge.',
    z:'The shortcut meets all twelve neuron messages. Their sum, plus a learned bias, is the final readout state.'
  };
  const field=k=>k.split('/')[0];
  const title=k=>{
    const parts=k.split('/'), f=parts[0], idx=Number(parts.at(-1));
    if(['pre','act','neuron'].includes(f))return simple[f]+' '+idx;
    if(['tokens','e','x','k','v','value','score','w','msg'].includes(f))return simple[f]+' · '+['first number','second number','selector','readout'][idx];
    return simple[f];
  };
  const nums=a=>a.map(n=>Number.isInteger(n)?n:n.toFixed(4)).join('  ');
  function strip(){
    const svg=el('walk-line'),width=history.length*110+36;
    const dots=history.map((k,i)=>({x:58+i*110,gap:o.stones[k].aligned?5:22,k}));
    const track=(side,color)=>'<polyline fill="none" stroke="'+color+'" stroke-width="3" points="'+dots.map(p=>p.x+','+(48+side*p.gap)).join(' ')+'"/>';
    svg.setAttribute('viewBox','0 0 '+width+' 108');svg.style.width=width+'px';
    svg.setAttribute('aria-label',history.map(k=>title(k)+(o.stones[k].aligned?', aligned':', different')).join('; '));
    svg.innerHTML=track(-1,'#167360')+track(1,'#a65323')+dots.map(({x,gap,k},i)=>{
      const y=48+gap,selected=i===dots.length-1;
      return (selected?'<rect x="'+(x-53)+'" y="4" width="106" height="96" rx="8" fill="none" stroke="#56716a" stroke-dasharray="3 3"/>':'')+'<circle cx="'+x+'" cy="'+(48-gap)+'" r="7" fill="#167360"/><path d="M '+x+' '+(y-7)+' l 7 7 -7 7 -7 -7 Z" fill="#a65323"/><text x="'+x+'" y="92" text-anchor="middle" font-size="12" fill="#233b34">'+simple[field(k)]+'</text>';
    }).join('');
    svg.parentElement.scrollLeft=svg.parentElement.scrollWidth;
  }
  function hint(){
    const k=el('walk-fork').value;
    el('walk-hint').textContent=k?'At the next stone, the two recorded values '+(o.stones[k].aligned?'align.':'differ.'):'';
  }
  function draw(){
    const k=history.at(-1), f=field(k), v=o.stones[k], ps=o.parents[k];
    const next=children.get(k).slice().sort((a,b)=>order.indexOf(field(a))-order.indexOf(field(b))||a.localeCompare(b,'en',{numeric:true}));
    const alignedParents=ps.filter(p=>o.stones[p].aligned);
    let action=what[f]||'';
    if(f==='tokens')action='The inference starts this branch with token '+v.query[0]+'. The training input has token '+v.training[0]+' in the same position.';
    if(f==='margin')action='At training step '+r.training_step+', input ['+r.training_input.join(', ')+'] scored '+v.training[0].toFixed(3)+' (even). After training, input ['+r.input.join(', ')+'] scored '+v.query[0].toFixed(3)+' (even). The scores differ enough to separate the stones, but both give the same answer.';
    let change=v.aligned?'The values align here.':'The values differ here.';
    if(ps.length>1){
      change=alignedParents.length+' of the '+ps.length+' incoming stones align. '+(v.aligned?(alignedParents.length<ps.length?'Their combined values come close again at this merge.':'The merged values also align.'):'The merged values differ.');
    }else if(ps.length){
      const prior=o.stones[ps[0]].aligned;
      change=prior===v.aligned?(prior?'The two values stay close through this step.':'The two values still differ after this step.'):(v.aligned?'The parent values differed. After this step the values are close again.':'The parent values were close. At this step they diverge.');
    }
    if(next.length>1){
      const count=next.filter(n=>o.stones[n].aligned).length;
      change+=' This stone forks into '+next.length+' recorded uses: '+count+' align at the next step and '+(next.length-count)+' differ.';
    }
    el('walk-story').innerHTML='<p class="walk-position">Stone '+history.length+' on your trail · '+(v.aligned?'Aligned':'Different')+'</p><h4>'+title(k)+'</h4><p>'+action+'</p><p>'+change+'</p>';
    if(f==='margin'){
      const jump=document.createElement('a');
      jump.href='#replay';
      jump.className='button';
      jump.textContent='See why the replay answered odd';
      jump.onclick=()=>{el('intervention').value='1';result(1);};
      el('walk-story').append(jump);
    }
    const select=el('walk-fork');select.replaceChildren(...next.map(n=>new Option(title(n),n)));
    if(next.includes(preferred.get(k)))select.value=preferred.get(k);
    el('walk-choice').hidden=next.length<2;
    el('walk-next').disabled=!next.length;
    el('walk-back').disabled=history.length<2;
    el('walk-numbers').innerHTML='<p><strong>Inference</strong> · '+nums(v.query)+'</p><p><strong>Training</strong> · '+nums(v.training)+'</p><p>Distance '+v.distance.toFixed(4)+' · alignment cutoff 0.15</p>'+(ps.length>1?'<ul>'+ps.map(p=>'<li>'+title(p)+' · '+(o.stones[p].aligned?'aligned':'different')+'</li>').join('')+'</ul>':'');
    hint();strip();
  }
  function reset(){history.splice(0,history.length,'tokens/'+el('walk-origin').value);preferred.clear();draw();}
  el('walk-next').onclick=()=>{const n=el('walk-fork').value;if(n){preferred.set(history.at(-1),n);history.push(n);draw();}};
  el('walk-back').onclick=()=>{if(history.length>1){history.pop();draw();}};
  el('walk-fork').onchange=hint;
  el('walk-origin').onchange=reset;
  el('walk-reset').onclick=reset;
  reset();
}
