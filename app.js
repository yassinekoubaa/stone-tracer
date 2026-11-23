'use strict';
const {overlay:o,replay:r}=CASE;
const el=id=>document.getElementById(id);
const nodes=Object.keys(o.stones);
const labels={tokens:'Input token',e:'Token embedding',x:'Positioned input',q:'Query',k:'Key',v:'Value',score:'Attention score',w:'Attention weight',value:'Projected value',msg:'Attention message',y:'Attention merge',pre:'Neuron input',act:'Neuron activation',neuron:'Neuron message',z:'Final residual',margin:'Answer score'};
const name=k=>labels[k.split('/')[0]];
const steps=[['tokens/1','Token 5'],['value/1','Value sent'],['w/3/1','Attention weight'],['msg/3/1','Marked message'],['y/3','Merge'],['z/3','Final residual'],['margin','Answer']];
const explanations={tokens:'The recorded token ID at this input position.',value:'The vector this position can send to the query.',w:'The share of attention assigned to the source. All four scores enter its calculation.',msg:'The attention weight multiplies the projected value. This stored vector is one incoming message.',y:'The query residual and its four incoming messages meet here.',z:'The residual and all twelve neuron messages meet before readout.',margin:'A negative score selects even. Zero or a positive score selects odd.'};
for(const k of nodes) el('stone').add(new Option(name(k)+' · '+k,k));
function link(k){return '<button type="button" data-stone="'+k+'">'+k+'</button>';}
el('trail').innerHTML=steps.map(([k,n])=>'<button type="button" data-stone="'+k+'">'+n+'</button>').join('');
function inspect(k){
  const stone=o.stones[k],children=nodes.filter(n=>o.parents[n].includes(k));
  el('stone').value=k;
  for(const b of el('trail').children)b.setAttribute('aria-pressed',String(b.dataset.stone===k));
  const vals=a=>a.map(n=>Number.isInteger(n)?String(n):n.toFixed(4)).join('  ');
  el('reading').innerHTML='<h3>'+name(k)+' <code>'+k+'</code></h3><p>'+(explanations[k.split('/')[0]]||'Recorded during the ordinary forward pass.')+'</p><div class="readout"><div>Inference<div class="num">'+vals(stone.query)+'</div></div><div>Training · step 95, row 4<div class="num">'+vals(stone.training)+'</div></div></div><p class="muted">'+(stone.aligned?'Aligned locally':'Divergent locally')+' · distance '+stone.distance.toFixed(3)+'</p><div class="relationships">Parents &nbsp; '+(o.parents[k].map(link).join(' ')||'Input origin')+'</div><div class="relationships">Children &nbsp; '+(children.map(link).join(' ')||'Final answer')+'</div>';
}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-stone]');if(b)inspect(b.dataset.stone);});
el('stone').onchange=e=>inspect(e.target.value);
inspect('msg/3/1');
const modes=[
 ['Original training',r.factual,'The factual replay reproduced every stored checkpoint.'],
 ['Block learning through token 5',r.branch_stopped[1],'Only the marked message’s training gradient was blocked for this occurrence. The later decision changed to odd.'],
 ['Block learning through token 2',r.branch_stopped[0],'Blocking this sibling message kept the later decision even.'],
 ['Block learning through the selector',r.branch_stopped[2],'Blocking the other sibling also kept the later decision even.'],
 ['Remove the example’s learning contribution',r.omitted[r.batch_row],'The other seven examples in this update still contributed. This later decision also changed to odd.']];
modes.forEach(([n],i)=>el('intervention').add(new Option(n,i)));
function result(i){const [,score,exp]=modes[i];el('verdict').textContent=(score<0?'Even':'Odd')+'  /  '+(score>=0?'+':'')+score.toFixed(3);el('pointer').style.left=(50+50*score)+'%';el('explanation').textContent=exp;}
el('intervention').onchange=e=>result(Number(e.target.value));result(0);
