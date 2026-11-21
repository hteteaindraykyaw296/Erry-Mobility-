(()=>{'use strict';const $=s=>document.querySelector(s);const items=[
['utensil','Adapted utensils',['eating'],'A wider or angled handle can change the grasp and path of a spoon.','People who prefer a different grip, reduced wrist movement or supported utensil handling.','An OT can assess handle shape, weight, position and assistance. Swallowing advice is separate.','hands.html#spoon',['Support','Grasp','Bring toward target']],
['grips','Adapted grips',['writing','eating'],'A built-up grip changes the contact area around a pen or utensil.','People exploring a comfortable tool shape or a different grasp.','Ask an OT about sizing, pressure, hygiene and fatigue; a bigger or heavier grip is not automatically easier.','hands.html#writing',['Tool','Grip sleeve','Chosen grasp']],
['fasteners','Dressing adaptations',['dressing'],'Larger pulls, easy fastenings and stable positioning can reduce fine manipulation demands.','People using one hand, different reach or assistance for dressing.','An OT can consider reach, skin comfort, positioning and a suitable fastening.','care.html#dressing',['Stabilise clothing','Locate pull','Move fastening']],
['keyguard','Keyguards',['typing'],'A plate with openings guides access toward individual keys.','People who find key separation or resting a hand useful.','Match the guide to the actual keyboard, access method and reach. An OT or access specialist can assess fit.','typing.html#keyguard-demo',['Finger','Guide opening','Key']],
['switch','Switch access',['typing','communication'],'A deliberate activation can select an item as scanning moves through choices.','People who prefer an accessible activation site to direct pointing.','Assess positioning, activation force, scanning speed, fatigue and reliable stopping with an access professional.','care.html#communication',['Scan choices','Activate switch','Confirm selection']],
['dictation','Dictation software',['typing','communication'],'Speech is converted into editable text; commands can control parts of an interface.','People who choose speech input and whose speech, environment and software are compatible.','Try recognition and correction methods; consider microphone setup, privacy and alternative access when speech input is unsuitable.','typing.html',['Speak or dictate','Review text','Correct or confirm']],
['aac','Communication apps & aids',['communication'],'Symbols, text or recorded messages support expression, with direct, switch or other access.','People who use augmentative or alternative communication, alongside or instead of speech.','A speech and language therapist and access team can help choose vocabulary, language, positioning and access. Offer time and respect the person’s communication.','care.html#communication',['Choose a message','Access a symbol','Express or speak']],
['orthosis','Orthoses',['walking'],'A fitted device supports or positions part of the body; an AFO may support the ankle and foot.','People with individually assessed positioning or movement-support goals.','Requires individual orthotist assessment, fitting, wear guidance and review. The 3D shell cannot establish fit, pressure or support forces.','anatomy.html?model=ankle',['Assessment','Individual fitting','Review comfort']],
['mobility','Mobility aids',['walking'],'Frames, sticks, manual or powered wheelchairs offer different forms of support and access.','People choosing equipment for participation, energy, posture, terrain or distance.','Professional assessment, sizing, training and maintenance matter. Match the aid to the route and person; a household trolley is not automatically a walking aid.','care.html#walking',['Choose a goal','Assess environment','Match support']]
];const access = {
  utensil: ['Match handle to utensil and grip', 'Low–higher', 'Try a different utensil already at home'],
  grips: ['Match sleeve to barrel and grip', 'Low', 'Steady the paper with a clip'],
  fasteners: ['Match to the garment and reach', 'Low–higher', 'Try clothing with a fastener already easy to reach'],
  keyguard: ['Specific keyboard or tablet layout', 'Low–higher', 'Read how fit and key spacing affect access'],
  switch: ['Device, operating system and switch interface', 'Medium–higher', 'Explore built-in scanning options with existing compatible input'],
  dictation: ['Supported language, microphone and app', 'Free–higher', 'Try built-in dictation if available'],
  aac: ['Access method, language, and communication goals', 'Free–higher', 'Try a printable communication board'],
  orthosis: ['Individually fitted to body and footwear', 'Varies with service and coverage', 'Ask about assessment and access pathways'],
  mobility: ['Fit, environment, transport and maintenance', 'Varies with service and coverage', 'Ask about local equipment loans']
};
const links = {
  utensil: 'View spoon demonstration',
  grips: 'Read writing setup considerations',
  fasteners: 'Read dressing setup considerations',
  keyguard: 'View keyguard demonstration',
  switch: 'Read communication setup considerations',
  dictation: 'Open typing practice',
  aac: 'View the communication board example',
  orthosis: 'View the illustrative ankle support',
  mobility: 'Read walking and access considerations'
};
const limits = {
  utensil: 'This does not address swallowing safety.',
  grips: 'More width or weight may increase effort for some people.',
  fasteners: 'A different fastening still needs to match the clothing and task.',
  keyguard: 'A guard does not fit every keyboard or access method.',
  switch: 'Scanning can take more time and practice.',
  dictation: 'Recognition can vary with language, speech, and background noise.',
  aac: 'No one vocabulary layout or access method works for everyone.',
  orthosis: 'A schematic cannot determine pressure, fit, or wear time.',
  mobility: 'The right aid depends on the person, route, and support available.'
};
const selected = new Set();
const phases = {};
const gallery = $('#at-gallery');
const comparison = $('#at-comparison');
const status = $('#gallery-count');

function element(tag, text) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}

function fields(item) {
  const [id, , , how, who, fit] = item;
  const [compatibility, cost, alternative] = access[id];
  const rows = [
    ['Difficulty or goal', who], ['Mechanism', how], ['Compatibility', compatibility],
    ['Setup or fitting', fit], ['Relative cost', cost], ['Limitations', limits[id]],
    ['Starting point', alternative]
  ];
  const list = element('dl');
  for (const [label,value] of rows) list.append(element('dt',label),element('dd',value));
  return list;
}

function renderComparison() {
  comparison.replaceChildren();
  if (!selected.size) {
    comparison.textContent = 'No options selected yet.';
    return;
  }
  for (const item of items.filter(option => selected.has(option[0]))) {
    const card = element('article');
    card.append(element('h3',item[1]),fields(item));
    comparison.append(card);
  }
}

function render() {
  try {
    const task = $('#task-filter').value;
    const list = items.filter(item => task === 'all' || item[2].includes(task));
    gallery.replaceChildren();
    const announce = () => {
      status.textContent = list.length ? list.length+' options shown. '+selected.size+' selected.' : 'No options match this filter.';
    };
    for (const item of list) {
      const [id,name,,how,,,href,steps] = item;
      const card = element('article');
      card.className = 'hub-card gallery-item';
      const image = element('img');
      Object.assign(image,{src:'visuals/equipment-'+id+'.svg',alt:'',width:360,height:144,loading:'lazy'});
      const details = element('details');
      details.append(element('summary','Compatibility, cost and setup'));
      details.append(fields(item));
      const stage = element('p');
      stage.setAttribute('role','status');
      const next = element('button','Next mechanism stage');
      next.type = 'button';
      const draw = () => {
        const index = phases[id] || 0;
        stage.textContent = 'Illustrative stage '+(index+1)+' of '+steps.length+' · '+steps[index];
      };
      next.addEventListener('click', () => {
        phases[id] = ((phases[id] || 0)+1)%steps.length;
        draw();
      });
      draw();
      details.append(stage,next);
      const link = element('a',links[id]);
      link.href = href;
      const label = element('label');
      const check = element('input');
      check.type = 'checkbox';
      check.checked = selected.has(id);
      check.addEventListener('change', () => {
        if (check.checked && selected.size >= 3) {
          check.checked = false;
          status.textContent = 'Choose up to three options. Remove one to add another.';
          return;
        }
        if (check.checked) selected.add(id);
        else selected.delete(id);
        renderComparison();
        announce();
      });
      label.append(check,document.createTextNode(' Compare '+name));
      card.append(image,element('h2',name),element('p',how),details,link,label);
      gallery.append(card);
    }
    announce();
    renderComparison();
  } catch {
    gallery.replaceChildren();
    status.textContent = 'The catalogue could not load. Reload the page or use the caregiver resources below.';
  }
}

$('#task-filter').addEventListener('change', render);
$('#clear-comparison').addEventListener('click', () => { selected.clear(); render(); });
render();
})();
