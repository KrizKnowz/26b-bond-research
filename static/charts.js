const NS = 'http://www.w3.org/2000/svg';
export const COLORS = {b3:'#003b71',p1:'#0077c8',integrated:'#a87900',p0:'#97a6b8',actual:'#202a35',hyg:'#0067b0',jnk:'#937000',experiment:'#0051a5',p0_size:'#97a6b8',p0_time:'#bac3cf',fixed_p1:'#a87900',full:'#475d78'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = (value, digits=2) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});

function niceTicks(min,max,count=5) {
  if (!(max>min)) { min-=.5; max+=.5; }
  const raw=(max-min)/count, mag=10**Math.floor(Math.log10(raw));
  const ratio=raw/mag, step=(ratio>5?10:ratio>2?5:ratio>1?2:1)*mag;
  const low=Math.floor(min/step)*step, high=Math.ceil(max/step)*step;
  return {min:low,max:high,ticks:Array.from({length:Math.round((high-low)/step)+1},(_,i)=>low+i*step),step};
}

function timeValue(value) {
  if(typeof value==='number') return value;
  const clean=String(value).replace(' ','T');
  return Date.parse(/Z$|[+-]\d\d:\d\d$/.test(clean)?clean:clean+'Z');
}

function timeLabel(value,full=false) {
  const date=new Date(value);
  return full?date.toISOString().slice(0,19).replace('T',' '):date.toISOString().slice(11,16);
}

export function lineChart(container, options) {
  const {series=[],height=260,yLabel='',xType='category',precision=2,zero=false,empty='No observations for this selection.'}=options;
  const valid=series.flatMap(s=>s.data||[]).filter(p=>p.y!=null&&Number.isFinite(Number(p.y)));
  if(!valid.length) {container.innerHTML=`<div class="empty-state"><h3>No chart observations</h3><p>${esc(empty)}</p></div>`;return;}
  const width=Math.max(340,container.getBoundingClientRect().width||720),left=62,right=18,top=30,bottom=43,w=width-left-right,h=height-top-bottom;
  const values=valid.map(p=>Number(p.y));
  const min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*.12,Math.abs(max)*.00005,.005);
  const scale=niceTicks(zero?Math.min(0,min):min-pad,max+pad,4);
  const categories=options.xValues||[...new Set(series.flatMap(s=>(s.data||[]).map(p=>p.x)))].sort();
  const clocks=xType==='time'?categories.map(timeValue):categories.map((_,i)=>i);
  let xMin=Math.min(...clocks),xMax=Math.max(...clocks);if(xMin===xMax){xMin-=1;xMax+=1;}
  const x=value=>left+((xType==='time'?timeValue(value):categories.indexOf(value))-xMin)/(xMax-xMin)*w;
  const y=value=>top+(scale.max-value)/(scale.max-scale.min)*h;
  const tickPrecision=scale.step<.01?3:scale.step<1?2:scale.step<10?1:0;
  const grid=scale.ticks.map(v=>`<line x1="${left}" y1="${y(v)}" x2="${width-right}" y2="${y(v)}" stroke="#e8edf3"/><text x="${left-12}" y="${y(v)+4}" font-size="10" fill="#6a7c90" text-anchor="end">${number(v,tickPrecision)}</text>`).join('');
  const tickIndices=categories.length<=7?categories.map((_,i)=>i):Array.from({length:6},(_,i)=>Math.round(i*(categories.length-1)/5));
  const labels=[...new Set(tickIndices)].map(i=>`<text x="${x(categories[i])}" y="${height-16}" font-size="10" fill="#6a7c90" text-anchor="middle">${esc(options.formatX?options.formatX(categories[i]):xType==='time'?timeLabel(timeValue(categories[i])):categories[i])}</text>`).join('');
  const paths=series.map(s=>{
    const points=(s.data||[]).filter(p=>p.y!=null&&Number.isFinite(Number(p.y)));
    if(!points.length)return '';
    let started=false;
    const path=(s.data||[]).map(p=>{
      if(p.y==null||!Number.isFinite(Number(p.y))){started=false;return '';}
      const segment=`${started?'L':'M'}${x(p.x).toFixed(2)},${y(Number(p.y)).toFixed(2)}`;started=true;return segment;
    }).join(' ');
    return `${s.dots?'':`<path d="${path}" fill="none" stroke="${s.color}" stroke-width="${s.width||2}" ${s.dash?'stroke-dasharray="5 4"':''} stroke-linecap="round" stroke-linejoin="round"/>`}${s.dots||points.length<=90?points.map(p=>`<circle cx="${x(p.x)}" cy="${y(Number(p.y))}" r="${s.dots?(points.length>90?2:3.5):2.4}" fill="${s.color}" ${s.dots?'opacity=".88"':''}/>`).join(''):''}`;
  }).join('');
  container.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(options.title||yLabel||'Model comparison chart')}"><text x="${left}" y="14" font-size="10" fill="#687c92">${esc(yLabel)}</text>${grid}<line x1="${left}" y1="${top+h}" x2="${width-right}" y2="${top+h}" stroke="#d9e2ec"/>${labels}${paths}<g class="hover-layer" hidden></g><rect class="chart-hit" x="${left}" y="${top}" width="${w}" height="${h}" fill="transparent" tabindex="0" role="presentation"/></svg>`;
  const svg=container.querySelector('svg'),hit=container.querySelector('.chart-hit'),hover=container.querySelector('.hover-layer'),tooltip=document.getElementById('chart-tooltip');
  const show=(index,event)=>{
    const chosen=categories[index]; if(chosen==null)return;
    const entries=series.map(s=>({s,p:s.data.find(p=>String(p.x)===String(chosen)&&p.y!=null)})).filter(p=>p.p);
    hover.removeAttribute('hidden');hover.innerHTML=`<line x1="${x(chosen)}" x2="${x(chosen)}" y1="${top}" y2="${top+h}" class="chart-guide"/>${entries.map(({s,p})=>`<circle cx="${x(chosen)}" cy="${y(Number(p.y))}" r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2"/>`).join('')}`;
    const extra=options.tooltipExtra?options.tooltipExtra(chosen):[];
    tooltip.innerHTML=`<b>${esc(xType==='time'?timeLabel(timeValue(chosen),true)+' ET':chosen)}</b>${entries.map(({s,p})=>`<div class="tooltip-row"><span><i class="legend-dot" style="background:${s.color};margin-right:6px"></i>${esc(s.label)}</span><strong>${number(p.y,precision)}${options.unit?' '+esc(options.unit):''}</strong></div>`).join('')}${extra.map(r=>`<div class="tooltip-row"><span>${esc(r.label)}</span><strong>${esc(r.value)}</strong></div>`).join('')}`;
    tooltip.hidden=false;
    const bounds=svg.getBoundingClientRect();
    const px=event?.clientX??bounds.left+x(chosen)/width*bounds.width,py=event?.clientY??bounds.top+35;
    tooltip.style.left=Math.max(10,Math.min(window.innerWidth-tooltip.offsetWidth-12,px+16))+'px';
    tooltip.style.top=Math.max(10,Math.min(window.innerHeight-tooltip.offsetHeight-12,py-25))+'px';
  };
  let selectedIndex=0;
  hit.addEventListener('pointermove',event=>{
    const bounds=svg.getBoundingClientRect(),relative=(event.clientX-bounds.left)/bounds.width*width;
    const target=xMin+(relative-left)/w*(xMax-xMin);
    let index=0,distance=Infinity;clocks.forEach((v,i)=>{if(Math.abs(v-target)<distance){index=i;distance=Math.abs(v-target);}});
    selectedIndex=index;show(index,event);
  });
  const hide=()=>{hover.setAttribute('hidden','');tooltip.hidden=true;};
  hit.addEventListener('pointerleave',hide);hit.addEventListener('blur',hide);
  hit.addEventListener('focus',()=>show(selectedIndex));
  hit.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();selectedIndex=Math.max(0,Math.min(categories.length-1,selectedIndex+(event.key==='ArrowRight'?1:-1)));show(selectedIndex);}});
}

export function barChart(container,{rows=[],keys=[],height=255,title='',yLabel='Mean absolute error (bp)',formatLabel=v=>v,unit='bp',precision=3,showValues=false,formatValue=v=>number(v,precision)}) {
  const valid=rows.filter(r=>keys.some(k=>r[k.key]!=null&&Number.isFinite(Number(r[k.key]))));
  if(!valid.length){container.innerHTML='<div class="empty-state"><h3>No comparison observations</h3><p>Adjust the filters to explore a different sample.</p></div>';return;}
  const width=Math.max(340,container.getBoundingClientRect().width||720),left=55,right=20,top=28,bottom=48,w=width-left-right,h=height-top-bottom;
  const values=valid.flatMap(r=>keys.map(k=>Number(r[k.key]))).filter(Number.isFinite),scale=niceTicks(0,Math.max(...values)*1.08,4);
  const y=v=>top+h-v/scale.max*h,groupWidth=w/valid.length,barWidth=Math.max(1,Math.min(32,(groupWidth-Math.min(20,groupWidth*.2))/keys.length));
  const labelStep=Math.max(1,Math.ceil(valid.length/Math.max(2,Math.floor(w/65))));
  let html=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title||yLabel)}"><text x="${left}" y="13" font-size="10" fill="#687c92">${esc(yLabel)}</text>`;
  html+=scale.ticks.map(v=>`<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" stroke="#e8edf3"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" font-size="10" fill="#6a7c90">${number(v,scale.step<1?1:0)}</text>`).join('');
  valid.forEach((row,i)=>{
    const center=left+groupWidth*(i+.5);
    keys.forEach((key,j)=>{const value=Number(row[key.key]);if(!Number.isFinite(value)||row[key.key]==null)return;const barX=center+(j-keys.length/2)*barWidth+1;html+=`<rect x="${barX}" y="${y(value)}" width="${Math.max(1,barWidth-2)}" height="${Math.max(0,h-(y(value)-top))}" rx="2" fill="${key.color}"><title>${esc(row.label)} · ${esc(key.label)}: ${number(value,precision)} ${esc(unit)}</title></rect>`;if(showValues)html+=`<text class="bar-value-label" x="${barX+(barWidth-2)/2}" y="${y(value)-7}" text-anchor="middle" font-size="9" fill="#314d6a">${esc(formatValue(value))}</text>`;});
    if(i%labelStep===0||i===valid.length-1)html+=`<text x="${center}" y="${height-18}" text-anchor="middle" font-size="10" fill="#687c92">${esc(formatLabel(row.label))}</text>`;
  });
  container.innerHTML=html+'</svg>';
}
