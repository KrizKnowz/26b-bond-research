import fs from 'node:fs/promises';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PublicStore,csvCell} from './public-store.js';
const root=path.resolve(import.meta.dirname,'..');
const json=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const manifest=await json('data/manifest.json'),chunks=[];
for(const c of manifest.chunks){const b=await fs.readFile(path.join(root,c.url));assert.equal(createHash('sha256').update(b).digest('hex'),c.sha256);chunks.push(JSON.parse(gunzipSync(b)));}
const catalog=await json('data/catalog.json'),lab=await json('data/lab.json');
const store=new PublicStore(manifest,catalog,await json('data/bonds.json'),chunks,lab,await json('data/lab-options.json'));
const expected=await json('data/default-summary.json'),actual=store.summary({});
assert.deepEqual(actual.selection,expected.selection);
for(const [i,row] of actual.metrics.entries())for(const k of ['mae_bps','rmse_bps','bias_bps','p95_absolute_bps','bond_equal_mae_bps'])assert.ok(Math.abs(row[k]-expected.metrics[i][k])<1e-8,`${row.model} ${k}`);
assert.equal(actual.daily.length,expected.daily.length);
for(const row of actual.daily){const source=expected.daily.find(r=>r.date===row.date&&r.model===row.model);assert.equal(row.n,source.n);assert.ok(Math.abs(row.mae_bps-source.mae_bps)<1e-8);}
for(const test of await json('data/verification.json')){
  const got=store.summary(test.params);assert.deepEqual(got.selection,test.summary.selection);
  for(const m of got.metrics){const reference=test.summary.metrics.find(r=>r.model===m.model);for(const k of ['mae_bps','rmse_bps','bias_bps','p95_absolute_bps','bond_equal_mae_bps']){if(reference[k]==null)assert.equal(m[k],null);else assert.ok(Math.abs(m[k]-reference[k])<1e-8,JSON.stringify(test.params)+' '+k);}}
  const buckets=store.buckets(test.params).rows;assert.equal(buckets.length,test.buckets.rows.length);
  for(const b of buckets){const source=test.buckets.rows.find(r=>r.key===b.key);assert.ok(source);assert.equal(b.n,source.n);assert.equal(b.bonds,source.bonds);for(const m of ['b3','p1','integrated'])assert.ok(Math.abs(b['mae_'+m]-source['mae_'+m])<1e-8);}
}
const records=store.predictions({cusip:'00130HCK9',start:'2026-07-09',end:'2026-07-09'});assert.equal(records.total,2);assert.equal(records.rows[0].actual_price,101.49);
assert.equal(store.bond('00130HCK9',{start:'2026-07-09',end:'2026-07-09'}).series.length,2);
assert.equal(store.buckets({group:'liquidity'}).rows.reduce((s,r)=>s+r.n,0),actual.selection.n);
assert.equal(store.select({start_time:'15:30',end_time:'16:00'}).length,0);
assert.ok(store.select({session:'all',evaluation_run:'saved'}).length>actual.selection.n);
assert.equal(store.predictions({q:'NO_MATCH_AT_ALL'}).total,0);
assert.throws(()=>store.select({start_time:'15:30',end_time:'10:00'}));
assert.equal(csvCell('=bad()'),"'=bad()");assert.equal(csvCell('a,b'),'"a,b"');assert.equal(csvCell(-1),'-1');
const csv=await store.export({kind:'predictions',cusip:'00130HCK9',start:'2026-07-09',end:'2026-07-09'}).blob.text();assert.equal(csv.trim().split('\r\n').length,3);
for(const file of [...catalog.downloads,...lab.downloads]){const b=await fs.readFile(path.join(root,file.url));assert.equal(createHash('sha256').update(b).digest('hex'),file.sha256);assert.ok(b.length<100*1024*1024);}
assert.ok(!(await fs.readFile(path.join(root,'index.html'),'utf8')).includes('href="/static/'));
console.log(`Passed: ${actual.selection.n.toLocaleString()} exact evaluation trades, all model/daily metrics, bond exploration, filters, CSV exports and ${catalog.downloads.length+lab.downloads.length} downloads.`);
