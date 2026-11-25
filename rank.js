/* Rocket League rank boosting: ranks, prices and quote calculator.
   Used by the website (browser) and by api/order.js (server) so prices always match. */
(function(root){
  const TIERS=["Bronze","Silver","Gold","Platinum","Diamond","Champion"];
  const DIVS=["I","II","III","IV"];
  const RANKS=[];
  TIERS.forEach(t=>DIVS.forEach(d=>RANKS.push(t+" "+d)));
  RANKS.push("Grand Champion I");

  const STEP=5;            // each division step, in euro
  const STEP_TO_GC=10;     // Champion IV -> Grand Champion I
  const REWARD=5;          // extra per new rank reached (Rank Rewards)

  /* price of moving from rank i to rank i+1 */
  const stepPrice=i=>(RANKS[i+1]==="Grand Champion I")?STEP_TO_GC:STEP;
  /* Rank Rewards apply when the step enters a new tier: Silver I, Gold I ... Grand Champion I */
  const stepReward=i=>(RANKS[i+1]&&/ I$/.test(RANKS[i+1]))?REWARD:0;

  function quote(from,to,withRewards){
    const a=RANKS.indexOf(from),b=RANKS.indexOf(to);
    if(a<0||b<0||b<=a)return null;
    const steps=[];let base=0,rewards=0;
    for(let i=a;i<b;i++){
      const p=stepPrice(i),r=withRewards?stepReward(i):0;
      steps.push({from:RANKS[i],to:RANKS[i+1],price:p,reward:r});
      base+=p;rewards+=r;
    }
    return {from:from,to:to,steps:steps,base:base,rewards:rewards,total:base+rewards};
  }
  const api={TIERS,DIVS,RANKS,quote,stepPrice,stepReward};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.RL=api;
})(typeof window!=="undefined"?window:globalThis);
