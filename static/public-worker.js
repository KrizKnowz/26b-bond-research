import {PublicStore} from './public-store.js';
const json=async path=>{const response=await fetch(new URL('../'+path,import.meta.url));if(!response.ok)throw Error('Unable to load published file: '+path);return response.json();};
let ready;
async function load(){
  if(!('DecompressionStream' in globalThis))throw Error('Please use a current browser with gzip decompression support.');
  const [manifest,catalog,bonds,lab,options]=await Promise.all(['manifest','catalog','bonds','lab','lab-options'].map(n=>json('data/'+n+'.json')));
  const chunks=[];
  for(const [i,item] of manifest.chunks.entries()){
    postMessage({progress:`Loading research data ${i+1} / ${manifest.chunks.length}…`});
    const response=await fetch(new URL('../'+item.url,import.meta.url));if(!response.ok)throw Error('Unable to load prediction data.');
    const buffer=await response.arrayBuffer();
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),x=>x.toString(16).padStart(2,'0')).join('');
    if(digest!==item.sha256)throw Error('Published prediction checksum mismatch. Reload after the deployment finishes.');
    chunks.push(await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).json());
  }
  return new PublicStore(manifest,catalog,bonds,chunks,lab,options);
}
self.onmessage=async event=>{const {id,path,params}=event.data;try{ready??=load().catch(error=>{ready=null;throw error;});const store=await ready;postMessage({id,value:store.request(path,params)});}catch(error){postMessage({id,error:error.message||String(error)});}};
