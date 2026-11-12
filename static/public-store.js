import {modelNames} from './labels.js';

const models=['b3','p1','integrated'];
const cmp=(a,b)=>a<b?-1:a>b?1:0;
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const all=v=>v==null||['','all','All','*'].includes(v);
const quantile=(sorted,q)=>{if(!sorted.length)return null;const p=(sorted.length-1)*q,i=Math.floor(p);return sorted[i]+(sorted[Math.ceil(p)]-sorted[i])*(p-i);};
export function csvCell(value){let text=String(value??'');if(typeof value==='string'&&/^[=+\-@\t\r]/.test(value))text="'"+text;return /[",\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;}
export function csvText(rows,columns){return [columns.map(csvCell).join(','),...rows.map(r=>columns.map(k=>csvCell(r[k])).join(','))].join('\r\n')+'\r\n';}

export class PublicStore {
  constructor(manifest,catalog,bonds,chunks,lab,options){
    this.manifest=manifest;this.catalog=catalog;this.bondsData=bonds;this.bondMap=new Map(bonds.map(b=>[b.cusip,b]));
    this.lab=lab;this.options=options;this.columns={};this.names=manifest.columns;this.cache=new Map();
    for(const name of this.names)this.columns[name]=chunks.flatMap(chunk=>{const c=chunk.columns.find(x=>x.name===name);if(!c)throw Error('Published data column is missing: '+name);return c.dictionary?c.values.map(v=>v<0?null:c.dictionary[v]):c.values;});
    this.n=this.columns.cusip.length;
    if(this.n!==manifest.rows||this.names.some(k=>this.columns[k].length!==this.n))throw Error('Published data count does not match its manifest.');
    if(this.columns.custom_price.filter(v=>v!=null).length!==manifest.evaluation.n)throw Error('Published evaluation cohort does not match its manifest.');
  }
  row(i){const r=Object.fromEntries(this.names.map(k=>[k,this.columns[k][i]])),b=this.bondMap.get(r.cusip)||{};return {...r,name:b.name,issuer:b.issuer,sector:r.bics_sector,rating:r.rating_bucket,reference_sector:b.sector};}
  select(params={}){
    const key=JSON.stringify(params);if(this.cache.has(key))return this.cache.get(key);
    const c=this.columns,checks=[];
    const time=v=>{if(!/^(09:30|1[0-5]:(00|30)|16:00)$/.test(v))throw Error('Choose half-hour bounds between 09:30 and 16:00 ET.');const [h,m]=v.split(':').map(Number);return h*60+m;};
    let from=600,to=930;
    if(params.start_time!=null||params.end_time!=null){from=time(params.start_time||'');to=time(params.end_time||'');if(from>=to)throw Error('Start time must be before end time.');}
    else if(params.session==='all'){from=0;to=1440;}
    else if(params.session&&!['core','all'].includes(params.session))throw Error('Invalid session.');
    for(const name of ['start','end'])if(params[name]&&(!/^\d{4}-\d{2}-\d{2}$/.test(params[name])||!Number.isFinite(Date.parse(params[name]))))throw Error('Use YYYY-MM-DD dates.');
    if(params.start&&params.end&&params.start>params.end)throw Error('Start date must not be after end date.');
    if(params.evaluation_run&&params.evaluation_run!=='saved'&&params.evaluation_run!==this.lab.run_id)throw Error('This experiment is not included in the published snapshot.');
    for(const [key,col] of [['sector','bics_sector'],['rating','rating_bucket'],['membership','membership'],['liquidity','liquidity_tier'],['cusip','cusip']])if(!all(params[key]))checks.push([c[col],params[key]]);
    const useLab=params.evaluation_run!=='saved',rows=[];
    const query=(params.q||'').toLowerCase();
    for(let i=0;i<this.n;i++){
      if(useLab&&c.custom_price[i]==null)continue;
      if(c.minute[i]<from||c.minute[i]>=to||(params.start&&c.date[i]<params.start)||(params.end&&c.date[i]>params.end))continue;
      if(checks.some(([column,value])=>column[i]!==value))continue;
      if(query){const b=this.bondMap.get(c.cusip[i])||{};if(!['cusip','name','issuer','ticker'].some(k=>String(b[k]||'').toLowerCase().includes(query)))continue;}
      rows.push(i);
    }
    if(this.cache.size>=8)this.cache.delete(this.cache.keys().next().value);this.cache.set(key,rows);return rows;
  }
  error(i,m){return 10000*(this.columns[m+'_price'][i]/this.columns.actual_price[i]-1);}
  selection(rows){const c=this.columns,bonds=new Set(),dates=new Set();let start=null,end=null;for(const i of rows){bonds.add(c.cusip[i]);dates.add(c.date[i]);if(start===null||c.date[i]<start)start=c.date[i];if(end===null||c.date[i]>end)end=c.date[i];}return {n:rows.length,bonds:bonds.size,dates:dates.size,start,end};}
  metrics(rows){return models.map(model=>{
    let absolute=0,squared=0,bias=0;const errors=[],bonds=new Map();
    for(const i of rows){const e=this.error(i,model),a=Math.abs(e);absolute+=a;squared+=e*e;bias+=e;errors.push(a);const key=this.columns.cusip[i],b=bonds.get(key)||[0,0];b[0]+=a;b[1]++;bonds.set(key,b);}
    errors.sort((a,b)=>a-b);const n=rows.length;
    return {model,label:modelNames[model],n,mae_bps:n?absolute/n:null,rmse_bps:n?Math.sqrt(squared/n):null,bias_bps:n?bias/n:null,p95_absolute_bps:quantile(errors,.95),bond_equal_mae_bps:mean([...bonds.values()].map(([s,n])=>s/n))};
  });}
  grouped(rows,column,out){const groups=new Map();for(const i of rows){const key=this.columns[column][i];if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}const result=[];for(const model of models)for(const key of [...groups.keys()].sort()){const indices=groups.get(key);let abs=0,sq=0;for(const i of indices){const e=this.error(i,model);abs+=Math.abs(e);sq+=e*e;}result.push({[out]:key,model,n:indices.length,mae_bps:abs/indices.length,rmse_bps:Math.sqrt(sq/indices.length)});}return result;}
  summary(params){const rows=this.select(params);return {selection:this.selection(rows),metrics:this.metrics(rows),daily:this.grouped(rows,'date','date'),monthly:this.grouped(rows,'month','month'),staleness:this.grouped(rows,'staleness_bucket','bucket'),evaluation:params.evaluation_run==='saved'?null:this.catalog.evaluation,filter_options:this.catalog.filters};}
  sortRows(rows){const c=this.columns;return rows.slice().sort((a,b)=>cmp(c.clock[b],c.clock[a])||cmp(c.cusip[a],c.cusip[b])||cmp(c.event_trade_id[a],c.event_trade_id[b]));}
  paginate(rows,params){const page=Number(params.page||1),page_size=Number(params.page_size||25);if(!Number.isInteger(page)||page<1||page>100000||!Number.isInteger(page_size)||page_size<1||page_size>500)throw Error('Invalid pagination.');return {rows:rows.slice((page-1)*page_size,page*page_size),total:rows.length,page,page_size};}
  predictions(params){const p=this.paginate(this.sortRows(this.select(params)),params);p.rows=p.rows.map(i=>this.row(i));return p;}
  bondRows(params){
    const sums=new Map(),c=this.columns;
    for(const i of this.select(params)){const key=c.cusip[i];if(!sums.has(key))sums.set(key,{predictions:0,last_prediction:null,mae_b3:0,mae_p1:0,mae_integrated:0});const a=sums.get(key);a.predictions++;if(!a.last_prediction||c.clock[i]>a.last_prediction)a.last_prediction=c.clock[i];for(const m of models)a['mae_'+m]+=Math.abs(this.error(i,m));}
    const query=(params.q||'').toLowerCase();
    let rows=this.bondsData.filter(b=>['sector','rating','membership','cusip'].every(k=>all(params[k])||params[k]===b[k])&&(!query||['cusip','name','issuer','ticker'].some(k=>String(b[k]||'').toLowerCase().includes(query)))).map(b=>{const a=sums.get(b.cusip);return {...b,predictions:a?.predictions||0,last_prediction:a?.last_prediction||null,...Object.fromEntries(models.map(m=>['mae_'+m,a?a['mae_'+m]/a.predictions:null]))};});
    if(!all(params.liquidity))rows=rows.filter(b=>b.predictions>0);
    const sort=params.sort||'trades';if(!['trades','name','cusip','mae'].includes(sort))throw Error('Invalid bond sort.');
    rows.sort((a,b)=>(sort==='trades'?b.predictions-a.predictions:sort==='name'?cmp(a.name||'',b.name||''):sort==='mae'?((a.mae_integrated==null)-(b.mae_integrated==null)||((b.mae_integrated||0)-(a.mae_integrated||0))):0)||cmp(a.cusip,b.cusip));return rows;
  }
  bonds(params){return this.paginate(this.bondRows(params),params);}
  bond(cusip,params){if(!/^[A-Za-z0-9]{9}$/.test(cusip))throw Error('Enter a nine-character CUSIP.');const b=this.bondMap.get(cusip.toUpperCase());if(!b)throw Error('Bond not found.');const rows=this.select({...params,cusip:b.cusip}),c=this.columns,dates=[...new Set(rows.map(i=>c.date[i]))].sort(),day=params.day||dates.at(-1)||null;const series=rows.filter(i=>c.date[i]===day).sort((a,b)=>cmp(c.clock[a],c.clock[b])||cmp(c.event_trade_id[a],c.event_trade_id[b])).map(i=>this.row(i));return {bond:b,selection:this.selection(rows),metrics:this.metrics(rows),dates,day,series,observations:series,notes:['Published historical predictions at transaction times; connected points are visual guides.','Reference classifications are retrospective snapshots.','Metrics cover the date range; the chart shows the selected day.']};}
  buckets(params){const group=params.group||'sector_rating',groups={sector_rating:['bics_sector','rating_bucket'],sector:['bics_sector'],rating:['rating_bucket'],liquidity:['liquidity_tier']},keys=groups[group];if(!keys)throw Error('Invalid bucket grouping.');const c=this.columns,map=new Map();for(const i of this.select(params)){const values=keys.map(k=>c[k][i]),key=JSON.stringify(values);if(!map.has(key))map.set(key,{sector:keys.includes('bics_sector')?c.bics_sector[i]:null,rating:keys.includes('rating_bucket')?c.rating_bucket[i]:null,...(group==='liquidity'?{liquidity:c.liquidity_tier[i]}:{}),key:values.join(' / '),label:values.join(' / '),n:0,bonds:new Set(),sums:[0,0,0],squared:[0,0,0]});const g=map.get(key);g.n++;g.bonds.add(c.cusip[i]);models.forEach((m,j)=>{const e=this.error(i,m);g.sums[j]+=Math.abs(e);g.squared[j]+=e*e;});}const rows=[...map.values()].map(g=>{const result={...g,bonds:g.bonds.size};models.forEach((m,j)=>{result['mae_'+m]=g.sums[j]/g.n;result['rmse_'+m]=Math.sqrt(g.squared[j]/g.n);});delete result.sums;delete result.squared;return result;}).sort((a,b)=>b.n-a.n||cmp(a.key,b.key));return {rows,group};}
  export(params){const kind=params.kind;let rows,columns;
    if(kind==='metrics')rows=this.metrics(this.select(params));else if(kind==='buckets')rows=this.buckets(params).rows;else if(kind==='bonds')rows=this.bondRows(params);else if(kind==='predictions'){columns=[...this.names,'name','issuer','sector','rating','reference_sector'];rows=this.sortRows(this.select(params)).map(i=>this.row(i));}else throw Error('Invalid export kind.');
    columns??=rows.length?Object.keys(rows[0]):(kind==='bonds'?['cusip','name','predictions']:['model','n','mae_bps']);
    return {filename:`26b-${kind}-${params.start||'all'}-${params.end||'all'}.csv`,blob:new Blob(['\uFEFF'+csvText(rows,columns)],{type:'text/csv;charset=utf-8'})};
  }
  request(path,params={}){
    if(path==='/api/catalog')return this.catalog;
    if(path==='/api/summary')return this.summary(params);
    if(path==='/api/bonds')return this.bonds(params);
    if(path.startsWith('/api/bond/'))return this.bond(decodeURIComponent(path.slice('/api/bond/'.length)),params);
    if(path==='/api/buckets')return this.buckets(params);
    if(path==='/api/predictions')return this.predictions(params);
    if(path==='/api/export')return this.export(params);
    if(path==='/api/lab/options')return this.options;
    if(path==='/api/lab/runs')return {runs:[this.lab],active_job:null};
    const route='/api/lab/runs/'+this.lab.run_id;
    if(path===route)return this.lab;
    if(path===route+'/predictions')return this.predictions({cusip:params.cusip,page:params.page,page_size:params.page_size,evaluation_run:this.lab.run_id,session:'all'});
    throw Error('This resource is not part of the saved public snapshot.');
  }
}
