<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nova Cloud</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;line-height:1.5}
header{background:#111827;color:white;padding:22px 18px}
header h1{font-size:27px}header p{color:#cbd5e1;font-size:14px}
.container{max-width:1100px;margin:auto;padding:20px}
.screen{display:none}.screen.active{display:block}
.back{display:inline-block;margin-bottom:18px;color:#2563eb;font-weight:bold;cursor:pointer}
.hero,.tool,.card,.research-area{background:white;border-radius:16px;border:1px solid #e2e8f0}
.hero{padding:24px;margin-bottom:20px}.hero p{color:#64748b;margin-top:5px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px}
.card{padding:20px;cursor:pointer;transition:.2s}.card:hover{transform:translateY(-2px);box-shadow:0 5px 18px #0001}
.card h3{margin-bottom:7px}.card p{color:#64748b;font-size:14px}
.tool{padding:20px;margin-bottom:18px}
input,textarea{width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:10px;margin:8px 0 14px;font:inherit}
textarea{min-height:120px;resize:vertical}
button{border:0;border-radius:10px;padding:11px 16px;cursor:pointer;font-weight:bold;background:#2563eb;color:white;margin:3px 2px}
button:disabled{opacity:.6;cursor:wait}
button.secondary{background:#e2e8f0;color:#172033}button.green{background:#16a34a}button.red{background:#dc2626}
.actions,.followups{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.badge{display:inline-block;padding:4px 9px;border-radius:20px;background:#e0e7ff;color:#3730a3;font-size:12px;margin-bottom:9px}
.result{background:#f8fafc;border-left:4px solid #2563eb;padding:16px;border-radius:9px;margin-top:15px;white-space:pre-line;overflow-wrap:anywhere}
.chat{max-height:480px;overflow-y:auto;margin:15px 0}
.message{padding:14px;border-radius:12px;margin:10px 0;white-space:pre-line;overflow-wrap:anywhere}
.user{background:#dbeafe;margin-left:12%}.nova{background:#f1f5f9;margin-right:12%}
.question{color:#475569;font-style:italic;margin:8px 0 14px}
.finding{background:#f8fafc;padding:15px;border-radius:10px;margin:10px 0;white-space:pre-line}
.research-area{padding:18px;margin:14px 0}.confirmed{border-left:4px solid #16a34a}
footer{text-align:center;padding:30px;color:#64748b;font-size:13px}
.small{font-size:13px;color:#64748b}
</style>
</head>
<body>
<header><h1>Nova Cloud</h1><p>Research • Innovation • Technology • Business Intelligence</p></header>
<div class="container">
<section id="home" class="screen active">
 <div class="hero"><h2>Nova Cloud</h2><p>A neutral intelligence workspace for questions, ideas, businesses, research, technology and decisions.</p></div>
 <div class="grid">
  <div class="card" onclick="showScreen('research')"><span class="badge">Research</span><h3>Research Workspace</h3><p>Break a question into connected research areas.</p></div>
  <div class="card" onclick="showScreen('business')"><span class="badge">Business Intelligence</span><h3>Business Intelligence</h3><p>Understand businesses, customers, markets and opportunities.</p></div>
  <div class="card" onclick="showScreen('systems')"><span class="badge">Systems</span><h3>Systems</h3><p>Turn problems and ideas into useful systems.</p></div>
  <div class="card" onclick="showScreen('data')"><span class="badge">Data & Analysis</span><h3>Data & Analysis</h3><p>Analyze information, text and numbers.</p></div>
  <div class="card" onclick="showScreen('workspace')"><span class="badge">Cloud Workspace</span><h3>Cloud Workspace</h3><p>Organize projects, ideas and tasks.</p></div>
  <div class="card" onclick="showScreen('innovation')"><span class="badge">Innovation</span><h3>Innovation & Technology</h3><p>Explore unfamiliar ideas and technologies.</p></div>
 </div>
</section>
<section id="research" class="screen">
 <span class="back" onclick="showScreen('home')">← Back to Nova Cloud</span>
 <div class="hero"><h2>Research Workspace</h2><p>Ask one main question. Investigate connected areas, add evidence and connect findings.</p></div>
 <div class="tool"><label for="mainQuestion"><strong>Main Question</strong></label><input id="mainQuestion" placeholder="What do you want to understand?"><button onclick="buildResearchMap()">Build Research Map</button><button class="secondary" onclick="loadResearch()">Load Saved Research</button></div>
 <div id="researchOutput"></div>
</section>
<section id="business" class="screen">
 <span class="back" onclick="showScreen('home')">← Back to Nova Cloud</span>
 <div class="hero"><h2>Business Intelligence</h2><p>Investigate business models, customers, services, markets and opportunities.</p></div>
 <div id="businessChat" class="chat"></div>
 <div class="tool"><input id="businessInput" placeholder="What do you want to understand about a business?" onkeydown="if(event.key==='Enter')sendMessage('business')"><button onclick="sendMessage('business')">Investigate with Nova AI</button><button class="secondary" onclick="clearConversation('business')">New Investigation</button></div>
</section>
<section id="systems" class="screen">
 <span class="back" onclick="showScreen('home')">← Back to Nova Cloud</span>
 <div class="hero"><h2>Systems</h2><p>Describe what you want to build, understand or improve.</p></div>
 <div class="grid">
  <div class="card" onclick="openConversation('system')"><h3>System Builder</h3><p>Investigate a problem and the system needed to address it.</p></div>
  <div class="card" onclick="openConversation('ai')"><h3>AI Projects</h3><p>Explore whether and how AI could help.</p></div>
  <div class="card" onclick="openConversation('technology')"><h3>Technology</h3><p>Understand technologies and how they operate.</p></div>
 </div>
 <div id="systemConversation"></div>
</section>
<section id="data" class="screen">
 <span class="back" onclick="showScreen('home')">← Back to Nova Cloud</span><div class="hero"><h2>Data & Analysis</h2><p>Enter text, numbers, a decision or information to examine.</p></div>
 <div class="tool"><textarea id="dataInput" placeholder="Enter information to analyze"></textarea><button onclick="analyzeDataInput()">Analyze with Nova AI</button><button class="secondary" onclick="clearData()">Clear</button></div><div id="dataOutput"></div>
</section>
<section id="workspace" class="screen">
 <span class="back" onclick="showScreen('home')">← Back to Nova Cloud</span><div class="hero"><h2>Cloud Workspace</h2><p>Create projects and open their research workspace.</p></div>
 <div class="tool"><h3>Create Project</h3><input id="projectName" placeholder="Project name"><textarea id="projectDescription" placeholder="What is this project about?"></textarea><button onclick="createProject()">Create Project</button></div><div id="projects"></div>
</section>
<section id="innovation" class="screen">
 <span class="back" onclick="showScreen('home')">← Back to Nova Cloud</span><div class="hero"><h2>Innovation & Technology</h2><p>Investigate an idea, technology, problem or opportunity with Nova AI.</p></div>
 <div id="innovationChat" class="chat"></div><div class="tool"><input id="innovationInput" placeholder="Enter an idea, technology or problem" onkeydown="if(event.key==='Enter')sendMessage('innovation')"><button onclick="sendMessage('innovation')">Explore with Nova AI</button><button class="secondary" onclick="clearConversation('innovation')">New Investigation</button></div>
</section>
</div>
<footer>Nova Cloud — Research • Innovation • Technology • Business Intelligence</footer>
<script>
"use strict";
const NOVA_AI_URL="https://nova-ai-backend-5wmk.onrender.com";

function showScreen(id){
 document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
 const target=document.getElementById(id);if(target)target.classList.add("active");
 window.scrollTo(0,0);if(id==="workspace")renderProjects();
}
function readStore(key,fallback){
 try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}
}
function writeStore(key,value){
 try{localStorage.setItem(key,JSON.stringify(value));return true}
 catch(e){console.error("Could not save",key,e);return false}
}
function escapeHTML(value){
 return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
const engineRules={
 business:{title:"Business Intelligence",opening:"What are you trying to understand about this business?",areas:["business model","customers","customer problems","products and services","competition","market","marketing","operations","technology","growth opportunities"]},
 system:{title:"System Builder",opening:"What problem, workflow or idea are you trying to turn into a system?",areas:["problem","users","inputs","workflow","technology","data","automation","outputs","risks","success criteria"]},
 ai:{title:"AI Projects",opening:"What are you trying to accomplish, and where might AI help?",areas:["problem","users","current process","data","AI opportunity","automation","limitations","risks","testing","expected result"]},
 technology:{title:"Technology Investigation",opening:"What technology do you want to understand and how does it operate?",areas:["what it is","how it works","components","processes","inputs and outputs","applications","limitations","costs","risks","future opportunities"]},
 innovation:{title:"Innovation Investigation",opening:"What idea, problem, technology or opportunity are you exploring?",areas:["problem","users","existing alternatives","new approach","technology","market","feasibility","opportunity","risks","first experiment"]}
};
let conversations=readStore("novaConversations",{});
function ensureConversation(type){
 if(!conversations[type]||!Array.isArray(conversations[type].messages))conversations[type]={messages:[]};
}
function saveConversations(){writeStore("novaConversations",conversations)}
function conversationInterface(type){
 const rule=engineRules[type];
 return `<div class="tool"><span class="badge">${escapeHTML(rule.title)}</span><p>${escapeHTML(rule.opening)}</p><div id="${type}Chat" class="chat"></div><input id="${type}Input" placeholder="Type your question or reply" onkeydown="if(event.key==='Enter')sendMessage('${type}')"><button onclick="sendMessage('${type}')">Investigate with Nova AI</button><button class="secondary" onclick="clearConversation('${type}')">New Investigation</button></div>`;
}
function openConversation(type){
 if(!engineRules[type])return;
 showScreen("systems");
 const container=document.getElementById("systemConversation");
 container.innerHTML=conversationInterface(type);
 renderConversation(type);
}
function renderConversation(type){
 const chat=document.getElementById(type+"Chat");if(!chat)return;
 chat.innerHTML="";ensureConversation(type);
 conversations[type].messages.forEach(m=>appendMessageElement(chat,m.role,m.text));
 chat.scrollTop=chat.scrollHeight;
}
function appendMessageElement(chat,role,text){
 const div=document.createElement("div");div.className="message "+(role==="user"?"user":"nova");div.textContent=String(text);chat.appendChild(div);
}
function addMessage(type,role,text){
 ensureConversation(type);conversations[type].messages.push({role,text:String(text)});saveConversations();
 const chat=document.getElementById(type+"Chat");if(chat){appendMessageElement(chat,role,text);chat.scrollTop=chat.scrollHeight;}
}
async function connectNovaAI(question,type="research"){
 let response;
 try{
  response=await fetch(`${NOVA_AI_URL}/api/core`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,project:type,mode:"all"})});
 }catch(e){throw new Error("Could not reach the backend. Check the Render service and internet connection.");}
 let data;
 try{data=await response.json()}catch(e){throw new Error("The backend returned an unreadable response.");}
 if(!response.ok||!data||data.success===false)throw new Error(data?.error||`Request failed (HTTP ${response.status}).`);
 return data;
}
function formatAIResult(data) {
let answer =
data?.answer ??
data?.result?.answer ??
data?.result?.ai?.answer ??
data?.ai?.answer ??
data?.result;

if (typeof answer !== "string") {
return "Nova AI returned no readable answer.";
}

answer = answer
.trim()
.replace(/\r\n?/g, "\n")
.replace(/^\s*{\s*"success"\s*:\strue\s,?\s*/i, "")
.replace(/^\s*"answer"\s*:\s*/i, "")
.replace(/\s*}\s*$/, "")
.replace(/^["']|["']$/g, "")
.trim();

// Separate numbered points returned on the same line.
answer = answer.replace(
/\s+(?=\d+\s*[.)]\s+)/g,
"\n"
);

// Remove existing numbering and bullet symbols before rebuilding the list.
let lines = answer
.split(/\n+/)
.map(line => line.trim())
.filter(Boolean);

let points = [];

async function connectNovaAI(question, type = "research") {
function formatAIResult(data) {
  let answer =
    data?.answer ??
    data?.result?.answer ??
    data?.result?.ai?.answer ??
    data?.ai?.answer ??
    data?.result;

  if (typeof answer !== "string") {
    return "Nova AI returned no readable answer.";
  }

  answer = answer
    .trim()
    .replace(/\r\n?/g, "\n");

  // Remove a JSON wrapper if the backend included one.
  try {
    const parsed = JSON.parse(answer);
    if (parsed && typeof parsed.answer === "string") {
      answer = parsed.answer;
    }
  } catch (error) {
    // The answer is ordinary text, so continue.
  }

  answer = answer
    .replace(/^\s*\{\s*"success"\s*:\s*true\s*,?\s*/i, "")
    .replace(/^\s*"answer"\s*:\s*/i, "")
    .replace(/\s*\}\s*$/, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!answer) {
    return "Nova AI returned an empty answer.";
  }

  // Preserve numbered points when already provided.
  const lines = answer
    .replace(/\s+(?=\d+[.)]\s+)/g, "\n")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);

  const points = [];

  for (const line of lines) {
    const clean = line
      .replace(/^(?:\d+[.)]\s*|[-•*]\s+)/, "")
      .trim();

    if (!clean) continue;

    // Keep existing points together.
    if (/^\d+[.)]\s/.test(line)) {
      points.push(clean);
      continue;
    }

    // Split ordinary paragraphs into readable sentences.
    const sentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g);

    if (sentences) {
      sentences.forEach(sentence => {
        const point = sentence.trim();
        if (point) points.push(point);
      });
    } else {
      points.push(clean);
    }
  }

  return points
    .map((point, index) => `${index + 1}. ${point}`)
    .join("\n");
  }
/* RESEARCH WORKSPACE */
let researchQuestion="",researchAreas=[];
function understandResearchQuestion(question){
 const q=String(question||"").toLowerCase(),has=(...words)=>words.some(w=>q.includes(w));
 if(has("digital marketing","online marketing","social media marketing","marketing strategy","marketing campaign","lead generation","advertising","seo","content marketing","marketing skills"))return "digitalMarketing";
 if(has("customer","customers","consumer","consumers","client","clients","buyer","buyers","people need","people want","users need","user needs"))return "customers";
 if(has("market gap","market gaps","missing in the market","cannot find","can't find","underserved","unmet need","unmet needs","lacking","lack of","market opportunity","market opportunities"))return "marketGaps";
 if(has("competitor","competitors","competition","alternative","alternatives","compare","comparison"))return "competition";
 if(has("technology","technologies","computer","computers","software","hardware","engine","engines","ecu","sensor","sensors","artificial intelligence","how does","how do","how it works","how they operate"))return "technology";
 if(has("business idea","business ideas","startup","start-up","start a business","new business","business opportunity","business opportunities"))return "businessIdea";
 if(has("business","company","companies","enterprise","organization","organisation","agency","agencies"))return "business";
 if(has("product","products","service","services","solution","solutions","what does it offer"))return "services";
 if(has("result","results","impact","effectiveness","improve","improvement","performance","success","outcome","outcomes"))return "results";
 if(has("problem","problems","challenge","challenges","difficulties","cause","causes","why does","why do","why is","why are"))return "problems";
 if(has("innovation","innovate","invent","invention","new approach","new solution","develop a new"))return "innovation";
 return "general";
}
const researchPlans={
 customers:[
 ["Customer Needs","What are customers trying to achieve, obtain or improve?","Identify customer goals and needs using customer statements or research."],
 ["Customer Difficulties","What difficulties or unmet needs do customers experience?","Investigate reported difficulties; do not assume all customers share the same problem."],
 ["Current Solutions","How do customers currently meet these needs?","Examine existing products, services and alternatives."],
 ["Unmet Needs","Which needs may remain poorly served?","Compare customer needs with existing solutions and record evidence."],
 ["Buying Decisions","What influences customers to choose and pay for a solution?","Investigate price, trust, convenience, quality and access."],
 ["Customer Evidence","How can these needs be verified?","Identify interviews, surveys, reviews and credible market data."],
 ["Opportunities","What improvements could better serve customers?","Develop opportunities from verified needs and test demand."]
 ],
 marketGaps:[
 ["Target Customers","Who might need the products or services being investigated?","Define relevant customer groups and investigate their needs."],
 ["Unmet Needs","What are customers trying to obtain that existing solutions do not provide adequately?","Identify suspected gaps from customer feedback and examples."],
 ["Existing Offerings","What products, services and alternatives are available?","Examine providers and what they actually offer."],
 ["Limitations and Gaps","Where might current offerings fall short?","Compare needs, prices, accessibility, quality and service."],
 ["Evidence of Demand","What shows customers want a better solution?","Look for customer statements, purchasing behaviour, reviews and credible data."],
 ["Competition","Who already addresses these needs?","Identify direct competitors and alternative solutions."],
 ["Potential Opportunities","Which unmet needs could support a viable offering?","Assess evidence, willingness to pay, feasibility and competition."],
 ["Validation","How can the opportunity be tested before investing heavily?","Design a small interview, service trial or other practical test."]
 ],
 technology:[
 ["Definition and Purpose","What is this technology and what is it designed to do?","Establish its definition, purpose and intended applications."],
 ["How It Works","What processes explain how it operates?","Trace operation step by step using reliable technical explanations."],
 ["Components","What components, inputs and outputs are involved?","Identify the main parts and explain how they interact."],
 ["Problems Addressed","What problems does it solve and for whom?","Connect capabilities to applications and user needs."],
 ["Real-World Applications","Where is the technology used?","Investigate documented applications and practical examples."],
 ["Limitations and Risks","What constraints, costs or risks matter?","Examine reliability, maintenance, safety and cost."],
 ["Evidence and Development","What evidence demonstrates its capabilities?","Consult technical documentation, testing and research."]
 ],
 business:[
 ["Business Purpose","What does the business do, whom does it serve and what value does it offer?","Establish activities, target customers and value proposition."],
 ["Products and Services","What does the business provide?","Investigate offerings, pricing, delivery and customer benefits."],
 ["Customers and Needs","Who does it serve and why do they buy?","Investigate customer groups and reasons for choosing the business."],
 ["Business Model","How does it create, deliver and capture value?","Examine revenue, costs, channels and key resources."],
 ["Market and Competition","What market conditions and alternatives affect it?","Investigate competitors, customer expectations and market changes."],
 ["Evidence of Results","What evidence demonstrates performance?","Identify verifiable results, customer feedback and measures."],
 ["Challenges and Opportunities","What could the business improve or develop?","Connect challenges and market changes to possible improvements."],
 ["Next Actions","What should be investigated or tested next?","Prioritize actions by value, evidence and feasibility."]
 ],
 businessIdea:[
 ["Target Customers","Who might need this product or service?","Define potential customer groups and when they need help."],
 ["Customer Problem","What important need would the idea address?","Investigate whether the problem occurs and matters."],
 ["Existing Solutions","How do customers solve this today?","Investigate competitors, substitutes and workarounds."],
 ["Proposed Value","How might the idea improve the customer's situation?","Describe benefits and distinguish assumptions from evidence."],
 ["Market Demand","Would customers use or pay for it?","Investigate demand signals and willingness to pay."],
 ["Delivery and Costs","What resources and costs are needed?","Estimate delivery requirements and key uncertainties."],
 ["Feasibility","What are the major risks and constraints?","Assess skills, costs, competition and practical limitations."],
 ["Small Test","What is the simplest way to test the idea?","Design a small, measurable experiment."]
 ],
 competition:[
 ["Customer Choice","What are customers trying to achieve?","Identify needs and purchasing criteria."],
 ["Existing Alternatives","Which providers or methods compete?","Identify direct competitors and substitute solutions."],
 ["Offer Comparison","How do alternatives compare?","Compare documented features, quality, price and convenience."],
 ["Customer Experience","What do customers report?","Examine feedback and reviews, noting possible bias."],
 ["Market Gaps","What needs remain poorly served?","Investigate gaps using reliable sources."],
 ["Differentiation","How could an offering provide additional value?","Develop differences that matter to customers and can be delivered."],
 ["Validation","How can customer preferences be tested?","Test preferences and willingness to pay."]
 ],
 services:[
 ["Customer Need","What need is the offering intended to address?","Identify the intended customer and situation."],
 ["Offer and Delivery","What is provided and how is it delivered?","Describe the offering and delivery process."],
 ["Customer Value","What practical benefit should customers receive?","Identify benefits and how they could be measured."],
 ["Alternatives","What other options can customers choose?","Investigate competitors, substitutes and doing nothing."],
 ["Customer Feedback","What do customers report?","Find documented reviews or customer research."],
 ["Improvements","What changes could make the offering more useful?","Connect improvements to demonstrated needs."]
 ],
 problems:[
 ["Problem Definition","What is happening, and what should happen instead?","Define the issue and distinguish symptoms from causes."],
 ["Who Is Affected","Who experiences the problem and when?","Identify affected people and situations."],
 ["Possible Causes","What factors could contribute?","Develop possible explanations, not unverified conclusions."],
 ["Available Evidence","What observations support each explanation?","Gather records, examples and reliable sources."],
 ["Existing Responses","What has already been tried?","Investigate current approaches and their strengths and weaknesses."],
 ["Potential Solutions","Which approaches could address the causes?","Compare solutions, costs, risks and feasibility."],
 ["Testing and Measurement","How could a solution be tested?","Define a manageable test and success criteria."]
 ],
 innovation:[
 ["Need or Opportunity","What need or problem motivates this innovation?","Define the situation and investigate who would benefit."],
 ["Existing Approaches","How is the need currently addressed?","Investigate products, systems and methods."],
 ["New Approach","What would be different?","Explain the proposed change and value."],
 ["Technical Feasibility","What knowledge, components and resources are needed?","Investigate requirements, costs and constraints."],
 ["User and Market Value","Would intended users find it useful?","Test user needs and demand."],
 ["Risks and Limitations","What could prevent it from working?","Identify technical, practical, financial and safety concerns."],
 ["Prototype and Testing","What small experiment could test the idea?","Define a prototype and evidence of success."]
 ],
 results:[
 ["Intended Outcome","What result or change is expected?","Define the outcome and intended beneficiaries."],
 ["Starting Point","What was the situation before the change?","Establish baseline information where available."],
 ["Evidence of Change","What demonstrates the result?","Identify measurable outcomes and supporting sources."],
 ["Other Explanations","What else might explain the change?","Consider alternatives before attributing cause."],
 ["Limitations","What information is missing?","Identify data gaps and limits on conclusions."],
 ["Lessons and Next Steps","What should be improved or tested next?","Translate supported findings into practical steps."]
 ],
 general:[
 ["Meaning and Context","What does the subject mean and what context matters?","Establish definitions and background."],
 ["Main Question","What specifically needs to be understood?","Break the question into smaller questions."],
 ["Relevant Factors","Which people, processes or conditions influence it?","Identify factors relevant to the question."],
 ["Evidence","What information supports available explanations?","Identify credible sources and evidence gaps."],
 ["Different Perspectives","What alternative explanations should be considered?","Compare plausible interpretations."],
 ["Implications","What do findings mean in practice?","Connect supported findings to practical implications."],
 ["Next Investigation","What uncertainty should be investigated next?","Prioritize the next question."]
 ]
};
researchPlans.digitalMarketing=researchPlans.businessIdea;
function getResearchPlan(question){
 const type=understandResearchQuestion(question),plan=researchPlans[type]||researchPlans.general;
 return plan.map(a=>({title:a[0],question:a[1],finding:a[2],evidence:"",confirmed:false,removed:false}));
}
async function buildResearchMap(){
 const input=document.getElementById("mainQuestion"),question=input.value.trim();
 if(!question){alert("Enter a main research question first.");return;}
 researchQuestion=question;researchAreas=getResearchPlan(question);renderResearch();saveResearch();
 const output=document.getElementById("researchOutput"),status=document.createElement("div");
 status.className="result";status.textContent="Nova AI is investigating your research question...";output.prepend(status);
 try{const data=await connectNovaAI(question,"research");status.textContent="NOVA AI INVESTIGATION\n\n"+formatAIResult(data);}
 catch(error){status.textContent="Nova AI connection failed: "+error.message+"\n\nYour research map remains available. Add evidence and notes below.";}
}
function renderResearch(){
 const output=document.getElementById("researchOutput");if(!output)return;
 const active=researchAreas.filter(a=>!a.removed),confirmed=active.filter(a=>a.confirmed).length;
 let html=`<div class="hero"><span class="badge">ACTIVE RESEARCH</span><h2>Main Question</h2><p><strong>${escapeHTML(researchQuestion)}</strong></p><p>${active.length} research areas · ${confirmed} reviewed</p><p>Guidance is not verified evidence. Record sources and observations before treating a conclusion as confirmed.</p></div>`;
 researchAreas.forEach((a,i)=>{if(a.removed)return;html+=`<div class="research-area ${a.confirmed?"confirmed":""}"><span class="badge">RESEARCH AREA ${i+1}</span><h3>${escapeHTML(a.title)}</h3><div class="question">${escapeHTML(a.question)}</div><div class="finding"><strong>Investigation Guidance</strong><p>${escapeHTML(a.finding)}</p></div><div class="finding"><strong>Evidence / Notes</strong><p>${escapeHTML(a.evidence||"No supporting evidence added yet.")}</p></div>${a.confirmed?"<p><strong>Marked reviewed.</strong></p>":""}<div class="actions"><button class="green" onclick="confirmFinding(${i})">${a.confirmed?"✓ Reviewed":"✓ Mark Reviewed"}</button><button class="secondary" onclick="editFinding(${i})">Edit Finding</button><button class="secondary" onclick="editEvidence(${i})">Add Evidence / Notes</button><button class="red" onclick="removeFinding(${i})">Remove</button></div></div>`;});
 html+=`<div class="tool"><h3>Continue the Investigation</h3><p>Add a question or connect your recorded findings.</p><div class="actions"><button onclick="addResearchArea()">+ Add Research Area</button><button class="secondary" onclick="connectFindings()">Connect Findings</button><button class="secondary" onclick="saveResearch()">Save Research</button></div><div id="connectionResult"></div></div>`;
 output.innerHTML=html;
}
function confirmFinding(i){if(!researchAreas[i])return;researchAreas[i].confirmed=!researchAreas[i].confirmed;saveResearch();renderResearch();}
function editFinding(i){const a=researchAreas[i];if(!a)return;const v=prompt("Edit the investigation guidance or finding:",a.finding||"");if(v===null)return;a.finding=v.trim();a.confirmed=false;saveResearch();renderResearch();}
function editEvidence(i){const a=researchAreas[i];if(!a)return;const v=prompt("Add evidence, source details or notes:",a.evidence||"");if(v===null)return;a.evidence=v.trim();a.confirmed=false;saveResearch();renderResearch();}
function removeFinding(i){if(!researchAreas[i]||!confirm("Remove this research area?"))return;researchAreas[i].removed=true;saveResearch();renderResearch();}
function addResearchArea(){const title=prompt("What additional area do you want to investigate?");if(!title||!title.trim())return;const question=prompt("What specific question should this area answer?");if(!question||!question.trim())return;researchAreas.push({title:title.trim(),question:question.trim(),finding:"Investigate the question, gather relevant evidence and record what the evidence supports.",evidence:"",confirmed:false,removed:false});saveResearch();renderResearch();}
function connectFindings(){
 const active=researchAreas.filter(a=>!a.removed),result=document.getElementById("connectionResult");if(!result)return;
 if(!active.length){result.innerHTML='<div class="result">Add a research area first.</div>';return;}
 let text="RESEARCH CONNECTION REVIEW\n\nMain question: "+researchQuestion+"\n\n";
 active.forEach((a,i)=>{text+=(i+1)+". "+a.title+"\nQuestion: "+a.question+"\nFinding: "+(a.finding||"Not recorded")+"\nEvidence: "+(a.evidence||"Not provided")+"\nReview status: "+(a.confirmed?"Reviewed":"Not reviewed")+"\n\n";});
 const withEvidence=active.filter(a=>(a.evidence||"").trim()),without=active.filter(a=>!(a.evidence||"").trim());
 text+="EVIDENCE COVERAGE\nAreas with evidence/notes: "+withEvidence.length+" of "+active.length+"\nAreas needing evidence: "+without.length+"\n\n";
 if(without.length){text+="PRIORITY EVIDENCE GAPS\n";without.forEach(a=>text+="• "+a.title+": "+a.question+"\n");text+="\n";}
 text+="CONNECTIONS TO INVESTIGATE\n• Do findings support the same explanation?\n• Do any findings contradict one another?\n• Which conclusions are supported and which remain assumptions?\n\nNEXT STEP\n"+(without.length?"Gather evidence for areas with no supporting notes.":"Compare evidence, check contradictions and identify the most important unanswered question.")+"\n\nThis organizes your notes; it does not independently verify claims.";
 result.innerHTML=`<div class="result">${escapeHTML(text)}</div>`;
}
function saveResearch(){writeStore("novaResearch",{question:researchQuestion,areas:researchAreas,savedAt:new Date().toISOString()});}
function loadResearch(){
 const d=readStore("novaResearch",null);if(!d){alert("No saved research was found in this browser.");return;}
 researchQuestion=d.question||"";researchAreas=Array.isArray(d.areas)?d.areas.map(a=>({title:a.title||"Untitled Research Area",question:a.question||"",finding:a.finding||"",evidence:a.evidence||"",confirmed:Boolean(a.confirmed),removed:Boolean(a.removed)})):[];
 document.getElementById("mainQuestion").value=researchQuestion;renderResearch();
}

/* DATA ANALYSIS */
async function analyzeDataInput(){
 const input=document.getElementById("dataInput").value.trim(),output=document.getElementById("dataOutput");
 if(!input){alert("Enter information, data, or a problem to analyze.");return;}
 output.innerHTML='<div class="tool"><h3>Nova AI Analysis</h3><p>Investigating your information...</p></div>';
 const tokens=input.split(/[\s,;]+/).filter(Boolean);
 const numeric=tokens.length>0&&tokens.every(x=>/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(x));
 let numericalReport="";
 if(numeric){
  const numbers=tokens.map(Number),sorted=[...numbers].sort((a,b)=>a-b),total=numbers.reduce((a,b)=>a+b,0),middle=Math.floor(numbers.length/2);
  const median=numbers.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
  numericalReport=["NUMERICAL ANALYSIS","Count: "+numbers.length,"Total: "+total,"Mean: "+(total/numbers.length).toFixed(2),"Median: "+median,"Minimum: "+sorted[0],"Maximum: "+sorted[sorted.length-1],"Range: "+(sorted[sorted.length-1]-sorted[0])].join("\n");
 }
 try{
  const data=await connectNovaAI(input,"data-analysis"),answer=formatAIResult(data);
  const combined=numericalReport?numericalReport+"\n\nNOVA AI INVESTIGATION\n"+answer:answer;
  output.innerHTML=`<div class="tool"><h3>Nova AI Analysis</h3><div class="result">${escapeHTML(combined)}</div><div class="actions"><button class="secondary" onclick="dataFollow('Investigate the evidence supporting this analysis')">Investigate Evidence</button><button class="secondary" onclick="dataFollow('Compare alternative explanations and solutions')">Compare Solutions</button><button class="secondary" onclick="dataFollow('Identify the next practical action')">Next Action</button></div></div>`;
 }catch(error){
  const message=numericalReport?numericalReport+"\n\nNova AI connection failed: "+error.message:"Nova AI connection failed: "+error.message;
  output.innerHTML=`<div class="tool"><h3>Analysis Results</h3><div class="result">${escapeHTML(message)}</div><p>Check that your Nova AI backend is running and accessible.</p><button onclick="analyzeDataInput()">Try Again</button></div>`;
 }
}
function dataFollow(task){const input=document.getElementById("dataInput");input.value=input.value.trim()+"\n\nFollow-up: "+task;input.focus();}
function clearData(){document.getElementById("dataInput").value="";document.getElementById("dataOutput").innerHTML="";}

/* PROJECT WORKSPACE */
function createProject(){
 const name=document.getElementById("projectName").value.trim(),description=document.getElementById("projectDescription").value.trim();
 if(!name){alert("Enter a project name.");return;}
 const projects=readStore("novaProjects",[]);projects.push({id:Date.now(),name,description,createdAt:new Date().toISOString()});writeStore("novaProjects",projects);
 document.getElementById("projectName").value="";document.getElementById("projectDescription").value="";renderProjects();
}
function renderProjects(){
 const c=document.getElementById("projects");if(!c)return;const projects=readStore("novaProjects",[]);
 if(!projects.length){c.innerHTML='<div class="tool">No projects yet. Create a project to begin.</div>';return;}
 c.innerHTML=projects.map(p=>`<div class="research-area"><span class="badge">PROJECT</span><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description||"No description provided.")}</p><div class="actions"><button onclick="openProject(${Number(p.id)})">Open Research</button><button class="red" onclick="deleteProject(${Number(p.id)})">Delete</button></div></div>`).join("");
}
function openProject(id){
 const p=readStore("novaProjects",[]).find(x=>Number(x.id)===Number(id));if(!p)return;
 showScreen("research");document.getElementById("mainQuestion").value="What should we understand about "+p.name+"?";buildResearchMap();
}
function deleteProject(id){if(!confirm("Delete this project?"))return;writeStore("novaProjects",readStore("novaProjects",[]).filter(p=>Number(p.id)!==Number(id)));renderProjects();}

document.addEventListener("DOMContentLoaded",()=>{
 renderProjects();
 const saved=readStore("novaResearch",null);
 if(saved){
  researchQuestion=saved.question||"";
  researchAreas=Array.isArray(saved.areas)?saved.areas.map(a=>({title:a.title||"Untitled Research Area",question:a.question||"",finding:a.finding||"",evidence:a.evidence||"",confirmed:Boolean(a.confirmed),removed:Boolean(a.removed)})):[];
  document.getElementById("mainQuestion").value=researchQuestion;
  if(researchQuestion)renderResearch();
 }
 ["business","innovation"].forEach(renderConversation);
});
</script>
</body>
</html>
  
