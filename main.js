const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
const eur=n=>"\u20ac"+n;
const yEl=$("#y");if(yEl)yEl.textContent=new Date().getFullYear();

/* scroll progress + sticky nav */
const bar=$("#bar"),nav=$("#nav");
const onScroll=()=>{
  const h=document.documentElement,max=h.scrollHeight-h.clientHeight;
  bar.style.transform="scaleX("+(max>0?h.scrollTop/max:0)+")";
  nav.classList.toggle("stuck",h.scrollTop>10);
};
addEventListener("scroll",onScroll,{passive:true});onScroll();

/* mobile menu */
const burger=$("#burger");
burger.addEventListener("click",()=>{const o=nav.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
$$("#menu a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");burger.setAttribute("aria-expanded","false")}));

/* highlight the section you are in */
const links=$$('#menu a[href^="#"]:not(.btn)');
const spy=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting)links.forEach(a=>{const on=a.getAttribute("href")==="#"+e.target.id;a.classList.toggle("on",on);on?a.setAttribute("aria-current","true"):a.removeAttribute("aria-current")});
}),{rootMargin:"-45% 0px -50% 0px"});
$$("section[id]").forEach(s=>spy.observe(s));

/* reveal on scroll */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.15,rootMargin:"0px 0px -6% 0px"});
$$(".rv").forEach(el=>io.observe(el));

/* count up numbers */
const count=el=>{
  const to=+el.dataset.count,suf=el.dataset.suffix||"";
  if(calm){el.textContent=to+suf;return}
  const t0=performance.now(),d=1400;
  const tick=t=>{const p=Math.min((t-t0)/d,1),v=Math.round(to*(1-Math.pow(1-p,3)));el.textContent=v+suf;if(p<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
};
setTimeout(()=>$$("[data-count]").forEach(count),700);

/* cursor spotlight on cards, 3D tilt on tiers */
$$(".card,.tier").forEach(el=>{
  el.addEventListener("pointermove",e=>{
    const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    el.style.setProperty("--mx",x+"px");el.style.setProperty("--my",y+"px");
    if(!calm&&el.classList.contains("tier")&&e.pointerType==="mouse"){
      const rx=((y/r.height)-.5)*-8,ry=((x/r.width)-.5)*8;
      el.style.transform="translateY(-6px) rotateX("+rx+"deg) rotateY("+ry+"deg)";
    }
  });
  el.addEventListener("pointerleave",()=>{if(el.classList.contains("tier"))el.style.transform=""});
});

/* ---------- Rocket League: price calculator + price list ---------- */
const R=RL.RANKS;
const cf=$("#cFrom"),ct=$("#cTo"),cr=$("#cRew");
cf.innerHTML=R.slice(0,-1).map(r=>"<option>"+r+"</option>").join("");
ct.innerHTML=R.slice(1).map(r=>"<option>"+r+"</option>").join("");
cf.value="Gold I";ct.value="Platinum I";
const cdraw=()=>{
  if(R.indexOf(ct.value)<=R.indexOf(cf.value))ct.value=R[R.indexOf(cf.value)+1];
  const q=RL.quote(cf.value,ct.value,cr.checked);
  $("#cTotal").textContent=eur(q.total);
  $("#cBreak").innerHTML=q.steps.map(s=>"<div><span>"+s.from+" \u2192 "+s.to+"</span><span>"+eur(s.price)+(s.reward?" <em>+"+eur(s.reward)+" rewards</em>":"")+"</span></div>").join("");
};
[cf,ct,cr].forEach(e=>e.addEventListener("change",cdraw));cdraw();

$("#ladder").innerHTML=RL.TIERS.concat(["Grand Champion"]).map(t=>{
  const rows=[];
  R.forEach((r,i)=>{if(i<R.length-1&&r.indexOf(t)===0){
    const pr=RL.stepPrice(i),rw=RL.stepReward(i);
    rows.push("<div><span>"+r+" \u2192 "+R[i+1]+"</span><span>"+eur(pr)+(rw?" <em>+"+eur(rw)+" rewards</em>":"")+"</span></div>");
  }});
  return rows.length?"<article class=\"card rv in\"><h3>"+t+"</h3>"+rows.join("")+"</article>":"";
}).join("");

/* ---------- Order form (same page) ---------- */
const form=$("#of");
const COOLDOWN=60*1000; // short anti spam pause between orders
const note=$("#note"),btn=$("#sb"),ty=$("#ty"),rk=$("#rk"),tf=$("#tf"),payn=$("#payn"),msg=$("#msg");
const say=(t,err)=>{note.textContent=t;note.style.color=err?"#ff8b84":""};
const last=()=>{try{return Number(localStorage.getItem("lastOrder"))||0}catch{return 0}};
const BOOST="Rocket League rank boost";

const rf=$("#rkFrom"),rt=$("#rkTo"),rw=$("#rkRew"),rtot=$("#rkTotal");
rf.innerHTML=R.slice(0,-1).map(r=>"<option>"+r+"</option>").join("");
rt.innerHTML=R.slice(1).map(r=>"<option>"+r+"</option>").join("");
rf.value="Gold I";rt.value="Platinum I";
const calc=()=>{
  if(R.indexOf(rt.value)<=R.indexOf(rf.value))rt.value=R[R.indexOf(rf.value)+1];
  rtot.textContent=eur(RL.quote(rf.value,rt.value,rw.checked).total);
};
[rf,rt,rw].forEach(e=>e.addEventListener("change",calc));calc();

const mode=()=>{
  const b=ty.value===BOOST;
  rk.hidden=!b;tf.hidden=b;
  payn.innerHTML=b?"<b>Payment is confirmed on Discord.</b> We will agree the final price and how you pay with you on Discord before we start. We only start once everything is agreed.":"<b>Payment is by Steam gift card.</b> We will confirm the final value with you on Discord before you send anything. Your finished project is delivered as a zip file.";
  msg.placeholder=b?"Anything we should know? For example the hours you are online or the playlist you want us to play.":"What should it do? For a bot, list the commands or features you want. For a website, list the sections and any style you like.";
};
ty.addEventListener("change",mode);

/* buttons elsewhere on the page pre-fill the form, then the link scrolls down to it */
$$("[data-tier]").forEach(a=>a.addEventListener("click",()=>{
  if(ty.value===BOOST){ty.value="Discord bot";mode()}
  const r=$('input[name="tier"][value="'+a.dataset.tier+'"]');if(r)r.checked=true;
}));
$$('[data-pick="project"]').forEach(a=>a.addEventListener("click",()=>{if(ty.value===BOOST){ty.value="Discord bot";mode()}}));
$$('[data-pick="boost"]').forEach(a=>a.addEventListener("click",()=>{
  ty.value=BOOST;rf.value=cf.value;rt.value=ct.value;rw.checked=cr.checked;mode();calc();
}));

/* old links such as ?service=rank&from=..&to=.. still pre-fill the form */
const params=new URLSearchParams(location.search);
const pt=params.get("tier");if(pt){const r=$('input[name="tier"][value="$'+pt.replace(/[^0-9]/g,"")+'"]');if(r)r.checked=true}
if(params.get("service")==="rank"){
  ty.value=BOOST;
  if(R.indexOf(params.get("from"))>=0&&R.indexOf(params.get("from"))<R.length-1)rf.value=params.get("from");
  if(R.indexOf(params.get("to"))>0)rt.value=params.get("to");
  if(params.get("rew")==="0")rw.checked=false;
  calc();
}
mode();

form.addEventListener("submit",async e=>{
  e.preventDefault();
  const f=new FormData(form);
  if(f.get("website"))return;
  const boost=ty.value===BOOST;
  const name=String(f.get("name")||"").trim(),id=String(f.get("discord")||"").trim(),text=String(f.get("msg")||"").trim();
  if(!name||(!boost&&!text)){say(boost?"Please fill in your name.":"Please fill in your name and describe what you need.",true);return}
  if(!/^[0-9]{17,20}$/.test(id)){say("Your Discord ID must be the 17 to 20 digit number, not your username.",true);return}
  if(boost&&!f.get("consent")){say("Please confirm that you understand we will play on your account and give it back afterwards.",true);return}
  if(Date.now()-last()<COOLDOWN){say("Please wait a minute before sending another request.",true);return}
  btn.disabled=true;say("Sending your request...");
  const body={name:name,discord:id,type:String(f.get("type")),tier:String(f.get("tier")||""),msg:text,website:""};
  if(boost)body.rank={from:String(f.get("from")),to:String(f.get("to")),platform:String(f.get("platform")),playlist:String(f.get("playlist")),rewards:!!f.get("rew"),consent:true};
  try{
    const r=await fetch("/api/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if(!r.ok)throw new Error(r.status);
    try{localStorage.setItem("lastOrder",String(Date.now()))}catch{}
    form.reset();mode();rf.value="Gold I";rt.value="Platinum I";calc();
    btn.classList.add("ok");btn.textContent="Request sent \u2713";
    setTimeout(()=>{btn.classList.remove("ok");btn.textContent="Send request"},3500);
    say(boost?"Thank you! Your boost request was sent. We will contact you on Discord to agree the price and to arrange access to your account. We always give your account back when the boost is done.":"Thank you! Your request was sent. We will contact you on Discord to confirm the Steam card value, and we will send you the finished project as a zip when it is ready.");
  }catch(err){say("Your request could not be sent. Please try again in a moment.",true)}
  btn.disabled=false;
});
