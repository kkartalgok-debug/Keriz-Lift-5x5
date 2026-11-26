const KEY="lift5x5-v1";
const defaults={weights:{Squat:20,"Bench Press":20,"Barbell Row":20,"Overhead Press":20,Deadlift:40},increments:{Squat:2.5,"Bench Press":2.5,"Barbell Row":2.5,"Overhead Press":2.5,Deadlift:5},history:[],next:"A",unit:"kg",rest:180,session:null};
let state=load(),timer=null,remaining=state.rest,running=false;
const $=id=>document.getElementById(id);
const workouts={A:[["Squat",5],["Bench Press",5],["Barbell Row",5]],B:[["Squat",5],["Overhead Press",5],["Deadlift",1]]};
function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return structuredClone(defaults)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function fmt(n){return Number(n).toLocaleString(undefined,{maximumFractionDigits:2})}
function render(){
 $("sessionName").textContent="Workout "+state.next;$("sessionDate").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
 $("exerciseList").innerHTML=workouts[state.next].map(([name,reps],i)=>{let w=state.weights[name],done=state.session?.sets?.[name]||[];return `<article class="exercise"><div class="exhead"><h3>${name}</h3><span>${reps} × ${reps===1?"1":"5"} ${reps===1?"working set":"working sets"}</span></div><div class="weightrow"><button data-adjust="-1" data-name="${name}">−</button><div><strong>${fmt(w)} ${state.unit}</strong><small> · working weight</small></div><button data-adjust="1" data-name="${name}">+</button></div><div class="sets">${Array.from({length:reps},(_,j)=>`<button class="set ${done.includes(j)?"done":""}" data-set="${j}" data-name="${name}"><b>${done.includes(j)?"✓":"SET "+(j+1)}</b>${fmt(w)} ${state.unit} × ${name==="Deadlift"?5:5}</button>`).join("")}</div></article>`}).join("");
 $("exerciseList").querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>toggleSet(b.dataset.name,+b.dataset.set));
 $("exerciseList").querySelectorAll("[data-adjust]").forEach(b=>b.onclick=()=>{let n=b.dataset.name;state.weights[n]=Math.max(0,Math.round((state.weights[n]+(+b.dataset.adjust)*0.5)*2)/2);save();render()});
 renderProgress();renderHistory();updateTimer();
}
function toggleSet(name,index){state.session??={sets:{}};state.session.sets[name]??=[];let a=state.session.sets[name];a.includes(index)?state.session.sets[name]=a.filter(x=>x!==index):a.push(index);save();render();if(!a.includes(index))return;startTimer()}
function finish(){
 let all=workouts[state.next].every(([n,count])=>(state.session?.sets?.[n]||[]).length===count);
 if(!all&&!confirm("Some sets are not marked complete. Save this workout anyway?"))return;
 let successful=all,record={date:new Date().toISOString(),workout:state.next,successful,exercises:workouts[state.next].map(([name])=>({name,weight:state.weights[name],sets:(state.session?.sets?.[name]||[]).length}))};
 state.history.unshift(record);
 if(successful){for(let [name] of workouts[state.next])state.weights[name]=Math.round((state.weights[name]+state.increments[name])*100)/100}
 state.next=state.next==="A"?"B":"A";state.session=null;save();stopTimer();render();alert(successful?"Workout saved. Weights increased for next time.":"Workout saved. Weights unchanged because not all sets were completed.");
}
function renderProgress(){
 let h=state.history,success=h.filter(x=>x.successful).length;$("stats").innerHTML=`<div class="stat"><b>${h.length}</b><small>WORKOUTS LOGGED</small></div><div class="stat"><b>${success}</b><small>SUCCESSFUL SESSIONS</small></div>`;
 let vals=h.slice(0,12).reverse().map(x=>Math.max(...x.exercises.map(e=>e.weight)));let max=Math.max(...vals,1);
 $("chart").innerHTML=vals.length?vals.map((v,i)=>`<div class="barwrap"><div class="bar" style="height:${Math.max(4,v/max*135)}px"></div><small>${i+1}</small></div>`).join(""):'<div class="empty">Complete workouts to see your chart.</div>';
 $("currentWeights").innerHTML=Object.entries(state.weights).map(([n,w])=>`<div class="weightline"><span>${n}</span><span>${fmt(w)} ${state.unit}</span></div>`).join("");
}
function renderHistory(){$("historyList").innerHTML=state.history.length?state.history.map(x=>`<div class="historyitem"><div><b>Workout ${x.workout} ${x.successful?"· Completed":"· Partial"}</b><small>${new Date(x.date).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</small></div><span>${x.exercises.map(e=>`${e.name}: ${fmt(e.weight)}`).join("<br>")}</span></div>`).join(""):'<div class="empty">Your completed sessions will appear here.</div>'}
function startTimer(){remaining=state.rest;running=true;clearInterval(timer);timer=setInterval(()=>{if(remaining>0){remaining--;updateTimer()}else{clearInterval(timer);running=false; if("vibrate"in navigator)navigator.vibrate([200,100,200]);updateTimer()}},1000);$("timerDock").classList.remove("hidden");updateTimer()}
function stopTimer(){clearInterval(timer);running=false;$("timerDock").classList.add("hidden")}
function updateTimer(){$("timerText").textContent=`${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;$("timerToggle").textContent=running?"PAUSE":"RESUME"}
function modal(title,html){$("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modal").classList.remove("hidden")}
$("tabs").onclick=e=>{let b=e.target.closest("[data-tab]");if(!b)return;document.querySelectorAll(".tab,.page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")};
$("finishBtn").onclick=finish;
$("warmupBtn").onclick=()=>{let exercises=workouts[state.next];modal("Warm-up calculator",`<p class="muted">Warm-up sets are calculated from your current working weight. Round to the nearest 2.5 ${state.unit}.</p>${exercises.map(([n])=>{let w=state.weights[n],r=x=>Math.round(w*x/2.5)*2.5;return `<div class="panel"><b>${n} · Working weight ${fmt(w)} ${state.unit}</b><div class="warmrow"><span>Warm-up 1 · 5 reps</span><b>${fmt(r(.4))} ${state.unit}</b></div><div class="warmrow"><span>Warm-up 2 · 3 reps</span><b>${fmt(r(.6))} ${state.unit}</b></div><div class="warmrow"><span>Warm-up 3 · 2 reps</span><b>${fmt(r(.8))} ${state.unit}</b></div></div>`}).join("")}`)};
$("settingsBtn").onclick=()=>modal("Settings",`<div class="field"><label>WEIGHT UNIT</label><select id="unit"><option ${state.unit==="kg"?"selected":""}>kg</option><option ${state.unit==="lb"?"selected":""}>lb</option></select></div><div class="field"><label>REST TIMER (SECONDS)</label><input id="rest" type="number" min="30" max="600" value="${state.rest}"></div><p class="muted">Changing units changes the label only; it does not convert your stored weights. Resetting data permanently clears this device's workout history and settings.</p><button class="primary" id="saveSettings" style="width:100%">SAVE SETTINGS</button><button class="secondary" id="resetData" style="width:100%;margin-top:9px">RESET ALL DATA</button>`);
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("modal").onclick=e=>{if(e.target.id==="modal")$("modal").classList.add("hidden")};
$("modalBody").onclick=e=>{if(e.target.id==="saveSettings"){state.unit=$("unit").value;state.rest=Math.max(30,Math.min(600,+$("rest").value||180));save();$("modal").classList.add("hidden");render()}if(e.target.id==="resetData"&&confirm("Delete all workout data on this device?")){state=structuredClone(defaults);save();$("modal").classList.add("hidden");render()}};
$("timerToggle").onclick=()=>{if(running){clearInterval(timer);running=false}else{running=true;timer=setInterval(()=>{if(remaining>0){remaining--;updateTimer()}else{clearInterval(timer);running=false;updateTimer()}},1000)}updateTimer()};
$("timerReset").onclick=()=>{clearInterval(timer);running=false;remaining=state.rest;updateTimer()};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();