#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const entities = {
 boards: ['name','jurisdiction','quorum','pack_days'],
 members: ['board_id','name','role','email','active'],
 meetings: ['board_id','title','meeting_date','status','pack_sent_on','external_id','source_path'],
 agenda_items: ['board_id','meeting_id','title','position','purpose','presenter_id'],
 papers: ['board_id','agenda_item_id','title','owner_id','due_date','received_on','source_path','summary'],
 attendance: ['board_id','meeting_id','member_id','status'],
 minutes: ['board_id','meeting_id','title','body','recorded_on','signed_on','signer_id','source_path'],
 decisions: ['board_id','meeting_id','title','body','decision_date','outcome','external_id','source_path'],
 actions: ['board_id','meeting_id','decision_id','owner_id','title','due_date','status','completed_on','last_update_on','note','external_id','source_path'],
 interests: ['board_id','member_id','title','nature','extent','aware_on','disclosed_on','closed_on','external_id','source_path'],
 work_plan: ['board_id','title','owner_id','due_date','completed_on'],
 notes: ['board_id','title','body'],
};
const refs={meeting_id:'meetings',agenda_item_id:'agenda_items',owner_id:'members',presenter_id:'members',member_id:'members',signer_id:'members',decision_id:'decisions'};
const need=(v,msg)=>{if(v===undefined||v===null||v==='')throw Error(msg);return v;};
const entity=(v)=>{if(!Object.hasOwn(entities,v))throw Error(`Unknown kind ${v}. Choose ${Object.keys(entities).join(', ')}`);return v;};
export function parseArgs(args){const pos=[],flags={};for(const s of args){if(s.startsWith('--')){const i=s.indexOf('=');flags[s.slice(2,i<0?undefined:i)]=i<0?true:s.slice(i+1);}else pos.push(s);}return {pos,flags};}
export async function resolve(db,kind,value,board){
 entity(kind);need(value,`Specify ${kind} name or id`);
 const key=kind==='boards'||kind==='members'?'name':'title';
 const label=kind==='attendance'?"id::text":key;
 const params=[String(value)],scope=board&&kind!=='boards'?' and board_id=$2':'';if(scope)params.push(board);
 let rows=await db.query(`select * from ${kind} where (id::text=$1 or lower(${label})=lower($1))${scope}`,params);
 if(!rows.length)rows=await db.query(`select * from ${kind} where (starts_with(id::text,$1) or position(lower($1) in lower(${label}))>0)${scope} order by ${label}`,params);
 if(rows.length!==1){const error=Error(rows.length?`Ambiguous ${kind}: ${rows.map(r=>`${r.id} ${r[key]||r.id}`).join('; ')}`:`No ${kind} match: ${value}`);error.matches=rows.map(r=>({id:r.id,name:r[key]||r.id}));throw error;}
 return rows[0];
}
const actionSql='select title,owner,board,due_date,days_overdue,days_quiet,status from v_action_chase';
export const insightQueries=[
 ['Which owners carry overdue work across boards?',`select m.name as owner,count(*)::int as overdue_actions,count(distinct a.board_id)::int as boards from actions a join members m on m.id=a.owner_id where a.status in ('open','in-progress') and a.due_date<current_date group by m.name order by overdue_actions desc,m.name`],
 ['Which approved decisions have no follow-up action?',`select b.name as board,d.title,d.decision_date from decisions d join boards b on b.id=d.board_id where d.outcome='approved' and not exists(select 1 from actions a where a.decision_id=d.id) order by d.decision_date,d.title`],
 ['Which upcoming packs are waiting on overdue papers?',`select m.title as meeting,p.title as paper,coalesce(o.name,'Unassigned') as owner,p.due_date from papers p join agenda_items ai on ai.id=p.agenda_item_id join meetings m on m.id=ai.meeting_id left join members o on o.id=p.owner_id where m.status='planned' and p.received_on is null and p.due_date<current_date order by p.due_date`],
 ['Which open actions have been quiet for at least fourteen days?',`${actionSql} where days_quiet>=14 order by days_quiet desc,title`],
 ['Which known interests have no disclosure date?',`select m.name as member,i.title,i.aware_on,b.name as board from interests i join members m on m.id=i.member_id join boards b on b.id=i.board_id where i.disclosed_on is null order by i.aware_on`],
 ['Which held meetings lack a minute record?',`select b.name as board,m.title,m.meeting_date from meetings m join boards b on b.id=m.board_id left join minutes n on n.meeting_id=m.id where m.status='held' and n.id is null order by m.meeting_date`],
 ['Which Australian minutes missed their calendar-month deadline?',`select record,finding,due_date from v_compliance where rule='AU-MINUTE-MONTH' order by due_date`],
 ['Which meetings have fewer recorded attendees than our quorum?',`select board,title,present_count,quorum from v_pack_readiness where id in(select id from meetings where status='held') and present_count<quorum order by title`],
 ['Which work-plan items are overdue or due in the next thirty days?',`select b.name as board,w.title,coalesce(m.name,'Unassigned') as owner,w.due_date from work_plan w join boards b on b.id=w.board_id left join members m on m.id=w.owner_id where w.completed_on is null and w.due_date<=current_date+30 order by w.due_date`],
 ['Which directors own overdue actions and have undisclosed interests?',`select distinct m.name as member,a.title as action,i.title as interest from actions a join members m on m.id=a.owner_id join interests i on i.member_id=m.id where a.status in ('open','in-progress') and a.due_date<current_date and i.disclosed_on is null order by m.name,a.title`],
];
export async function execute(db,args){
 const {pos,flags:f}=parseArgs(args);const [cmd='help',sub,...rest]=pos;
 if(cmd==='help'||f.help)return {commands:['boards','members','meetings','agenda <meeting>','papers','actions','decisions','interests','work-plan','attention','meeting-cycle','minutes-review','compliance','insights [1..10]','show <kind> <name|id>','add <kind> --field=value','update <kind> <name|id> --field=value','log <board> <note>','complete <action>','import boardpro --kind=actions|meetings|decisions|interests --file=reviewed.csv --board=name [--dry-run]','export --out=backup.json','weekly-review','draft-chase <action>'],note:'Reads accept --board=name and --json. Add/update reference fields accept names or ids. Import consumes reviewed CSV transcriptions, not PDF bytes or a native BoardPro CSV export.'};
 const board=f.board?(await resolve(db,'boards',f.board)).id:null;
 const scoped=(sql,col='board_id',order='')=>db.query(sql+(board?` where ${col}=$1`:'')+order,board?[board]:[]);
 if(['boards','members','meetings','papers','decisions','interests'].includes(cmd))return scoped(`select * from ${cmd}`,cmd==='boards'?'id':'board_id',` order by ${cmd==='boards'||cmd==='members'?'name':'title'}`);
 if(cmd==='work-plan')return scoped('select * from work_plan','board_id',' order by due_date,title');
 if(cmd==='actions')return scoped(actionSql,'board_id',' order by due_date,title');
 if(cmd==='agenda'){
  const m=await resolve(db,'meetings',sub,board);return {meeting:m,agenda:await db.query('select * from agenda_items where meeting_id=$1 order by position,title',[m.id]),papers:await db.query('select p.* from papers p join agenda_items a on a.id=p.agenda_item_id where a.meeting_id=$1 order by p.due_date',[m.id])};
 }
 if(cmd==='meeting-cycle')return db.query(`select board,title,meeting_date,pack_due,missing_papers,agenda_count from v_pack_readiness where meeting_date>=current_date${board?' and board_id=$1':''} order by meeting_date`,board?[board]:[]);
 if(cmd==='attention')return db.query(`${actionSql} where (days_overdue>0 or days_quiet>=14)${board?' and board_id=$1':''} order by days_overdue desc,title`,board?[board]:[]);
 if(cmd==='minutes-review')return db.query(`select b.name as board,m.title,m.meeting_date,n.recorded_on,n.signed_on from meetings m join boards b on b.id=m.board_id left join minutes n on n.meeting_id=m.id where m.status='held'${board?' and m.board_id=$1':''} order by m.meeting_date`,board?[board]:[]);
 if(cmd==='compliance')return scoped('select * from v_compliance','board_id',' order by rule,record');
 if(cmd==='insights'){
  if(board)throw Error('Insights cover all boards in this trusted database. Use a separate database for each permission boundary.');
  if(sub!==undefined&&(!/^([1-9]|10)$/.test(sub)))throw Error('Choose insight 1 through 10');
  const output=[];for(let i=0;i<insightQueries.length;i++){if(sub&&Number(sub)!==i+1)continue;const [question,sql]=insightQueries[i];output.push({number:i+1,question,rows:await db.query(sql)});}return output;
 }
 if(cmd==='show')return resolve(db,entity(sub),rest[0],board);
 if(cmd==='add'||cmd==='update'){
  const kind=entity(sub),old=cmd==='update'?await resolve(db,kind,rest[0],board):null;
  const values={};for(const [key,v]of Object.entries(f)){if(['json','board'].includes(key))continue;if(!entities[kind].includes(key))throw Error(`Unknown field ${key} for ${kind}`);values[key]=v==='null'?null:v;}
  if(old&&'board_id'in values&&values.board_id!==old.board_id)throw Error('Moving a record between boards is not supported');
  if(board&&kind!=='boards')values.board_id=board;
  if(kind!=='boards'){
   values.board_id=old?.board_id|| (await resolve(db,'boards',need(values.board_id,'Use --board=name or --board_id=name'))).id;
   for(const [key,target]of Object.entries(refs))if(values[key])values[key]=(await resolve(db,target,values[key],values.board_id)).id;
  }
  if(kind==='actions'){
   if(values.status==='done'&&!values.completed_on)values.completed_on=new Date().toISOString().slice(0,10);
   if(values.status&&values.status!=='done')values.completed_on=null;
   if(cmd==='update'&&!values.last_update_on)values.last_update_on=new Date().toISOString().slice(0,10);
  }
  const keys=Object.keys(values);if(!keys.length)throw Error('Supply at least one field');
  const params=Object.values(values);
  const sql=cmd==='add'?`insert into ${kind} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`:`update ${kind} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${params.push(old.id)} returning *`;
  return (await db.query(sql,params))[0];
 }
 if(cmd==='complete'){
  const a=await resolve(db,'actions',sub,board);return (await db.query("update actions set status='done',completed_on=current_date,last_update_on=current_date where id=$1 returning *",[a.id]))[0];
 }
 if(cmd==='log'){
  const b=await resolve(db,'boards',sub);return(await db.query('insert into notes(board_id,title,body) values($1,$2,$3) returning *',[b.id,'Secretary note',need(rest.join(' '),'Supply note text')]))[0];
 }
 if(cmd==='import')return importBoardPro(db,sub,f,board);
 if(cmd==='export'){
  if(board)throw Error('Export contains every board. Omit --board to confirm whole-database export.');
  const snapshot={format:'board-for-claude-code/v1',exported_at:new Date().toISOString(),records:{}};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const kind of Object.keys(entities))snapshot.records[kind]=await db.query(`select * from ${kind} order by id`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  const out=path.resolve(need(f.out,'Specify --out=backup.json'));fs.writeFileSync(out,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx',mode:0o600});return {file:out,counts:Object.fromEntries(Object.entries(snapshot.records).map(([k,v])=>[k,v.length])),note:'Linked paper and source files must be backed up separately.'};
 }
 if(cmd==='weekly-review'){
  const suffix=board?[`--board=${board}`]:[];const data={meetings:await execute(db,['meeting-cycle',...suffix]),attention:await execute(db,['attention',...suffix]),compliance:await execute(db,['compliance',...suffix])};
  return draft('weekly-review',`# Board weekly review\n\n${Object.entries(data).map(([k,v])=>`## ${k}\n\n${human(v)}`).join('\n\n')}\n`,data);
 }
 if(cmd==='draft-chase'){
  const a=await resolve(db,'actions',sub,board),owner=(await db.query('select * from members where id=$1',[a.owner_id]))[0];
  const decision=a.decision_id?(await db.query('select * from decisions where id=$1',[a.decision_id]))[0]:null;
  return draft('action-chase',`# Draft only: ${a.title}\n\nTo: ${owner.name}\n\nPlease update ${a.title}, due ${a.due_date}.\n\nLatest recorded note: ${a.note||'No note recorded.'}\n${decision?`\nDecision context: ${decision.body}\n`:''}\nNothing has been sent. Review before use.\n`,{action:a,owner,decision});
 }
 throw Error(`Unknown command ${cmd}. Run help.`);
}
function draft(prefix,text,data){const dir=path.resolve(process.env.BOARD_OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2,8)}.md`);fs.writeFileSync(file,text,{flag:'wx',mode:0o600});return {file,data,sent:false};}
export function human(value){
 if(Array.isArray(value)){if(!value.length)return '(none)';if(value[0]?.question)return value.map(x=>`${x.number}. ${x.question}\n${human(x.rows)}`).join('\n\n');const keys=Object.keys(value[0]).filter(k=>!['id','board_id','created_at','updated_at','source'].includes(k)&&!k.endsWith('_id'));return table(value,keys.map(key=>({key,label:key.replaceAll('_',' '),width:70,format:v=>v instanceof Date?v.toISOString():v==null?'':String(v)})));}
 if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${k}: ${typeof v==='object'? '\n'+human(v):v}`).join('\n');
 return String(value??'');
}
async function importBoardPro(db,vendor,f,board){
 if(vendor!=='boardpro')throw Error('Supported import: boardpro');
 need(board,'Import needs --board=name');const kind=f.kind||'actions';if(!['actions','meetings','decisions','interests'].includes(kind))throw Error('Import kind must be actions, meetings, decisions or interests');
 const file=need(f.file,'Specify --file=reviewed.csv');if(!String(file).toLowerCase().endsWith('.csv'))throw Error('Supply reviewed CSV, not a PDF. Read docs/replace-boardpro.md.');
 const rows=parseCsv(fs.readFileSync(file,'utf8'));if(!rows.length)throw Error('CSV has no data rows');
 const mapped=[],seen=new Set();
 for(let i=0;i<rows.length;i++){
  const row=rows[i],get=(...names)=>pick(row,...names).trim(),ext=need(get('External ID','external_id'),`Row ${i+2}: External ID required`);
  if(seen.has(ext))throw Error(`Duplicate External ID ${ext}`);seen.add(ext);
  const r={board_id:board,external_id:ext,title:need(get('Title'),`Row ${i+2}: Title required`),source_path:need(get('Source','source_path'),`Row ${i+2}: Source archive path required`)};
  if(kind==='actions')Object.assign(r,{owner_id:(await resolve(db,'members',need(get('Owner'),'Owner required'),board)).id,due_date:need(get('Due date','due_date'),'Due date required'),status:get('Status')||'open',note:get('Note'),last_update_on:get('Updated','last_update_on')||new Date().toISOString().slice(0,10),completed_on:get('Completed','completed_on')||null});
  if(kind==='meetings')Object.assign(r,{meeting_date:need(get('Date','meeting_date'),'Date required'),status:get('Status')||'held'});
  if(kind==='decisions')Object.assign(r,{body:need(get('Text','body'),'Text required'),decision_date:need(get('Date','decision_date'),'Date required'),outcome:get('Outcome')||'pending'});
  if(kind==='interests')Object.assign(r,{member_id:(await resolve(db,'members',need(get('Member'),'Member required'),board)).id,nature:need(get('Nature'),'Nature required'),extent:need(get('Extent'),'Extent required'),aware_on:need(get('Aware','aware_on'),'Aware date required'),disclosed_on:get('Disclosed','disclosed_on')||null,closed_on:get('Closed','closed_on')||null});
  if(['actions','decisions'].includes(kind)&&get('Meeting'))r.meeting_id=(await resolve(db,'meetings',get('Meeting'),board)).id;
  if(kind==='actions'&&get('Decision'))r.decision_id=(await resolve(db,'decisions',get('Decision'),board)).id;
  for(const [key,value]of Object.entries(r)){if((key.endsWith('_date')||key.endsWith('_on'))&&value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error(`Row ${i+2}: ${key} must be a real YYYY-MM-DD date`);}}
  mapped.push(r);
 }
 await db.exec('BEGIN');try{
  for(const r of mapped){const keys=Object.keys(r),updates=keys.filter(k=>!['board_id','external_id'].includes(k));await db.query(`insert into ${kind} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1))}) on conflict(board_id,external_id) do update set ${updates.map(k=>`${k}=excluded.${k}`).join(',')}`,Object.values(r));}
  await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');
 }catch(e){await db.exec('ROLLBACK');throw e;}
 return {kind,rows:mapped.length,dry_run:Boolean(f['dry-run']),note:'Reviewed CSV records loaded. Source files remain in your archive; no PDF extraction or copying is performed.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;const args=process.argv.slice(2),json=args.includes('--json');try{db=await getDb();const out=await execute(db,args);console.log(json?JSON.stringify(out,null,2):human(out));}catch(e){if(json)console.log(JSON.stringify({error:e.message,...(e.matches?{matches:e.matches}:{})}));else console.error(e.message);process.exitCode=1;}finally{await db?.close();}
}
