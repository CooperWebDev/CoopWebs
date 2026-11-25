const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
const yEl=$("#y");if(yEl)yEl.textContent=new Date().getFullYear();

/* scroll progress + sticky nav */
const bar=$("#bar"),nav=$("#nav");
const onScroll=()=>{
  const h=document.documentElement,max=h.scrollHeight-h.clientHeight;
  bar.style.transform="scaleX("+(max>0?h.scrollTop/max:0)+")";
  nav.classList.toggle("stuck",h.scrollTop>10);
};
addEventListener("scroll",onScroll,{passive:true});onScroll();

/* mobile menu + Order dropdown */
const burger=$("#burger"),dd=$(".dd"),ddb=$(".ddbtn");
burger.addEventListener("click",()=>{const o=nav.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
const setDD=o=>{dd.classList.toggle("open",o);ddb.setAttribute("aria-expanded",o)};
ddb.addEventListener("click",e=>{e.stopPropagation();setDD(!dd.classList.contains("open"))});
if(matchMedia("(hover:hover) and (min-width:821px)").matches){
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

/* order page */
const form=$("#of");
if(form){
  const params=new URLSearchParams(location.search);
  const q=params.get("tier");
  if(q){const r=$('input[name="tier"][value="$'+CSS.escape(q)+'"]');if(r)r.checked=true}

  const COOLDOWN=60*1000; // short anti spam pause between orders
  const note=$("#note"),btn=$("#sb"),ty=$("#ty"),rk=$("#rk"),tf=$("#tf"),payn=$("#payn"),msg=$("#msg");
  const say=(t,err)=>{note.textContent=t;note.style.color=err?"#ff8b84":""};
  const last=()=>{try{return Number(localStorage.getItem("lastOrder"))||0}catch{return 0}};
  const BOOST="Rocket League rank boost";

  /* Rocket League rank boost fields */
  const rf=$("#rkFrom"),rt=$("#rkTo"),rw=$("#rkRew"),rtot=$("#rkTotal");
  if(rf&&window.RL){
    const R=RL.RANKS;
    rf.innerHTML=R.slice(0,-1).map(r=>"<option>"+r+"</option>").join("");
    rt.innerHTML=R.slice(1).map(r=>"<option>"+r+"</option>").join("");
    const pf=params.get("from"),pt=params.get("to");
    if(R.indexOf(pf)>=0&&R.indexOf(pf)<R.length-1)rf.value=pf;
    rt.value=(R.indexOf(pt)>0)?pt:R[Math.min(R.indexOf(rf.value)+4,R.length-1)];
    if(params.get("rew")==="0")rw.checked=false;
    const calc=()=>{
      if(R.indexOf(rt.value)<=R.indexOf(rf.value))rt.value=R[R.indexOf(rf.value)+1];
      const x=RL.quote(rf.value,rt.value,rw.checked);
      rtot.textContent="\u20ac"+x.total;
    };
    [rf,rt,rw].forEach(e=>e.addEventListener("change",calc));calc();
  }
  const mode=()=>{
    const b=ty.value===BOOST;
    rk.hidden=!b;tf.hidden=b;
    payn.innerHTML=b?"<b>Payment is confirmed on Discord.</b> We will agree the final price and how you pay with you on Discord before we start. We only start once everything is agreed.":"<b>Payment is by Steam gift card.</b> We will confirm the final value with you on Discord before you send anything. Your finished project is delivered as a zip file.";
    msg.placeholder=b?"Anything we should know? For example the hours you are online or the playlist you want us to play.":"What should it do? For a bot, list the commands or features you want. For a website, list the sections and any style you like.";
  };
  ty.addEventListener("change",mode);
  if(params.get("service")==="rank")ty.value=BOOST;
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
      form.reset();mode();
      btn.classList.add("ok");btn.textContent="Request sent \u2713";
      setTimeout(()=>{btn.classList.remove("ok");btn.textContent="Send request"},3500);
      say(boost?"Thank you! Your boost request was sent. We will contact you on Discord to agree the price and to arrange access to your account. We always give your account back when the boost is done.":"Thank you! Your request was sent. We will contact you on Discord to confirm the Steam card value, and we will send you the finished project as a zip when it is ready.");
    }catch(err){say("Your request could not be sent. Please try again in a moment.",true)}
    btn.disabled=false;
  });
}
