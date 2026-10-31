'use strict';
const cp=require('child_process'),path=require('path');for(const id of ['data-chart','light-leak','bold-signal']){const r=cp.spawnSync(process.execPath,[path.join(__dirname,id,'test.cjs')],{stdio:'inherit',env:process.env});if(r.status!==0)process.exit(r.status||1)}
const candidate=cp.spawnSync(process.execPath,[path.join(__dirname,'test-candidates.cjs')],{stdio:'inherit',env:process.env});if(candidate.status!==0)process.exit(candidate.status||1);
const r=cp.spawnSync(process.execPath,[path.join(__dirname,'test-io.cjs')],{stdio:'inherit',env:process.env});if(r.status!==0)process.exit(r.status||1);
const python=cp.spawnSync(process.env.OD_STATIC_FONT_PYTHON||'python3',[path.join(__dirname,'test-python-io.py')],{stdio:'inherit',env:process.env});if(python.status!==0)process.exit(python.status||1);
