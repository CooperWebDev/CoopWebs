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

/* preselect tier from ?tier=25 on the order page */
const form=$("#of");
if(form){
  const q=new URLSearchParams(location.search).get("tier");
  if(q){const r=$('input[name="tier"][value="$'+CSS.escape(q)+'"]');if(r)r.checked=true}

  /* order form */
  // Orders are posted to this Discord webhook. Note: anyone who views the page source can see it.
  const WEBHOOK="https://discord.com/api/webhooks/1571970972049997854/V7KitnlCHx0R2gTBOyFprzlxKoIDHKV6w72MkoBOSqtzD7UeI6Uww1w0SG4hMYphVOU2";
  const COOLDOWN=60*1000; // short anti spam pause between orders
  const note=$("#note"),btn=$("#sb");
  const say=(t,err)=>{note.textContent=t;note.style.color=err?"#ff8b84":""};
  const last=()=>{try{return Number(localStorage.getItem("lastOrder"))||0}catch{return 0}};
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const f=new FormData(form);
    if(f.get("website"))return;
    const name=String(f.get("name")||"").trim(),id=String(f.get("discord")||"").trim(),msg=String(f.get("msg")||"").trim();
    if(!name||!msg){say("Please fill in your name and describe what you need.",true);return}
    if(!/^[0-9]{17,20}$/.test(id)){say("Your Discord ID must be the 17 to 20 digit number, not your username.",true);return}
    if(Date.now()-last()<COOLDOWN){say("Please wait a minute before sending another request.",true);return}
    btn.disabled=true;say("Sending your request...");
    try{
      const r=await fetch(WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        username:"Website orders",
        allowed_mentions:{parse:[]},
        embeds:[{title:"New order: "+String(f.get("type")).slice(0,60),color:0xe24b3f,timestamp:new Date().toISOString(),fields:[
          {name:"Name",value:name.slice(0,200)},
          {name:"Discord ID",value:"`"+id+"` (<@"+id+">)"},
          {name:"Steam card tier",value:String(f.get("tier")).slice(0,50)},
          {name:"Project type",value:String(f.get("type")).slice(0,100)},
          {name:"Request",value:msg.slice(0,1000)}]}]})});
      if(!r.ok)throw new Error(r.status);
      try{localStorage.setItem("lastOrder",String(Date.now()))}catch{}
      form.reset();
      btn.classList.add("ok");btn.textContent="Request sent \u2713";
      setTimeout(()=>{btn.classList.remove("ok");btn.textContent="Send request"},3500);
      say("Thank you! Your request was sent. We will contact you on Discord to confirm the Steam card value, and we will send you the finished project as a zip when it is ready.");
    }catch(err){say("Your request could not be sent. Please try again in a moment.",true)}
    btn.disabled=false;
  });
}
