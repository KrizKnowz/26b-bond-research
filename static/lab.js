import {RegressionLab as LocalLab} from './lab-base.js';

export class RegressionLab extends LocalLab {
  async render(){
    this.active=true;const version=++this.version;
    const [options,history]=await Promise.all([this.h.api('/api/lab/options'),this.h.api('/api/lab/runs')]);
    if(!this.current(version))return;
    this.options=options;this.runs=history.runs||[];
    const {heading,icon}=this.h;
    this.h.content.innerHTML=heading('Saved regression experiments','Inspect the latest walk-forward run.','Review the saved setup, matched price errors, coefficients and prediction records.')+
      `<div class="notice-strip">${icon('info')}This public website displays saved results. To change factors or fit a new regression, use the local research application and publish an updated snapshot.</div><div id="lab-results">${this.emptyResults()}</div>`;
    if(this.runs.length)await this.loadRun(this.runs[0].run_id,false);
  }
  resultHTML(){return super.resultHTML().replace(/<div class="heading-actions"><button[^>]*id="lab-restore"[\s\S]*?<\/button><\/div>/,'');}
  emptyResults(){return '<section class="panel"><div class="panel-body">Loading the saved experiment…</div></section>';}
  isRunning(){return false;}
  submit(){throw Error('New regressions run in the local research application.');}
}
