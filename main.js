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

/* Order now dropdown */
const dd=$(".dd"),ddb=$(".ddbtn");
const setDD=o=>{dd.classList.toggle("open",o);ddb.setAttribute("aria-expanded",o)};
const hoverMenu=matchMedia("(hover:hover) and (min-width:821px)").matches;
/* with a mouse the menu opens on hover, so a click must keep it open instead of toggling it shut */
ddb.addEventListener("click",e=>{e.stopPropagation();setDD(hoverMenu?true:!dd.classList.contains("open"))});
if(hoverMenu){
  let t;dd.addEventListener("mouseenter",()=>{clearTimeout(t);setDD(true)});
  dd.addEventListener("mouseleave",()=>{t=setTimeout(()=>setDD(false),180)});
}
document.addEventListener("click",e=>{if(!dd.contains(e.target))setDD(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){setDD(false);ddb.focus()}});
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

/* ---------- Order pages ---------- */
const form=$("#of"),ty=$("#ty"),msg=$("#msg");
const BOOST="Rocket League rank boost";
const AUTO="Rocket League boost:";
const params=new URLSearchParams(location.search);

/* the order chooser passes a chosen Steam card tier on to the service pages */
{
  const t=(params.get("tier")||"").replace(/[^0-9]/g,"");
  $$("[data-svc]").forEach(a=>{
    if(t&&!a.getAttribute("href").startsWith("rank-boost"))a.href=a.getAttribute("href")+"?tier="+t;
  });
  if(t&&form){const r=$('input[name="tier"][value="$'+t+'"]');if(r)r.checked=true}
}

/* ---------- Rocket League calculator (rank boosting page and its order page) ---------- */
let resetCalc=()=>{};
const cf=$("#cFrom");
if(cf&&window.RL){
  const R=RL.RANKS,ct=$("#cTo"),cr=$("#cRew"),go=$("#cGo"),goBase=go?go.getAttribute("href").split("?")[0]:"";
  cf.innerHTML=R.slice(0,-1).map(r=>"<option>"+r+"</option>").join("");
  ct.innerHTML=R.slice(1).map(r=>"<option>"+r+"</option>").join("");
  const quote=()=>{
    if(R.indexOf(ct.value)<=R.indexOf(cf.value))ct.value=R[R.indexOf(cf.value)+1];
    return RL.quote(cf.value,ct.value,cr.checked);
  };
  const draw=()=>{
    const q=quote();
    $("#cTotal").textContent=eur(q.total);
    /* "Order this boost" opens the boost order page with the same ranks filled in */
    if(go)go.href=goBase+"?from="+encodeURIComponent(q.from)+"&to="+encodeURIComponent(q.to)+"&rew="+(cr.checked?1:0);
  };
  const defaults=()=>{
    const fi=R.indexOf(params.get("from")),ti=R.indexOf(params.get("to"));
    cf.value=(fi>=0&&fi<R.length-1)?R[fi]:"Gold I";
    ct.value=(ti>0)?R[ti]:R[Math.min(R.indexOf(cf.value)+4,R.length-1)];
    cr.checked=params.get("rew")!=="0";
    draw();
  };
  [cf,ct,cr].forEach(e=>e.addEventListener("change",draw));
  defaults();
  resetCalc=defaults;

  const ladder=$("#ladder");
  if(ladder)ladder.innerHTML=RL.TIERS.concat(["Grand Champion"]).map(t=>{
    const rows=[];
    R.forEach((r,i)=>{if(i<R.length-1&&r.indexOf(t)===0){
      const pr=RL.stepPrice(i),rw=RL.stepReward(i);
      rows.push("<div><span>"+r+" \u2192 "+R[i+1].replace("Grand Champion","GC")+"</span><span>"+eur(pr)+(rw?" <em>+"+eur(rw)+" rewards</em>":"")+"</span></div>");
    }});
    return rows.length?"<article class=\"card rv in\"><h3>"+t+"</h3>"+rows.join("")+"</article>":"";
  }).join("");
}

/* ---------- Sending ---------- */
if(form){
  const COOLDOWN=60*1000; // short anti spam pause between orders
  const note=$("#note"),btn=$("#sb");
  const say=(t,err)=>{note.textContent=t;note.style.color=err?"#ff8b84":""};
  const last=()=>{try{return Number(localStorage.getItem("lastOrder"))||0}catch{return 0}};
  const isBoost=form.dataset.kind==="boost";
  const boostText=f=>{
    const q=RL.quote(f.get("from"),f.get("to"),!!f.get("rew"));
    const extra=String(f.get("msg")||"").trim();
    return AUTO+" "+q.from+" to "+q.to+", "+(q.rewards?"with":"without")+" Rank Rewards. Estimated price: "+eur(q.total)+".\nPlatform: "+f.get("platform")+"\nPlaylist: "+f.get("playlist")+(extra?"\nNotes: "+extra:"");
  };

  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const f=new FormData(form);
    if(f.get("website"))return;
    const name=String(f.get("name")||"").trim(),id=String(f.get("discord")||"").trim();
    const text=isBoost?boostText(f):String(f.get("msg")||"").trim();
    if(!name||!text){say("Please fill in your name and describe what you need.",true);return}
    if(!/^[0-9]{17,20}$/.test(id)){say("Your Discord ID must be the 17 to 20 digit number, not your username.",true);return}
    if(isBoost&&!f.get("consent")){say("Please switch on the confirmation to agree that we may play on your account and will return it.",true);return}
    if(Date.now()-last()<COOLDOWN){say("Please wait a minute before sending another request.",true);return}
    btn.disabled=true;say("Sending your request...");
    const body={name:name,discord:id,type:String(f.get("type")),tier:String(f.get("tier")||""),msg:text,website:""};
    try{
      const r=await fetch("/api/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok)throw new Error(r.status);
      try{localStorage.setItem("lastOrder",String(Date.now()))}catch{}
      form.reset();resetCalc();
      btn.classList.add("ok");btn.textContent="Request sent \u2713";
      setTimeout(()=>{btn.classList.remove("ok");btn.textContent="Send request"},3500);
      say(isBoost?"Thank you! Your boost request was sent. We will contact you on Discord to agree the price and to arrange access to your account. We always give your account back when the boost is done.":"Thank you! Your request was sent. We will contact you on Discord to confirm the price, and we will send you the finished project as a zip when it is ready.");
    }catch(err){say("Your request could not be sent. Please try again in a moment.",true)}
    btn.disabled=false;
  });
}
