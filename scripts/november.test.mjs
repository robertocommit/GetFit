import assert from 'node:assert/strict';
import {test} from 'node:test';
import {workouts,schedule} from '../src/lib/program.ts';
import {cervicalGuides} from '../src/lib/cervical-guides.ts';
import {cervicalExercises,newTrainingContext,novemberExercises,novemberWeek,seedLogs,sessionExercises,runTarget,previousExercise} from '../src/lib/november.ts';
import {validateSession} from '../src/lib/session-validation.ts';

const expected={
 A:{squat:[[8,52.5],[9,52.5],[8,55],[10,55]],bench:[[8,52.5],[9,52.5],[8,55],[10,55]],row:[[8,55],[9,55],[10,55],[10,55]],lateral:[[10,7],[11,7],[12,7],[12,7]],curl:[[10,10],[11,10],[12,10],[12,10]],carry:[[1,16],[1,16],[1,16],[1,16]],'dead-bug':[[30,null],[30,null],[30,null],[30,null]]},
 B:{rdl:[[10,50],[8,52.5],[9,52.5],[10,52.5]],'incline-db':[[10,12],[11,12],[12,12],[12,12]],pulldown:[[10,50],[11,50],[12,50],[12,50]],'split-squat':[[10,4],[11,4],[12,4],[12,4]],'face-pull':[[10,17.5],[11,17.5],[12,17.5],[12,17.5]],shrug:[[10,20],[11,20],[12,20],[12,20]],'dead-hang':[[40,null],[40,null],[40,null],[40,null]],'pallof-hold':[[20,null],[20,null],[20,null],[20,null]]},
 C:{'leg-press':[[10,130],[11,130],[10,140],[10,140]],bench:[[10,50],[11,50],[12,50],[8,52.5]],row:[[10,50],[11,50],[12,50],[8,55]],pulldown:[[10,50],[11,50],[12,50],[12,50]],lateral:[[12,8],[13,8],[14,8],[14,8]],pushdown:[[10,12.5],[11,12.5],[12,12.5],[10,15]],curl:[[10,10],[11,10],[12,10],[12,10]],carry:[[1,20],[1,20],[1,20],[1,20]],'side-plank':[[20,null],[20,null],[20,null],[20,null]]}
};
const dates=['03','05','07','10','12','14','17','19','21','24','26','28'].map(d=>`2026-11-${d}`);
function session(date='2026-11-03',type='A') {
 const trainingContext=newTrainingContext(date,type);
 return {date,type,completedAt:null,skippedReason:null,skippedAt:null,durationMinutes:null,cardioMinutes:null,notes:'',trainingContext,logs:Object.fromEntries(trainingContext.exercises.map(e=>[e.id,seedLogs(e)]))};
}

test('all twelve dates, weekday types, complete strength targets and exact sets',()=>{
 const actual=schedule('2026-08-18').filter(d=>d.date>='2026-11-02'&&d.date<='2026-11-29');
 assert.deepEqual(actual.map(d=>d.date),dates);
 actual.forEach(({date,type},i)=>{
  assert.equal(type,['A','B','C'][i%3]);const week=Math.floor(i/3),ex=novemberExercises(date,type);
  assert.equal(new Set(ex.map(e=>e.id)).size,ex.length);
  for(const [id,values] of Object.entries(expected[type])){
   const e=ex.find(e=>e.id===id);assert.ok(e,`${date}: ${id}`);
   assert.deepEqual([e.target.reps,e.target.weight],values[week],`${date}: ${id}`);
   assert.equal(e.sets,['dead-bug','pallof-hold','side-plank'].includes(id)?2:['dead-hang','split-squat','face-pull','shrug'].includes(id)?3:4,`${date}: ${id} sets`);
  }
  assert.ok(!ex.some(e=>['neck-iso','neck-lateral'].includes(e.id)));
 });
});
test('five complete cervical guides, safe visual fallback and no manual resistance alternative',()=>{
 for(const e of cervicalExercises(0)){
  const g=cervicalGuides[e.id];assert.ok(g);for(const k of ['equipment','setup','steps','breathing','mistakes','safety','benefit','longTermBenefit'])assert.ok(g[k]?.length);
  assert.ok(e.technicalName&&e.muscles);assert.equal(e.increment,null);
  assert.equal(g.requiresDemonstration,e.id!=='chin-nod');
 }
});
test('exact cervical dose progression and two separate lateral sides',()=>{
 for(let week=0;week<4;week++) for(const e of cervicalExercises(week)){
  const iso=['band-neck-flexion','band-neck-extension','band-neck-lateral'].includes(e.id);
  assert.equal(e.target.reps,(iso?[5,6,6,6]:[8,9,10,10])[week]);
  assert.equal(e.target.holdSeconds,(iso?[5,5,7,8]:[5,5,5,6])[week]);
  const logs=seedLogs(e);assert.equal(logs.length,e.id==='band-neck-lateral'?4:2);
  if(e.id==='band-neck-lateral')assert.deepEqual(logs.map(l=>l.side),['left','left','right','right']);
  assert.ok(logs.every(l=>l.weight===null&&!l.completed&&l.holdSeconds===5));
 }
});
test('no date-driven escalation, no automatic completed logs, neutral loads stay null',()=>{
 for(const date of dates){const s=session(date,date.endsWith('05')?'B':'A');assert.ok(Object.values(s.logs).flat().every(l=>!l.completed));}
 const e=novemberExercises('2026-11-17','A').find(e=>e.id==='squat');
 const baseline=[{setNumber:1,reps:8,weight:50,effort:2,completed:true,skipped:false}];
 assert.ok(seedLogs(e,baseline).every(l=>l.weight===50&&l.reps===8&&!l.completed));
 assert.equal(novemberExercises('2026-11-05','B').find(e=>e.id==='pallof-hold').target.weight,null);
 assert.equal(seedLogs(novemberExercises('2026-11-05','B').find(e=>e.id==='pallof-hold'))[0].weight,null);
});
test('legacy data and exercise definitions remain untouched; completed November records keep old IDs',()=>{
 const before=JSON.stringify(workouts);const old={date:'2026-10-13',type:'A',completedAt:'done',logs:{'neck-iso':[{setNumber:1,reps:20,weight:null,completed:true}],bench:[{setNumber:1,reps:8,weight:50,completed:true}]}};
 const copy=JSON.stringify(old);novemberExercises('2026-11-03','A');sessionExercises(old);
 assert.equal(JSON.stringify(old),copy);assert.equal(JSON.stringify(workouts),before);
 assert.ok(sessionExercises({...old,date:'2026-11-03'}).some(e=>e.id==='neck-iso'));
 assert.equal(newTrainingContext('2026-10-31','C'),null);assert.equal(newTrainingContext('2026-11-30','A'),null);
});
test('API validation preserves NR, seconds and sides and rejects fake kg without requiring consent checkboxes',()=>{
 const s=session('2026-11-05','B'),id='band-neck-lateral';assert.equal(validateSession(s),null);
 s.logs[id][0].completed=true;assert.equal(validateSession(s),null);
 s.logs[id][0].weight=1;assert.ok(validateSession(s));s.logs[id][0].weight=null;
 s.logs[id][0].side=null;assert.ok(validateSession(s));s.logs[id][0].side='left';
 s.logs[id][0].holdSeconds=0;assert.ok(validateSession(s));
});
test('can record and finish cervical work without the removed approval and pain forms',()=>{
 const s=session();for(const logs of Object.values(s.logs))for(const l of logs)l.skipped=true;
 const id='chin-nod';s.logs[id].forEach(l=>{l.skipped=false;l.completed=true;});
 assert.equal(s.trainingContext.physioApproved,false);assert.equal(s.trainingContext.painAfter,null);
 assert.equal(validateSession({...s,completed:true}),null);
 s.logs[id][0].completed=false;assert.ok(validateSession({...s,completed:true}));
});
test('running Wednesday targets, plan bounds, and latest partial workout retained',()=>{
 for(const [d,km]of [['04',1.5],['11',1.8],['18',2.1],['25',2.5],['02',1.3],['06',1.3]])assert.equal(runTarget(`2026-11-${d}`),km);
 assert.equal(novemberWeek('2026-11-30'),null);
 const first=session('2026-11-03'),latest=session('2026-11-10');first.completedAt='done';
 assert.equal(previousExercise([first,latest],'2026-11-17','A','squat'),latest);
});


test('cannot close November with missing planned sets or an unrecorded lateral side',()=>{
 const s=session('2026-11-05','B');for(const logs of Object.values(s.logs))for(const l of logs)l.skipped=true;
 assert.equal(validateSession({...s,completed:true}),null);
 const original=s.logs.rdl;s.logs.rdl=original.slice(0,1);assert.ok(validateSession({...s,completed:true}));s.logs.rdl=original;
 s.logs['band-neck-lateral'].forEach(l=>l.side='left');assert.ok(validateSession({...s,completed:true}));
});
