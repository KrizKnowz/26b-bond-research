const worker=new Worker(new URL('./public-worker.js',import.meta.url),{type:'module'});
const pending=new Map();let next=0;
const metadata=new Map();
function saved(name){if(!metadata.has(name))metadata.set(name,fetch(new URL('../data/'+name+'.json',import.meta.url)).then(async r=>{if(!r.ok)throw Error('Unable to load published '+name+'.');return r.json();}).catch(e=>{metadata.delete(name);throw e;}));return metadata.get(name);}
worker.onmessage=({data})=>{if(data.progress){const label=document.querySelector('.initial-loading p');if(label)label.textContent=data.progress;return;}const request=pending.get(data.id);if(!request)return;pending.delete(data.id);data.error?request.reject(Error(data.error)):request.resolve(data.value);};
worker.onerror=()=>{for(const request of pending.values())request.reject(Error('The published data could not be loaded. Reload the page or use a current desktop browser.'));pending.clear();};
export async function publicApi(path,params={}){
  if(path==='/api/catalog')return saved('catalog');
  if(path==='/api/lab/options')return saved('lab-options');
  if(path==='/api/lab/runs')return {runs:[await saved('lab')],active_job:null};
  if(path.startsWith('/api/lab/runs/')){const lab=await saved('lab');if(path==='/api/lab/runs/'+lab.run_id)return lab;}
  if(path==='/api/summary'){
    const c=await saved('catalog'),d=c.defaults;
    const same=['sector','rating','membership','liquidity','cusip','q'].every(k=>!params[k]||params[k]==='all')&&
      (!params.start||params.start===d.start)&&(!params.end||params.end===d.end)&&
      (!params.start_time||params.start_time===d.start_time)&&(!params.end_time||params.end_time===d.end_time)&&
      params.session!=='all'&&(!params.evaluation_run||params.evaluation_run===c.evaluation.run_id);
    if(same)return saved('default-summary');
  }
  return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});worker.postMessage({id,path,params});});
}
export function installDownloads(notify){document.addEventListener('click',async event=>{const anchor=event.target.closest('a[href]');if(!anchor)return;const url=new URL(anchor.href,location.href);if(url.origin!==location.origin||!url.pathname.endsWith('/export'))return;event.preventDefault();if(anchor.dataset.exporting)return;anchor.dataset.exporting='true';anchor.setAttribute('aria-busy','true');notify('Preparing every matching row for download…');try{const result=await publicApi('/api/export',Object.fromEntries(url.searchParams));const object=URL.createObjectURL(result.blob),link=document.createElement('a');link.href=object;link.download=result.filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(object),60000);notify('Download ready.');}catch(error){notify(error.message);}finally{delete anchor.dataset.exporting;anchor.removeAttribute('aria-busy');}});}
