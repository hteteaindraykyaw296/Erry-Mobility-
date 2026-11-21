let engine;
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const descriptions={
character:{title:'Meet your 3D movement guide',subtitle:'A fully modelled, clothed character with animated joints. Turn the view, pause a movement, then reveal a bone overlay.',motion:'Step in place',angle:'Illustrative movement phase',detail:'A stylised movement example—not a person’s CP pattern, a gait assessment or an exercise target.',source:'https://www.who.int/news-room/fact-sheets/detail/rehabilitation',sourceLabel:'WHO rehabilitation overview'},
knee:{title:'Inside the knee: bones, cartilage and ligaments',subtitle:'Rotate a three-dimensional joint, select a structure and watch how the lower leg changes position.',angle:'Illustrative knee bend',detail:'The shapes and ligament paths are approximate. Rolling, sliding, forces, tension, tissue contact and patellar tracking are not biomechanically modelled.',source:'https://medlineplus.gov/ency/presentations/100117_1.htm',sourceLabel:'MedlinePlus: normal knee anatomy'},
ankle:{title:'Explore the ankle—and where support can sit',subtitle:'Inspect the tibia, fibula, talus and heel. Add a schematic orthosis to see its shell, strap and foot plate.',angle:'Illustrative ankle rotation',detail:'The AFO view is static and only shows orientation. It does not model fit, pressure, allowed movement or support forces. A real device needs orthotist assessment.',source:'https://www.guysandstthomas.nhs.uk/health-information/ankle-foot-orthosis',sourceLabel:'NHS: ankle-foot orthoses'},
hand:{title:'From wrist bones to fingertip movement',subtitle:'Explore a three-dimensional hand and forearm. Reveal the bone framework and see several finger joints move together.',angle:'Illustrative finger bend',detail:'Bone shapes, joint axes and soft tissues are simplified. This is not a hand assessment, a recommended grasp or a target range of motion.',source:'https://www.rnoh.nhs.uk/patients-and-visitors/patient-information-guides/patients-guide-completing-activities-daily-living-one-hand',sourceLabel:'RNOH: adapting hand-based tasks'}
};
const structures = {
 character: ['Hips and knees: Their changing positions help describe a step.', 'Support and contact: The scene shows orientation and does not estimate forces.'],
 knee: ['Femur: Thigh bone.', 'Tibia: Larger shin bone.', 'Ligaments: Connect bones and contribute to joint support.'],
 ankle: ['Tibia and fibula: The two lower-leg bones.', 'Talus: A foot bone that meets the lower-leg bones at the ankle.', 'Orthosis: A fitted support device.'],
 hand: ['Carpals: Small wrist bones.', 'Metacarpals: The palm bone framework.', 'Phalanges: Finger bones.']
};
const questions = {
 character: 'How do hip and knee positions change during a step?',
 knee: 'Which bones meet at the knee, and where are the ligaments?',
 ankle: 'Where do the ankle bones meet, and where can a support shell sit?',
 hand: 'How are the wrist, palm, and finger bones arranged?'
};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');let count=0;const instances=[];
function element(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function studio(type,settings={}){
 const d=descriptions[type],uid='anatomy-'+(++count);const box=element('section',undefined,'anatomy-studio');box.dataset.model=type;box.dataset.studioId=uid;
 const heading=element('div',undefined,'anatomy-heading');heading.append(element('h2',questions[type]),element('p',d.subtitle));
 const layout=element('div',undefined,'anatomy-layout');const left=element('div',undefined,'anatomy-display');const viewport=element('div',undefined,'anatomy-viewport');viewport.id=uid+'-viewport';const fallback=element('div',undefined,'anatomy-loading');const modelStatus=element('p','The interactive view is optional.');
 modelStatus.setAttribute('role','status');
 const loadButton=element('button','Load interactive 3D view');
 loadButton.type='button';
 fallback.append(modelStatus,loadButton);
 viewport.append(fallback);
 if(new URLSearchParams(location.search).has('still')) {
   modelStatus.textContent='Still view selected. Use the written guide and recording below.';
   loadButton.hidden=true;
 }
 const stageLabel=element('div',undefined,'stage-label');stageLabel.append(element('span',type==='character'?'MOVEMENT CHARACTER':'ANATOMY CLOSE-UP'),element('span','Drag to rotate · pinch to zoom'));left.append(viewport,stageLabel);
 const toolbar=element('div',undefined,'anatomy-toolbar');const play=element('button','Play movement','anatomy-primary');play.type='button';play.setAttribute('aria-pressed','false');const reset=element('button','Reset view','anatomy-secondary');reset.type='button';const rotate=element('button','Turn view 45°','anatomy-secondary');rotate.type='button';toolbar.append(play,reset,rotate);left.append(toolbar);
 const right=element('div',undefined,'anatomy-inspector');right.append(element('h3','Look beneath the surface'));
 const layerLabel=element('label','Visible layers');layerLabel.htmlFor=uid+'-layers';const layer=element('select');layer.id=uid+'-layers';const choices=type==='character'?[['surface','Clothed character'],['bones','Transparent bone overlay'],['ligaments','Bones + ligament bands']]:type==='hand'?[['bones','Bone framework'],['ligaments','Bones + soft-tissue bands'],['surface','Hand surface']]:[['bones','Bones & cartilage'],['ligaments','Bones + ligament bands']];choices.forEach(([value,text])=>layer.append(new Option(text,value)));layer.value=type==='character'?'surface':'ligaments';right.append(layerLabel,layer);
 const angleLabel=element('label',d.angle);angleLabel.htmlFor=uid+'-angle';const angleOut=element('output','0°');angleOut.id=uid+'-angle-output';angleLabel.append(angleOut);const angle=element('input');Object.assign(angle,{type:'range',id:uid+'-angle',min:type==='ankle'?'-15':'0',max:type==='ankle'?'25':type==='knee'?'70':'65',value:'15'});if(settings.joints)angle.max='110';right.append(angleLabel,angle);
 let support=null;if(['character','ankle'].includes(type)){const l=element('label',undefined,'anatomy-check');support=element('input');support.type='checkbox';support.id=uid+'-support';l.append(support,element('span',type==='ankle'?'Show an orthosis support shell':'Show an illustrative support frame'));right.append(l)}
 const labelsWrap=element('div',undefined,'anatomy-structure-list');right.append(element('h3','Select a structure'),labelsWrap);const info=element('div',undefined,'anatomy-structure-info');const infoTitle=element('strong','Choose a label');const infoText=element('p','Select a numbered marker on the model or a structure name.');info.append(infoTitle,infoText);info.setAttribute('role','status');right.append(info);
 const legend=element('div',undefined,'anatomy-legend');[['#f2e6ce','Bone'],['#6fd9cc','Cartilage'],['#f5bd56','Ligament / soft tissue'],['#4d9bdd','Support']].forEach(([color,title])=>{const l=element('span');const dot=element('i');dot.style.background=color;l.append(dot,document.createTextNode(title));legend.append(l)});right.append(legend);
 toolbar.hidden=true;
 stageLabel.hidden=true;
 right.hidden=true;
 layout.append(left,right);
 const guide=element('section',undefined,'anatomy-disclosure');
 guide.append(element('h3','Still and written guide'));
 const still=element('img');
 Object.assign(still,{src:'media/anatomy-'+type+'.jpg',alt:d.title+' — still view',loading:'lazy'});
 guide.append(still);
 const structureList=element('ul');
 structures[type].forEach(description=>structureList.append(element('li',description)));
 guide.append(structureList);
 const recording=element('details');
 recording.append(element('summary','Watch captioned recording'));
 const video=element('video');
 Object.assign(video,{controls:true,playsInline:true,preload:'none',poster:still.src});
 const videoSource=element('source');
 Object.assign(videoSource,{src:'media/anatomy-'+type+'.mp4',type:'video/mp4'});
 const track=element('track');
 Object.assign(track,{kind:'captions',src:'media/anatomy-'+type+'.vtt',srclang:'en',label:'English',default:true});
 video.append(videoSource,track);
 const mediaStatus=element('p','');
 mediaStatus.setAttribute('role','status');
 const showWrittenGuide=()=>{
   video.hidden=true;
   mediaStatus.textContent='The recording could not load. Use the still and written guide above.';
 };
 videoSource.addEventListener('error',showWrittenGuide);
 video.addEventListener('error',showWrittenGuide);
 recording.append(video,mediaStatus);
 guide.append(recording);const note=element('div',undefined,'anatomy-disclosure');note.append(element('strong','Simplified educational model'),element('p',d.detail+' The motion is authored for explanation and does not prescribe angles, exercise, equipment or safe loading. CP involves the developing brain; these models do not represent a universal CP body or movement pattern.'));const source=element('a',d.sourceLabel+' →');source.href=d.source;note.append(source);box.append(heading,layout,guide,note);
 let api=null,visible=false,yaw=.6,disposed=false;
 function syncPlay(on){play.textContent=on?'Pause movement':'Play movement';play.setAttribute('aria-pressed',String(on))}
 async function init(){
   loadButton.disabled=true;
   modelStatus.textContent='Loading the interactive model…';
   try {
     engine ??= import('./anatomy-engine.js').catch(error=>{engine=null;throw error;});
     const {createStudio}=await engine;
     if(disposed)return;
     api=createStudio(viewport,{...settings,type,title:d.title,onFrame(a){angle.value=String(a);angleOut.textContent=Math.round(a)+'°'},onPlaying:syncPlay,onSelect(l,i){infoTitle.textContent=(i+1)+'. '+l.name;infoText.textContent=l.description;[...labelsWrap.children].forEach((b,j)=>b.setAttribute('aria-pressed',j===i))}});fallback.hidden=true;toolbar.hidden=false;stageLabel.hidden=false;right.hidden=false;play.focus();api.setVisible(visible);api.setLayer(layer.value);api.labels.forEach((l,i)=>{const b=element('button',(i+1)+' · '+l.name);b.type='button';b.onclick=()=>{if(type==='character'&&l.name==='Femur'){layer.value='bones';api.setLayer('bones')}if(['ACL','PCL','MCL','LCL','Ligament bands','Supporting soft tissue'].includes(l.name)){layer.value='ligaments';api.setLayer('ligaments')}api.select(i)};labelsWrap.append(b)});api.select(0);angle.value=String(api.angle);angleOut.textContent=Math.round(api.angle)+'°';api.setPlaying(false);box.dataset.ready='true';instances.push({box,api,angle,angleOut,play,type});}
 catch {
   if(disposed)return;
   modelStatus.textContent='The interactive model could not load. Use the still, written guide, or captioned recording below.';
   loadButton.disabled=false;
   loadButton.textContent='Retry interactive 3D';
 }
 }
 loadButton.addEventListener('click',init);
 play.onclick=()=>{if(!api)return;if(support?.checked){support.checked=false;api.setSupport(false)}api.setPlaying(!api.playing)};reset.onclick=()=>api?.reset();rotate.onclick=()=>{yaw+=Math.PI/4;api?.setView(yaw)};layer.onchange=()=>api?.setLayer(layer.value);angle.oninput=()=>{if(support?.checked){support.checked=false;api?.setSupport(false)}api?.setAngle(Number(angle.value));angleOut.textContent=angle.value+'°';syncPlay(false)};if(support)support.onchange=()=>{api?.setSupport(support.checked);if(support.checked)syncPlay(false)};
 const io=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);api?.setVisible(visible);if(!visible&&api?.playing){api.setPlaying(false);syncPlay(false)}},{rootMargin:'120px'});io.observe(box);
 const onTopic=()=>{if(box.closest('[hidden]')){api?.setVisible(false);api?.setPlaying(false)}};document.addEventListener('topicchange',onTopic);
 box.disposeAnatomy=()=>{disposed=true;io.disconnect();document.removeEventListener('topicchange',onTopic);api?.dispose();const i=instances.findIndex(x=>x.box===box);if(i>=0)instances.splice(i,1)};
 return box;
}
// A detailed anatomy tab is available directly and as the main movement learning view.
if(document.body.classList.contains('theme-move')){
 const deck=q('[data-deck="move"]'),old=q('#clearance');if(old){const prior=old.querySelector('.anatomy-studio');if(prior)prior.replaceWith(studio('knee'));const legend=q('#stairs-svg')?.closest('.model-card');if(legend){const sceneSettings={scene:'stairs',joints:{hip:30,knee:40,ankle:0}};const character=studio('character',sceneSettings);legend.before(character);q('#stairs-result').textContent='The 3D pose uses your selected illustrative joint angles. This is not a safe-clearance rating.';const update=()=>{const joints={hip:Number(q('#joint-hip')?.value||0),knee:Number(q('#joint-knee')?.value||0),ankle:Number(q('#joint-ankle')?.value||0)};sceneSettings.joints=joints;q('#stairs-result').textContent='The 3D pose uses your selected illustrative joint angles. This is not a safe-clearance rating.';const item=instances.find(i=>i.box===character);if(!item)return;item.api.setJoints(joints);item.angle.value=String(joints.knee);item.angleOut.textContent=joints.knee+'°';q('#stairs-result').textContent='The 3D pose uses your selected illustrative joint angles. This is not a safe-clearance rating.';item.play.setAttribute('aria-pressed','false');item.play.textContent='Play movement'};['hip','knee','ankle'].forEach(id=>q('#joint-'+id)?.addEventListener('input',update));q('#stairs-reset')?.addEventListener('click',update);}}
}
// Dedicated studio allows choosing a model without hidden or ambiguous entry points.
if(q('#anatomy-main')){const target=q('#anatomy-main');const first=new URLSearchParams(location.search).get('model');const kind=descriptions[first]?first:'character';let current=studio(kind);target.append(current);qa('[data-anatomy-choice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.anatomyChoice===kind));qa('[data-anatomy-choice]').forEach(b=>b.onclick=()=>{qa('[data-anatomy-choice]').forEach(x=>x.setAttribute('aria-pressed',x===b));current.disposeAnatomy?.();current.remove();current=studio(b.dataset.anatomyChoice);target.append(current);history.replaceState(null,'','anatomy.html?model='+b.dataset.anatomyChoice)});}
reduce.addEventListener('change',()=>{if(reduce.matches){instances.forEach(({api,play})=>{api.setPlaying(false);play.textContent='Play movement';play.setAttribute('aria-pressed','false')});qa('.anatomy-home-card video').forEach(v=>v.pause())}});
export {studio};
