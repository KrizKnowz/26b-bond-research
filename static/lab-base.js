import {lineChart,COLORS} from './charts.js';
import {modelNames,modelShort} from './labels.js';

const LABELS={custom:'Custom regression',...Object.fromEntries(Object.entries(modelNames).map(([key,label])=>[key,label+' · saved']))};
const CHART_LABELS={custom:'Custom',...modelShort};
const PALETTE={...COLORS,custom:'#0051a5'};
const clone=value=>JSON.parse(JSON.stringify(value));

export class RegressionLab {
  constructor(helpers){
    this.h=helpers;this.options=null;this.draft=null;this.runs=[];this.job=null;this.result=null;
    this.predictions=null;this.predictionPage=1;this.predictionCusip='';this.coefficientPage=1;
    this.openDetails=new Set();this.timer=null;this.active=false;this.version=0;this.error='';this.busy=false;this.loadingResult=false;this.resultRequest=0;this.predictionRequest=0;
  }
  deactivate(){this.active=false;this.version++;clearTimeout(this.timer);this.timer=null;}
  current(version){return this.active&&version===this.version;}
  isRunning(){return this.busy||['queued','running'].includes(this.job?.status);}
  async render(){
    this.active=true;const version=++this.version;clearTimeout(this.timer);
    const [options,history]=await Promise.all([this.h.api('/api/lab/options'),this.h.api('/api/lab/runs')]);
    if(!this.current(version))return;
    this.options=options;this.runs=history.runs||[];if(!this.draft)this.draft=clone(options.defaults);
    this.job=history.active_job||((this.job&&!['queued','running'].includes(this.job.status))?this.job:null);
    const run=new URLSearchParams(location.hash.split('?')[1]||'').get('run')||this.runs[0]?.run_id;
    this.draw();
    if(run&&run!==this.result?.run_id)await this.loadRun(run,false);
    if(this.current(version)&&this.job&&['queued','running'].includes(this.job.status))this.poll();
  }
  select(items,current){const {esc}=this.h;return (items||[]).map(item=>`<option value="${esc(item.id)}" ${item.id===current?'selected':''}>${esc(item.label||item.id)}</option>`).join('');}
  subsetOptions(items,current,label){const {esc}=this.h;return `<option value="">${esc(label)}</option>`+(items||[]).map(item=>{const value=typeof item==='object'?item.id??item.value??item.label:item;return `<option value="${esc(value)}" ${value===current?'selected':''}>${esc(typeof item==='object'?item.label||value:value)}</option>`;}).join('');}
  field(label,name,type='text',extra=''){const {esc}=this.h;return `<label class="lab-field">${esc(label)}<input type="${type}" name="${name}" value="${esc(this.draft[name]??'')}" ${extra}></label>`;}
  draw(){
    if(!this.active||!this.options)return;const {esc,n,date,heading,icon,badge}=this.h,o=this.options,d=this.draft;
    const busy=this.isRunning(),target=o.targets.find(t=>t.id===d.target),groups=[...new Set(o.factors.map(f=>f.group))];
    const features=d.factors.length,enabled=o.factors.filter(f=>(!f.requires_retrospective||d.retrospective_metadata)&&!(d.retrospective_metadata&&f.id==='bond_effects')).length;
    this.h.content.innerHTML=heading('Regression laboratory','Explore what explains the next price.','Choose historical factors, fit a local regression, and compare its price predictions with the three saved models on the same evaluation trades.')+
      `<div class="lab-intro"><div class="lab-intro-mark">${icon('lab')}</div><div><h2>One research question. A reproducible experiment.</h2><p>Change the inputs and inspect the resulting errors, coefficients and predictions. Each run saves its configuration and outputs locally; your existing research snapshots remain available.</p></div>${badge('LOCAL COMPUTE')}</div>
      <form id="lab-form"><fieldset class="lab-fieldset" ${busy?'disabled':''}><div class="lab-layout"><div class="lab-stack">
      <section class="panel"><div class="panel-heading"><div><h2><span class="lab-section-number">01</span>Define the prediction</h2><p class="panel-subtitle">Select an anchor and the correction to estimate.</p></div>${badge('Experimental variant','blue')}</div><div class="panel-body"><div class="lab-form-grid">
      <label class="lab-field wide">Experiment name<input name="name" type="text" maxlength="100" required value="${esc(d.name)}"></label>
      <label class="lab-field wide">Regression target<select name="target">${this.select(o.targets,d.target)}</select></label><label class="lab-field">Estimator<select name="estimator">${this.select(o.estimators,d.estimator)}</select></label>
      <label class="lab-field">Ridge penalty · α<input name="alpha" type="number" min="0.000001" max="100000000" step="any" value="${esc(d.alpha>0?d.alpha:100)}" ${d.estimator==='ols'?'disabled':''}><small>${d.estimator==='ols'?'OLS uses no regularization.':'Penalizes fitted slopes; the intercept is unpenalized.'}</small></label>
      <label class="lab-field">Prediction window<select name="session"><option value="core">10:00 ≤ time &lt; 15:30 ET</option></select><small>Verified target session for the experiment panel.</small></label></div>
      <div class="lab-target-formula">${esc(target?.formula||'')}</div><p class="lab-target-description">${esc(target?.description||'')}</p></div></section>
      <section class="panel"><div class="panel-heading"><div><h2><span class="lab-section-number">02</span>Walk forward through the data</h2><p class="panel-subtitle">Refit each month, predict the following month, then advance one month.</p></div>${icon('calendar')}</div><div class="panel-body"><div class="lab-form-grid">
      <label class="lab-field">Training history<select name="window_type">${this.select([{id:'rolling',label:'Rolling · fixed history length'},{id:'expanding',label:'Expanding · retain earlier history'}],d.window_type)}</select><small>Rolling uses the previous N months. Expanding uses all earlier data after an N-month warm-up.</small></label>
      <label class="lab-field">${d.window_type==='expanding'?'Initial training window':'Training window length'} · months<input name="window_months" type="number" min="1" max="${o.limits?.max_window_months||60}" step="1" required value="${esc(d.window_months)}"><small>Prediction block: one calendar month. Dates are chosen automatically from matched coverage.</small></label></div>
      <div class="lab-split-summary" id="lab-window-preview" aria-live="polite">${this.windowPreview()}</div>
      <p class="lab-coefficient-note">Initial training-only history is available before the first saved forecast month. Each fold refits imputation, scaling, categories and coefficients using earlier available labels only. Months with insufficient observations are listed as skipped. The final month ends at the latest available date.</p>
      <details class="lab-cohort-details" ${['sector','rating','membership','liquidity','cusip'].some(k=>d[k])?'open':''}><summary>Choose a bond or subset of the universe</summary><div class="lab-form-grid">
      <label class="lab-field">Sector<select name="sector">${this.subsetOptions(o.filters?.sectors,d.sector,'All sectors')}</select></label><label class="lab-field">Rating<select name="rating">${this.subsetOptions(o.filters?.ratings,d.rating,'All ratings')}</select></label>
      <label class="lab-field">ETF membership<select name="membership">${this.subsetOptions(o.filters?.memberships,d.membership,'All memberships')}</select></label><label class="lab-field">Liquidity tier<select name="liquidity">${this.subsetOptions(o.filters?.liquidity_tiers,d.liquidity,'All tiers')}</select></label>
      ${this.field('Single bond · CUSIP','cusip','text','maxlength="9" pattern="[A-Za-z0-9]{9}" placeholder="Optional 9-character CUSIP"')}<div class="lab-field"><span>Subset interpretation</span><small>Sector, rating and category liquidity describe current-reference cohorts. These subset filters do not themselves add regression factors. Lab filters are independent of the saved-model views.</small></div></div></details></div></section>
      <section class="panel"><div class="panel-heading" style="padding-bottom:17px"><div><h2><span class="lab-section-number">03</span>Choose the explanatory factors</h2><p class="panel-subtitle">Lagged information enters before the target trade; factor groups may contain several design columns.</p></div><span class="badge-number" id="lab-factor-count">${features} selected</span></div>
      <div class="lab-factor-toolbar"><div class="lab-preset-list">${o.presets.map(p=>`<button class="lab-preset" type="button" data-lab-preset="${esc(p.id)}">${esc(p.label)}</button>`).join('')}</div><div class="lab-factor-actions"><button type="button" data-lab-select="all">Select available (${enabled})</button><span>·</span><button type="button" data-lab-select="none">Clear</button></div></div>
      <div class="lab-factor-list">${groups.map(group=>`<div class="lab-factor-group"><h3>${esc(group)}</h3>${o.factors.filter(f=>f.group===group).map(f=>{const disabled=f.requires_retrospective&&!d.retrospective_metadata;return `<label class="lab-factor ${disabled?'disabled':''}"><input type="checkbox" name="factor" value="${esc(f.id)}" ${d.factors.includes(f.id)?'checked':''} ${disabled?'disabled':''}><span><strong>${esc(f.label)}${f.requires_retrospective?'<span class="factor-tag">Snapshot</span>':''}</strong><small>${esc(f.description)}</small>${f.id==='bond_effects'?'<small class="lab-factor-dependency">Alternative to sector/rating effects. Selecting either removes the other to avoid redundant fixed effects.</small>':''}${f.parents?.length?`<small class="lab-factor-dependency">Requires ${esc(f.parents.map(id=>o.factors.find(x=>x.id===id)?.label||id).join(' + '))}</small>`:''}</span></label>`;}).join('')}</div>`).join('')}</div>
      <div class="lab-retrospective"><input id="lab-retrospective" name="retrospective_metadata" type="checkbox" ${d.retrospective_metadata?'checked':''}><label for="lab-retrospective"><strong>Allow retrospective reference factors</strong><small>Enable current sector, rating, duration and category-liquidity information. Their historical availability is not verified; resulting estimates are exploratory.</small></label></div></section></div>
      <aside class="lab-stack lab-aside"><section class="lab-run-card"><h2>Ready to test the specification</h2><p>Refit month by month, then compare all four price estimates on the combined out-of-sample observations.</p><dl class="lab-run-meta"><dt>Selected factors</dt><dd id="lab-meta-factors">${features||'Intercept only'}</dd><dt>Estimator</dt><dd id="lab-meta-estimator">${esc(d.estimator==='ols'?'OLS':'Ridge · α '+n(d.alpha>0?d.alpha:100))}</dd><dt>Reference factors</dt><dd>${d.retrospective_metadata?'Allowed · retrospective':'Excluded'}</dd><dt>Training + evaluation panel</dt><dd>${n(o.coverage?.rows)} rows</dd></dl><button type="submit" class="button gold" id="lab-submit">${icon('results')}${busy?'Experiment running…':'Run regression'}</button><div class="lab-form-message" id="lab-form-message" role="alert">${esc(this.error)}</div><div id="lab-status" aria-live="polite"></div><div class="lab-run-footer"><strong>Source coverage</strong><br>${date(o.coverage?.start)} – ${date(o.coverage?.end)} · ${n(o.coverage?.bonds)} bonds<br>${n(o.coverage?.training_only_rows||0)} initial training-only rows · evaluation available from ${date(o.coverage?.evaluation_start||o.coverage?.start)}<br>Minimum ${n(o.limits?.min_train??100)} training and ${n(o.limits?.min_test??20)} evaluation observations. Up to ${n(o.limits?.max_rows??500000)} combined observations per fold.</div></section>
      <section class="panel"><div class="panel-heading"><div><h2>Reading the experiment</h2><p class="panel-subtitle">Keep the comparison interpretable.</p></div></div><div class="panel-body"><ul class="lab-warning-list"><li>${icon('info')}These are configurable variants of the previous-price, ETF-adjustment and residual-correction structures; they do not exactly retrain the three saved models.</li><li>${icon('info')}Saved baselines use different training histories. Their price errors are recomputed on the custom test rows.</li><li>${icon('info')}The smoothed-price anchor uses time filtering. This experiment does not rebuild the newer volume-weighted filter.</li><li>${icon('info')}September has already been explored. Repeated comparisons are not an untouched holdout.</li></ul></div></section></aside></div></fieldset></form>
      <section class="panel lab-history-panel"><div class="panel-heading"><div><h2>Latest run</h2><p class="panel-subtitle">Inspect the latest completed experiment or restore its inputs.</p></div><button type="button" class="button compact" id="lab-refresh-history">${icon('reset')}Refresh</button></div><div class="panel-body" id="lab-history">${this.historyHTML()}</div></section>
      <div id="lab-results">${this.result?this.resultHTML():this.emptyResults()}</div>`;
    this.bind();this.drawStatus();this.drawCharts();
  }
  windowSchedule(){
    const c=this.options.coverage||{},n=this.draft.window_months;
    if(!c.start||!c.end||!Number.isInteger(n)||n<1)return [];
    const [year,month]=c.start.split('-').map(Number),first=year*12+month-1;
    const [endYear,endMonth]=c.end.split('-').map(Number),last=endYear*12+endMonth-1;
    const start=m=>`${Math.floor(m/12)}-${String(m%12+1).padStart(2,'0')}-01`;
    const prior=m=>new Date(Date.UTC(Math.floor(m/12),m%12,0)).toISOString().slice(0,10);
    const rows=[];for(let m=first+n;m<=last;m++)if(!c.evaluation_start||start(m).slice(0,7)>=c.evaluation_start.slice(0,7))rows.push({train_start:this.draft.window_type==='expanding'?c.start:[start(m-n),c.start].sort().pop(),train_end:prior(m),test_start:start(m),test_end:[prior(m+1),c.end].sort()[0]});
    return rows;
  }
  windowPreview(){
    const {date,icon}=this.h,rows=this.windowSchedule(),first=rows[0],last=rows.at(-1);
    return icon('clock')+(first?`${rows.length} candidate monthly folds · First: train ${date(first.train_start)} – ${date(first.train_end)}, predict ${date(first.test_start)} – ${date(first.test_end)}. Evaluation continues through ${date(last.test_end)}. Cohort filters may reduce eligible folds.`:'This window leaves no evaluation month. Choose a shorter whole-month window.');
  }
  historyHTML(){const {esc,n,date}=this.h;return this.runs.length?`<div class="lab-history-list">${this.runs.slice(0,1).map(run=>{const custom=(run.metrics||[]).find(m=>m.model==='custom');return `<button type="button" class="lab-history-item ${run.run_id===this.result?.run_id?'active':''}" data-lab-run="${esc(run.run_id)}"><div><strong>${esc(run.name||run.config?.name||run.run_id)}</strong><span>${date(run.config?.test_start||run.selection?.test_start)} – ${date(run.config?.test_end||run.selection?.test_end)} · ${n(run.selection?.test_n)} evaluation trades<br>${run.config?.evaluation_mode==='walk_forward'?`${esc(run.config.window_type)} · ${n(run.config.window_months)} months · ${n(run.selection?.fold_count)} folds`:'Fixed split'} · ${esc((run.config?.estimator||'').toUpperCase())} · ${(run.config?.factors||[]).length} factor groups · ${esc(this.options.targets.find(t=>t.id===run.config?.target)?.label||run.config?.target||'')} · saved ${date(run.created_at)}</span></div><div class="history-score">${n(custom?.mae_bps,3)} bp<small>Custom MAE · inspect →</small></div></button>`;}).join('')}</div>`:'<div class="lab-history-empty">No experiments saved yet. Choose factors and run a regression to begin a reproducible comparison.</div>';}
  emptyResults(){const {icon}=this.h;return `<div class="lab-empty-results">${icon('results')}<h2>The results will appear here</h2><p>Compare price errors, inspect fitted coefficients, and download the complete prediction records for any completed run.</p></div>`;}
  readDraft(){
    const form=document.getElementById('lab-form');if(!form)return;const values=new FormData(form);
    for(const key of ['name','target','estimator','window_type','session','sector','rating','membership','liquidity','cusip'])if(values.has(key))this.draft[key]=String(values.get(key)||'');
    if(values.has('window_months'))this.draft.window_months=Number(values.get('window_months'));
    if(values.has('alpha'))this.draft.alpha=Number(values.get('alpha'));
    this.draft.name=this.draft.name.trim();this.draft.cusip=this.draft.cusip.trim().toUpperCase();
  }
  applyFactor(id,checked){
    const factors=this.options.factors,selected=new Set(this.draft.factors);
    const add=key=>{const f=factors.find(x=>x.id===key);if(!f||(f.requires_retrospective&&!this.draft.retrospective_metadata))return;(f.parents||[]).forEach(add);selected.add(key);};
    if(checked){if(id==='bond_effects')['sector','rating','sector_etf','rating_etf'].forEach(key=>selected.delete(key));else if(['sector','rating','sector_etf','rating_etf'].includes(id))selected.delete('bond_effects');add(id);}else {selected.delete(id);let changed=true;while(changed){changed=false;factors.forEach(f=>{if(selected.has(f.id)&&(f.parents||[]).some(p=>!selected.has(p))){selected.delete(f.id);changed=true;}});}}
    this.draft.factors=factors.filter(f=>selected.has(f.id)).map(f=>f.id);
  }
  syncFactors(){
    document.querySelectorAll('#lab-form input[name="factor"]').forEach(input=>{input.checked=this.draft.factors.includes(input.value);});
    document.getElementById('lab-factor-count').textContent=this.draft.factors.length+' selected';
    document.getElementById('lab-meta-factors').textContent=this.draft.factors.length||'Intercept only';
  }
  bind(){
    const form=document.getElementById('lab-form');form.addEventListener('submit',event=>{event.preventDefault();this.submit();});
    form.addEventListener('input',event=>{if(!['factor','retrospective_metadata'].includes(event.target.name))this.readDraft();if(event.target.name==='window_months')document.getElementById('lab-window-preview').innerHTML=this.windowPreview();});
    form.addEventListener('change',event=>{const {name,value,checked}=event.target;
      if(name==='factor'){this.applyFactor(value,checked);this.syncFactors();return;}
      this.readDraft();
      if(name==='retrospective_metadata'){this.draft.retrospective_metadata=checked;if(!checked)this.draft.factors=this.draft.factors.filter(id=>!this.options.factors.find(f=>f.id===id)?.requires_retrospective);this.draw();}
      else if(['target','estimator','window_type'].includes(name))this.draw();
      else if(name==='alpha')document.getElementById('lab-meta-estimator').textContent='Ridge · α '+this.h.n(this.draft.alpha);
    });
    document.querySelectorAll('[data-lab-preset]').forEach(button=>button.addEventListener('click',()=>{this.readDraft();const preset=this.options.presets.find(p=>p.id===button.dataset.labPreset);this.draft.factors=[];(preset.factors||[]).forEach(id=>this.applyFactor(id,true));if(preset.target)this.draft.target=preset.target;this.error='';this.draw();}));
    document.querySelectorAll('[data-lab-select]').forEach(button=>button.addEventListener('click',()=>{this.draft.factors=[];if(button.dataset.labSelect==='all')this.options.factors.filter(f=>!(this.draft.retrospective_metadata&&f.id==='bond_effects')).forEach(f=>this.applyFactor(f.id,true));this.syncFactors();}));
    document.getElementById('lab-refresh-history').addEventListener('click',()=>this.refreshHistory().catch(e=>this.h.notify(e.message)));
    this.bindHistory();this.bindResults();
  }
  bindHistory(){document.querySelectorAll('[data-lab-run]').forEach(button=>button.addEventListener('click',()=>this.loadRun(button.dataset.labRun,true)));}
  bindResults(){
    document.querySelectorAll('[data-lab-detail]').forEach(detail=>detail.addEventListener('toggle',()=>{if(!detail.isConnected)return;if(detail.open)this.openDetails.add(detail.dataset.labDetail);else this.openDetails.delete(detail.dataset.labDetail);}));
    document.getElementById('lab-restore')?.addEventListener('click',()=>{if(this.isRunning())return;this.draft={...clone(this.options.defaults),...clone(this.result.config),evaluation_mode:'walk_forward'};['train_start','train_end','test_start','test_end'].forEach(k=>delete this.draft[k]);if(!(this.draft.alpha>0))this.draft.alpha=this.options.defaults.alpha||100;this.error='';this.draw();document.getElementById('lab-form').scrollIntoView({behavior:'smooth',block:'start'});this.h.notify(this.result.config.evaluation_mode==='walk_forward'?'Walk-forward configuration restored.':'Saved factors restored with the default walk-forward window. The previous run used a fixed split.');});
    document.querySelectorAll('[data-lab-prediction-page]').forEach(button=>button.addEventListener('click',()=>this.loadPredictions(Number(button.dataset.labPredictionPage))));
    document.querySelectorAll('[data-lab-coefficient-page]').forEach(button=>button.addEventListener('click',()=>{this.coefficientPage=Number(button.dataset.labCoefficientPage);this.refreshResults();}));
    document.getElementById('lab-prediction-filter')?.addEventListener('submit',event=>{event.preventDefault();this.predictionCusip=document.getElementById('lab-prediction-cusip').value.trim().toUpperCase();this.loadPredictions(1);});
  }
  validate(){
    const d=this.draft;if(d.factors.includes('bond_effects')&&d.factors.some(f=>['sector','rating','sector_etf','rating_etf'].includes(f)))throw new Error('Choose either bond fixed effects or sector/rating effects, to avoid redundant fixed effects.');if(!d.name||d.name.length>100)throw new Error('Give this experiment a name of 1–100 characters.');
    if(!Number.isInteger(d.window_months)||d.window_months<1||d.window_months>(this.options.limits?.max_window_months||60))throw new Error('Choose a whole number of training months between 1 and 60.');
    if(!this.windowSchedule().length)throw new Error('This window leaves no evaluation month. Choose a shorter window.');
    if(d.estimator==='ridge'&&(!(d.alpha>0)||d.alpha>100000000))throw new Error('Use a positive Ridge penalty no greater than 100,000,000.');
    if(d.cusip&&!/^[A-Z0-9]{9}$/.test(d.cusip))throw new Error('Enter a nine-character CUSIP, or leave the bond filter empty.');
  }
  async submit(){
    if(this.isRunning())return;this.readDraft();try{this.validate();}catch(e){this.error=e.message;document.getElementById('lab-form-message').textContent=e.message;return;}
    this.busy=true;this.error='';this.job=null;this.draw();
    try{const config=clone(this.draft);if(!(config.alpha>0))config.alpha=this.options.defaults.alpha||100;
      const response=await fetch('/api/lab/runs',{method:'POST',headers:{'Content-Type':'application/json','X-Experiment-Token':this.options.csrf_token,Accept:'application/json'},body:JSON.stringify(config)});
      const value=await response.json().catch(()=>({error:'The local server returned an unreadable response.'}));if(!response.ok)throw new Error(value.error||`Unable to start experiment (${response.status}).`);
      this.job=value;this.busy=false;this.draw();this.poll();
    }catch(e){this.busy=false;this.error=e.message;this.draw();this.h.notify(e.message);}
  }
  drawStatus(){
    const box=document.getElementById('lab-status');if(!box||!this.active)return;const {esc,icon}=this.h,j=this.job;
    if(!j){box.innerHTML='';return;}const running=['running','queued'].includes(j.status);
    box.innerHTML=`<div class="lab-job-status ${esc(j.status)}" role="status"><div class="lab-status-top">${running?'<span class="loading-ring"></span>':icon(j.status==='complete'?'check':'info')}${esc(running?'Local experiment in progress':j.status==='complete'?'Experiment saved':'Experiment could not complete')}</div><p>${esc(j.error||j.stage||j.status)}${running?' · You can browse other research views while the local job continues.':''}</p>${running?'<div class="progress-line"></div>':''}</div>`;
  }
  poll(){
    clearTimeout(this.timer);if(!this.active||!this.job||!['queued','running'].includes(this.job.status))return;
    const id=this.job.job_id,version=this.version;this.timer=setTimeout(async()=>{
      try{const job=await this.h.api('/api/lab/jobs/'+encodeURIComponent(id));if(!this.current(version)||this.job?.job_id!==id)return;this.job=job;this.drawStatus();
        if(job.status==='complete'){await this.refreshHistory();if(job.run_id)await this.loadRun(job.run_id,true);if(this.current(version))this.draw();}
        else if(job.status==='failed'){this.error=job.error||'The local regression failed. Adjust the specification and try again.';this.draw();}
        else this.poll();
      }catch(e){if(!this.current(version))return;this.error='Unable to check job status: '+e.message;const box=document.getElementById('lab-form-message');if(box)box.textContent=this.error;this.timer=setTimeout(()=>this.poll(),2500);}
    },1200);
  }
  async refreshHistory(){
    const version=this.version,value=await this.h.api('/api/lab/runs');if(!this.current(version))return;
    this.runs=value.runs||[];if(value.active_job){this.job=value.active_job;this.poll();}
    const box=document.getElementById('lab-history');if(box){box.innerHTML=this.historyHTML();this.bindHistory();}
  }
  async loadRun(id,scroll=false){
    const version=this.version;this.loadingResult=true;const requestId=++this.resultRequest;
    const existing=document.getElementById('lab-results');existing?.classList.add('loading-overlay');
    try{const result=await this.h.api('/api/lab/runs/'+encodeURIComponent(id));if(!this.current(version)||requestId!==this.resultRequest)return;
      this.result=result;this.openDetails.clear();this.predictionPage=1;this.predictionCusip='';this.coefficientPage=1;
      this.predictions=await this.h.api('/api/lab/runs/'+encodeURIComponent(id)+'/predictions',{page:1,page_size:20});
      if(!this.current(version)||requestId!==this.resultRequest)return;
      history.replaceState(null,'','#lab?run='+encodeURIComponent(id));this.refreshResults(false);
      const historyBox=document.getElementById('lab-history');if(historyBox){historyBox.innerHTML=this.historyHTML();this.bindHistory();}
      if(scroll)document.getElementById('lab-results')?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(e){if(this.current(version)){this.h.notify(e.message);if(!this.result){document.getElementById('lab-results').innerHTML=`<div class="lab-form-message" role="alert">${this.h.esc(e.message)}</div>`;}}}
    finally{this.loadingResult=false;if(this.current(version))document.getElementById('lab-results')?.classList.remove('loading-overlay');}
  }
  async loadPredictions(page){
    if(!this.result)return;const id=this.result.run_id,version=this.version,request=++this.predictionRequest;
    try{const value=await this.h.api('/api/lab/runs/'+encodeURIComponent(id)+'/predictions',{page,page_size:20,cusip:this.predictionCusip});if(!this.current(version)||id!==this.result.run_id||request!==this.predictionRequest)return;this.predictions=value;this.predictionPage=value.page;this.refreshResults();document.getElementById('lab-predictions')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){if(this.current(version))this.h.notify(e.message);}
  }
  refreshResults(preserveDetails=true){if(!this.active)return;const box=document.getElementById('lab-results');if(!box)return;if(preserveDetails)this.openDetails=new Set([...box.querySelectorAll('[data-lab-detail][open]')].map(detail=>detail.dataset.labDetail));box.innerHTML=this.resultHTML();this.bindResults();this.drawCharts();}
  resultHTML(){
    const {esc,n,date,badge,metric,button,icon}=this.h,r=this.result;if(!r)return this.emptyResults();
    const custom=r.metrics?.find(m=>m.model==='custom'),saved=(r.metrics||[]).filter(m=>m.model!=='custom'&&m.mae_bps!=null).sort((a,b)=>a.mae_bps-b.mae_bps)[0];
    const delta=custom?.mae_bps!=null&&saved?custom.mae_bps-saved.mae_bps:null,s=r.selection||{},target=this.options.targets.find(t=>t.id===r.config.target),walk=r.config.evaluation_mode==='walk_forward';
    return `<div class="lab-results"><div class="lab-results-heading"><div><div class="eyebrow">Saved experiment · ${esc(r.run_id)}</div><h2>${esc(r.name||r.config.name)}</h2><p>${esc(target?.label||r.config.target)} · ${walk?`${esc(r.config.window_type)} ${n(r.config.window_months)}-month ${r.config.window_type==='expanding'?'warm-up':'window'} · ${n(s.fold_count)} monthly refits`:`trained ${date(s.train_start)} – ${date(s.train_end)}`} · evaluated ${date(s.test_start)} – ${date(s.test_end)}</p><div class="lab-config-chips">${badge(r.config.estimator==='ridge'?'Ridge · α '+n(r.config.alpha):'OLS','blue')}${badge((r.config.factors||[]).length+' factor groups','plain')}${badge(n(s.design_columns)+(walk?' max. columns / fold':' design columns'),'plain')}${badge(r.config.retrospective_metadata?'Retrospective factors allowed':'Historical factors','plain')}</div></div><div class="heading-actions"><button type="button" id="lab-restore" class="button" ${this.isRunning()?'disabled':''}>${icon('reset')}Restore configuration</button></div></div>
      <div class="metric-grid">${metric('Custom mean absolute error',n(custom?.mae_bps,3),'Price error on the evaluation sample',{unit:'bp',accent:true})}${metric('Difference from best saved MAE',delta==null?'—':(delta>0?'+':'')+n(delta,3),saved?LABELS[saved.model]+' · negative favors custom':'No comparable baseline',{unit:'bp'})}${metric('Evaluation observations',n(s.test_n),n(s.test_bonds)+' bonds · '+(walk?n(s.fold_count)+' completed folds':n(s.train_n)+' training rows'))}</div>
      <section class="panel"><div class="panel-heading" style="padding-bottom:17px"><div><h2>Price prediction comparison</h2><p class="panel-subtitle">All four estimates are evaluated on exactly the same ${n(s.test_n)} target trades.${walk?' Overall metrics pool individual held-out predictions across completed folds.':''}</p></div>${badge('Matched test rows','teal')}</div>${this.metricsHTML(r.metrics)}<div class="panel-footer"><span>Price error = 10,000 × (predicted ÷ observed − 1). Lower MAE / RMSE are better.</span><span>Not a trading return</span></div></section>
      <div class="grid-two lab-comparison" style="margin-top:20px"><section class="panel"><div class="panel-heading"><div><h2>How prediction error changes over time</h2><p class="panel-subtitle">Daily mean absolute error on matched observations</p></div>${this.legend()}</div><div class="panel-body"><div id="lab-daily-chart" class="chart-box"></div><p class="chart-note">Each point summarizes one trading date in this run’s evaluation sample. Hover to inspect model errors and the number of matched trades. The dashed line shows the custom regression.</p></div></section><section class="panel"><div class="panel-heading"><div><h2>Four models. One comparison.</h2><p class="panel-subtitle">Same bonds, timestamps and observed prices</p></div>${badge('MAE','teal')}</div><div class="panel-body">${this.scoreCards(r.metrics)}</div><div class="panel-footer"><span>Overall evaluation sample · lower error is better</span></div></section></div>
      <div class="section-heading"><div><h2>Reproduce and interpret</h2><p>Download the configuration and complete outputs from this run.</p></div></div><section class="panel"><div class="panel-body"><div class="lab-result-downloads">${(r.downloads||[]).map(file=>button(file.title||file.id,file.url,'compact','download',true)).join('')}</div>${this.downloadDetailsHTML()}<details class="config-accordion"><summary>Saved configuration</summary><pre>${esc(JSON.stringify(r.config,null,2))}</pre></details><details class="config-accordion"><summary>Methodology and limitations</summary><ul class="lab-warning-list"><li>${icon('info')}The core window filters target trades. Active saved P0/P1 anchors retain full-session history; optional reconstructed trade-history controls use the return study’s core-session history.</li>${(r.warnings||this.options.notes||[]).map(note=>`<li>${icon('info')}${esc(note)}</li>`).join('')}</ul></details><p class="lab-coefficient-note" style="margin-top:17px">${n(s.unseen_test_bonds)} evaluation bonds were absent from ${walk?'at least one corresponding training fold':'training'}. Source P0 states may contain observations outside the selected target window. These estimates retain the saved zero-delay TRACE assumption.</p></div></section></div>`;
  }
  downloadDetailsHTML(){
    const {n,badge,esc,icon}=this.h,r=this.result,walk=r.config.evaluation_mode==='walk_forward';
    const detail=(id,label,body)=>`<details class="config-accordion lab-download-detail" data-lab-detail="${id}" ${this.openDetails.has(id)?'open':''}><summary>${label}</summary>${body}</details>`;
    return (r.folds?detail('folds','Walk-forward folds',this.foldsHTML()):'')+
      detail('coefficients','Fitted coefficients',`<div class="section-heading"><div><p>${walk?'Each row identifies its prediction month; preprocessing and coefficients are refitted for that fold.':'Training-only transformation; coefficients are associations, not causal effects.'}</p></div>${badge(n((r.coefficients||[]).length)+' terms','plain')}</div><section class="panel lab-coefficients">${this.coefficientsHTML()}<div class="panel-footer"><p class="lab-coefficient-note">Numeric features use one training standard deviation; indicators and ETF interactions use the scale shown. Coefficient magnitude alone is not a reliable ranking of predictive importance.</p></div></section>`)+
      detail('predictions','Evaluation prediction records',`<div class="section-heading"><div><p>Observed and predicted prices per 100 face value · timestamps in US Eastern.</p></div></div><section class="panel" id="lab-predictions"><div class="table-toolbar"><h2>Inspect exact outputs</h2><form class="lab-observation-search" id="lab-prediction-filter"><input type="search" id="lab-prediction-cusip" value="${esc(this.predictionCusip)}" placeholder="Filter by CUSIP" maxlength="9" aria-label="Filter experimental predictions by CUSIP"><button class="button compact" type="submit">${icon('search')}Filter</button></form></div>${this.predictionsHTML()}</section>`);
  }
  foldsHTML(){
    const {esc,n,date,badge}=this.h,r=this.result;if(!r?.folds)return '';
    return `<section class="panel" style="margin-top:20px"><div class="panel-heading"><div><h2>Walk-forward folds</h2><p class="panel-subtitle">${n(r.selection.fold_count)} completed · ${n(r.selection.skipped_folds)} skipped. Each prediction month has an independent fit using earlier labels.</p></div>${badge('Monthly refit','blue')}</div><div class="table-scroll"><table class="data-table"><thead><tr><th>Prediction month</th><th>Training window</th><th>Evaluation through</th><th class="text-right">Train rows</th><th class="text-right">Test rows</th><th class="text-right">Custom MAE · bp</th><th>Status</th></tr></thead><tbody>${r.folds.map(f=>`<tr><td class="mono">${esc(f.test_month)}</td><td>${date(f.train_start)} – ${date(f.train_end)}</td><td>${date(f.test_end)}</td><td class="numeric">${n(f.train_n)}</td><td class="numeric">${n(f.test_n)}</td><td class="numeric">${n(f.custom_mae_bps,3)}</td><td class="wrap">${esc(f.status)}${f.reason?` · ${esc(f.reason)}`:''}${f.excluded_unavailable_labels?` · ${n(f.excluded_unavailable_labels)} unavailable training labels excluded`:''}</td></tr>`).join('')}</tbody></table></div><div class="panel-footer"><span>${n(r.selection.train_n)} distinct training observations; ${n(r.selection.training_row_uses)} training uses across overlapping windows.</span><span>Full cutoff and coefficient records are downloadable.</span></div></section>`;
  }
  legend(){const {esc}=this.h;return `<div class="legend">${Object.keys(CHART_LABELS).map(key=>`<span class="legend-item"><span class="${key==='custom'?'legend-line lab-custom-line':'legend-dot'}" style="${key==='custom'?'border-color':'background'}:${PALETTE[key]}"></span>${esc(CHART_LABELS[key])}</span>`).join('')}</div>`;}
  scoreCards(rows=[]){const {esc,n}=this.h,max=Math.max(...rows.map(r=>r.mae_bps||0),1);return rows.map(row=>`<div class="score-row"><div class="score-topline"><span class="model-name"><span class="legend-dot" style="background:${PALETTE[row.model]}"></span>${esc(row.model==='custom'?'Custom regression':modelNames[row.model]||row.label)}</span><span class="score-number">${n(row.mae_bps,3)} <small>bp</small></span></div><div class="bar-track"><div class="bar-fill" style="background:${PALETTE[row.model]};width:${row.mae_bps==null?0:Math.min(100,100*row.mae_bps/max)}%"></div></div><div class="score-caption"><span>Mean absolute error</span><span>RMSE ${n(row.rmse_bps,3)} bp</span></div></div>`).join('');}
  metricsHTML(rows=[]){const {esc,n,signed}=this.h,best=Math.min(...rows.filter(r=>r.mae_bps!=null).map(r=>r.mae_bps));return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Model</th><th class="text-right">Predictions</th><th class="text-right">MAE · bp</th><th class="text-right">RMSE · bp</th><th class="text-right">Bias · bp</th><th class="text-right">95th percentile · bp</th><th class="text-right">Bond-equal MAE · bp</th></tr></thead><tbody>${rows.map(r=>`<tr><td><span class="model-name"><span class="legend-dot" style="background:${PALETTE[r.model]||'#0051a5'}"></span>${esc(LABELS[r.model]||r.label)}</span></td><td class="numeric">${n(r.n)}</td><td class="numeric ${r.mae_bps===best?'winner':''}">${n(r.mae_bps,3)}</td><td class="numeric">${n(r.rmse_bps,3)}</td><td class="numeric">${signed(r.bias_bps,3)}</td><td class="numeric">${n(r.p95_absolute_bps,3)}</td><td class="numeric">${n(r.bond_equal_mae_bps,3)}</td></tr>`).join('')}</tbody></table></div>`;}
  coefficientsHTML(){
    const {esc,n,signed}=this.h,all=this.result.coefficients||[],page=this.coefficientPage,per=15,rows=all.slice((page-1)*per,page*per);
    if(!all.length)return this.h.empty('No coefficient records','Inspect the saved configuration and prediction outputs for this run.');
    return `<div class="table-scroll"><table class="data-table"><thead><tr>${this.result.folds?'<th>Prediction month</th>':''}<th>Design term</th><th class="text-right">Coefficient</th><th>Feature scale</th><th>Target unit</th></tr></thead><tbody>${rows.map(r=>`<tr>${this.result.folds?`<td class="mono">${esc(r.test_month)}</td>`:''}<td class="wrap mono">${esc(r.feature)}</td><td class="numeric">${signed(r.coefficient,6)}</td><td class="wrap">${esc(r.scale||'See preprocessing artifact')}</td><td class="wrap muted">${esc(r.unit||'')}</td></tr>`).join('')}</tbody></table></div><div class="pagination"><span>${n((page-1)*per+1)}–${n(Math.min(page*per,all.length))} of ${n(all.length)} terms</span><div class="pagination-actions"><button type="button" data-lab-coefficient-page="${page-1}" ${page<=1?'disabled':''}>Previous</button><span>Page ${page} / ${Math.ceil(all.length/per)}</span><button type="button" data-lab-coefficient-page="${page+1}" ${page*per>=all.length?'disabled':''}>Next</button></div></div>`;
  }
  predictionsHTML(){
    const {esc,n,stamp,signed}=this.h,p=this.predictions;if(!p)return '<div class="lab-history-empty" style="padding:22px">Loading prediction records…</div>';
    if(!p.rows?.length)return this.h.empty('No prediction records for this filter','Clear the CUSIP filter to inspect the evaluation sample.');
    return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Timestamp · ET</th><th>CUSIP</th><th class="text-right">Observed</th><th class="text-right">Custom</th><th class="text-right">${modelShort.b3}</th><th class="text-right">${modelShort.p1}</th><th class="text-right">${modelShort.integrated}</th><th class="text-right">Custom error · bp</th></tr></thead><tbody>${p.rows.map(r=>`<tr><td class="mono">${esc(stamp(r.clock))}</td><td><a class="mono" title="Inspect saved model history for this bond and evaluation period" href="#bond?cusip=${encodeURIComponent(r.cusip)}&amp;start=${encodeURIComponent(this.result.selection.test_start.slice(0,10))}&amp;end=${encodeURIComponent(this.result.selection.test_end.slice(0,10))}&amp;session=core&amp;sector=&amp;rating=&amp;membership=&amp;liquidity=">${esc(r.cusip)}</a></td>${['actual_price','custom_price','b3_price','p1_price','integrated_price'].map(k=>`<td class="numeric">${n(r[k],4)}</td>`).join('')}<td class="numeric">${signed(r.error_custom_bps??(r.actual_price&&r.custom_price!=null?10000*(r.custom_price/r.actual_price-1):null),3)}</td></tr>`).join('')}</tbody></table></div><div class="pagination"><span>${n((p.page-1)*p.page_size+1)}–${n(Math.min(p.page*p.page_size,p.total))} of ${n(p.total)} records</span><div class="pagination-actions"><button type="button" data-lab-prediction-page="${p.page-1}" ${p.page<=1?'disabled':''}>Previous</button><span>Page ${n(p.page)} / ${n(Math.ceil(p.total/p.page_size))}</span><button type="button" data-lab-prediction-page="${p.page+1}" ${p.page*p.page_size>=p.total?'disabled':''}>Next</button></div></div>`;
  }
  drawCharts(){
    const target=document.getElementById('lab-daily-chart');if(!this.result||!this.active||!target)return;
    const daily=this.result.daily||[],{date,n}=this.h;
    lineChart(target,{series:Object.keys(CHART_LABELS).map(key=>({key,label:key==='custom'?'Custom regression':CHART_LABELS[key],color:PALETTE[key],width:key==='custom'?2.5:2,dash:key==='custom',data:daily.filter(r=>r.model===key).map(r=>({x:r.date,y:r.mae_bps}))})),height:290,yLabel:'Mean absolute price error (bp)',unit:'bp',precision:3,title:'Daily price error for custom and saved models on identical evaluation observations',formatX:value=>date(value).replace(/ \d{4}$/, ''),tooltipExtra:day=>[{label:'Matched target trades',value:n(daily.find(r=>r.date===day)?.n)}]});
  }
}
