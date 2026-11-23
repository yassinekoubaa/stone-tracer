'use strict';
{
  const chart=el('paired-map'), selector=el('map-route');
  const allGroups=['tokens','e','x','q k v','score value','w','msg','y','pre','act','neuron','z','margin'];
  const captions=[
    'Both trails start at 2. They separate at its projected value and its message, then come close again where the four messages merge.',
    'Both trails start at 5. Its projected value, attention weight, and message align. The final scores differ in magnitude, though both say even.',
    'The selector tokens differ. Their routing weights come close, their messages diverge, and the combined values align again at the merge.'
  ];
  const titles=['Token','Projected value','Weight','Message','Merge','Final residual','Answer score'];
  let locations={}, current='';
  const ns='http://www.w3.org/2000/svg';
  function shape(tag,attrs,parent=chart){
    const element=document.createElementNS(ns,tag);
    for(const [k,v] of Object.entries(attrs))element.setAttribute(k,v);
    parent.appendChild(element);return element;
  }
  function label(x,y,str,size,parent=chart){
    shape('text',{x,y,'font-size':size,'text-anchor':'middle',fill:'#243d39'},parent).textContent=str;
  }
  function display(k){
    current=k;
    chart.querySelectorAll('[data-node]').forEach(g=>g.setAttribute('aria-pressed',String(g.dataset.node===k)));
    const v=o.stones[k], nums=a=>a.map(n=>Number.isInteger(n)?n:n.toFixed(4)).join('  ');
    el('map-detail').innerHTML='<h4>'+name(k)+' <code>'+k+'</code> · '+(v.aligned?'Aligned':'Divergent')+'</h4><div class="readout"><div>● Inference<p class="num">'+nums(v.query)+'</p></div><div>◆ Training<p class="num">'+nums(v.training)+'</p></div></div><small>Normalized distance '+v.distance.toFixed(4)+' · alignment cutoff 0.15</small>';
    inspect(k);
  }
  function render(){
    const all=selector.value==='all', s=Number(selector.value);
    locations={};chart.replaceChildren();
    let edges=[], shown=[];
    if(all){
      chart.setAttribute('viewBox','0 0 1310 680');
      allGroups.forEach((group,col)=>{
        const ks=nodes.filter(k=>group.split(' ').includes(k.split('/')[0])).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
        ks.forEach((k,i)=>{locations[k]=[55+col*100,35+(i+.5)*600/ks.length];shown.push(k);});
      });
      edges=Object.entries(o.parents).flatMap(([k,ps])=>ps.map(p=>[p,k]));
    }else{
      chart.setAttribute('viewBox','0 0 920 275');
      shown=['tokens/'+s,'value/'+s,'w/3/'+s,'msg/3/'+s,'y/3','z/3','margin'];
      const centers=[[60,134],[227,76],[227,194],[395,134],[547,134],[697,134],[850,134]];
      shown.forEach((k,i)=>locations[k]=centers[i]);
      edges=[[0,1],[0,2],[1,3],[2,3],[3,4],[4,5],[5,6]].map(([a,b])=>[shown[a],shown[b]]);
    }
    chart.classList.toggle('full',all);
    function point(k,side){const [x,y]=locations[k];return [x,y+side*(o.stones[k].aligned?4:all?12:21)];}
    for(const [a,b] of edges)for(const side of [-1,1]){
      const [x,y]=point(a,side),[u,v]=point(b,side),mid=(x+u)/2;
      shape('path',{d:'M '+x+' '+y+' C '+mid+' '+y+' '+mid+' '+v+' '+u+' '+v,fill:'none',stroke:side<0?'#377f70':'#b46b37','stroke-width':all?1.1:2.5,opacity:all?.58:.92});
    }
    shown.forEach((k,i)=>{
      const [x,y]=locations[k], [,a]=point(k,-1),[,b]=point(k,1),rad=all?5:8;
      const g=shape('g',{role:'button',tabindex:0,'data-node':k,'aria-label':name(k)+' '+k+', '+(o.stones[k].aligned?'aligned':'divergent')});
      shape('rect',{x:x-(all?35:55),y:y-(all?22:38),width:all?70:110,height:all?44:80,fill:'transparent',rx:7,class:'hit'},g);
      shape('circle',{cx:x,cy:a,r:rad,fill:'#167360',stroke:'white'},g);
      shape('path',{d:'M '+x+' '+(b-rad)+' l '+rad+' '+rad+' -'+rad+' '+rad+' -'+rad+' -'+rad+' Z',fill:'#a65323',stroke:'white'},g);
      label(x,y+(all?24:42),all?k:titles[i],all?12:16,g);
      g.onclick=()=>display(k);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();display(k);}};
    });
    el('route-comment').textContent=all?'Every line follows one recorded parent–child connection. Choose any pair of stones to inspect its values.':captions[s]+' This branch view condenses intermediate operations. The full map shows each connection.';
    display(all && locations[current]?current:all?'y/3':'msg/3/'+s);
  }
  selector.onchange=render;
  render();
}
