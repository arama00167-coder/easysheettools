
"use strict";
function toast(msg){var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('show')},3400);}
async function downloadFile(path,name){
  toast('Preparing your download…');
  try{
    var r=await fetch(path); if(!r.ok) throw new Error('fetch');
    var txt=(await r.text()).replace(/\s/g,'');
    var bin=atob(txt); var bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    var mime=name.endsWith('.zip')?'application/zip':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    var url=URL.createObjectURL(new Blob([bytes],{type:mime}));
    var a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},5000);
    toast('Download started: '+name);
  }catch(e){ toast('Sorry, the download failed. Please try again.'); }
}
document.addEventListener('click',function(e){
  var b=e.target.closest('.dl-btn'); if(b){ downloadFile(b.dataset.path,b.dataset.name); }
});
/* mobile nav */
var navToggle=document.getElementById('navToggle'), mainNav=document.getElementById('mainNav');
if(navToggle) navToggle.addEventListener('click',function(){ mainNav.classList.toggle('open'); });
/* Sheetu helper */
var helperBtn=document.getElementById('helperBtn'), helperBubble=document.getElementById('helperBubble');
var sheetuMsgs=['Hi! I am Sheetu. Everything here is free — pick a template and start in minutes.',
 'Looking for a calculator? Try the GPA, Loan or Compound Interest calculator — they work right here in your browser.',
 'Every template works in Excel AND Google Sheets. Just download and fill the yellow cells.',
 'Need all 20 templates at once? See the Bundles page.','Stuck on a formula? The Tutorials page explains XLOOKUP, VLOOKUP and Pivot Tables with examples.'];
var msgIdx=0;
if(helperBtn) helperBtn.addEventListener('click',function(){
  helperBubble.textContent=sheetuMsgs[msgIdx%sheetuMsgs.length]; msgIdx++;
  helperBubble.classList.toggle('show',true);
  clearTimeout(helperBubble._h); helperBubble._h=setTimeout(function(){helperBubble.classList.remove('show')},6000);
});
/* site search */
var searchInputs=[document.getElementById('siteSearch')].filter(Boolean);
var searchIndex=null;
async function loadIndex(){ if(searchIndex) return searchIndex;
  try{ var r=await fetch('/assets/search-index.json'); searchIndex=await r.json(); }catch(e){ searchIndex=[]; } return searchIndex; }
function bindSearch(input,out){
  if(!input||!out) return;
  input.addEventListener('input',async function(){
    var q=input.value.trim().toLowerCase();
    if(q.length<2){ out.style.display='none'; return; }
    var idx=await loadIndex();
    var hits=idx.filter(function(it){ return (it.t+' '+it.k+' '+it.c).toLowerCase().indexOf(q)>-1; }).slice(0,7);
    if(!hits.length){ out.innerHTML='<a href="/templates">No match — browse all templates</a>'; }
    else{ out.innerHTML=hits.map(function(h){ return '<a href="'+h.u+'">'+h.t+'<small>'+h.c+'</small></a>'; }).join(''); }
    out.style.display='block';
  });
  document.addEventListener('click',function(e){ if(!out.contains(e.target)&&e.target!==input) out.style.display='none'; });
}
bindSearch(document.getElementById('siteSearch'),document.getElementById('searchResults'));
bindSearch(document.getElementById('heroSearch'),document.getElementById('heroResults'));
var heroForm=document.getElementById('heroSearchForm');
if(heroForm) heroForm.addEventListener('submit',function(e){
  e.preventDefault();
  var out=document.getElementById('heroResults');
  var first=out.querySelector('a');
  if(first) location.href=first.getAttribute('href'); else location.href='/templates';
});
/* helpers for calculators */
function num(id){ var el=document.getElementById(id); if(!el) return 0; var v=parseFloat(el.value); return isNaN(v)?0:v; }
function sym(id){ var el=document.getElementById(id); return el?el.value:'$'; }
function money(s,n){ return s+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function showResult(id,html){ var el=document.getElementById(id); if(!el) return; el.innerHTML=html; el.classList.add('show'); }
function bindCalc(ids,fn){ var els=ids.map(function(i){return document.getElementById(i)}).filter(Boolean);
  els.forEach(function(el){ el.addEventListener('input',fn); el.addEventListener('change',fn); }); if(els.length) fn(); }
function letterGrade(p){ if(p>=90)return'A'; if(p>=80)return'B'; if(p>=70)return'C'; if(p>=60)return'D'; return'F'; }

/* ---------- GPA Calculator ---------- */
(function(){
  var rows=document.getElementById('gpaRows'); if(!rows) return;
  var gradeOpts='<option value="4">A (4.0)</option><option value="3.7">A- (3.7)</option><option value="3.3">B+ (3.3)</option><option value="3" selected>B (3.0)</option><option value="2.7">B- (2.7)</option><option value="2.3">C+ (2.3)</option><option value="2">C (2.0)</option><option value="1.7">C- (1.7)</option><option value="1.3">D+ (1.3)</option><option value="1">D (1.0)</option><option value="0">F (0.0)</option>';
  function addRow(course,credits){
    var d=document.createElement('div'); d.className='dyn-row';
    d.innerHTML='<div class="field"><label>Course</label><input type="text" class="g-course" placeholder="e.g. Mathematics" value="'+(course||'')+'"></div>'+
    '<div class="field"><label>Credits</label><input type="number" class="g-credits" min="0" step="0.5" value="'+(credits||3)+'"></div>'+
    '<div class="field"><label>Grade</label><select class="g-grade">'+gradeOpts+'</select></div>'+
    '<button type="button" class="row-del" aria-label="Remove course">✕</button>';
    d.querySelector('.row-del').addEventListener('click',function(){ d.remove(); calc(); });
    d.querySelectorAll('input,select').forEach(function(el){ el.addEventListener('input',calc); el.addEventListener('change',calc); });
    rows.appendChild(d);
  }
  function calc(){
    var qp=0,cr=0;
    rows.querySelectorAll('.dyn-row').forEach(function(r){
      var c=parseFloat(r.querySelector('.g-credits').value)||0;
      var g=parseFloat(r.querySelector('.g-grade').value)||0;
      qp+=c*g; cr+=c;
    });
    var gpa=cr>0?qp/cr:0;
    var note=gpa>=3.7?'Excellent — Dean\u2019s list level.':gpa>=3.0?'Good standing. Keep it up!':gpa>=2.0?'Fair — a little more focus will lift it.':'Needs attention — talk to your teacher about a study plan.';
    showResult('gpaResult','<div class="big">Your GPA: <span>'+gpa.toFixed(2)+'</span> / 4.00</div><table><tr><td>Total credits</td><td>'+cr+'</td></tr><tr><td>Quality points</td><td>'+qp.toFixed(1)+'</td></tr><tr><td>Standing</td><td>'+note+'</td></tr></table>');
  }
  addRow('Mathematics',3); addRow('English',3); addRow('Computer Science',4);
  document.getElementById('gpaAdd').addEventListener('click',function(){ addRow('',3); });
  calc();
})();

/* ---------- Weighted Grade Calculator ---------- */
(function(){
  var rows=document.getElementById('wRows'); if(!rows) return;
  function addRow(name,weight,score){
    var d=document.createElement('div'); d.className='dyn-row';
    d.innerHTML='<div class="field"><label>Assignment</label><input type="text" class="w-name" placeholder="e.g. Midterm" value="'+(name||'')+'"></div>'+
    '<div class="field"><label>Weight %</label><input type="number" class="w-weight" min="0" max="100" value="'+(weight||'')+'" placeholder="20"></div>'+
    '<div class="field"><label>Your score %</label><input type="number" class="w-score" min="0" max="100" value="'+(score||'')+'" placeholder="85"></div>'+
    '<button type="button" class="row-del" aria-label="Remove row">✕</button>';
    d.querySelector('.row-del').addEventListener('click',function(){ d.remove(); calc(); });
    d.querySelectorAll('input').forEach(function(el){ el.addEventListener('input',calc); });
    rows.appendChild(d);
  }
  function calc(){
    var earned=0, doneW=0;
    rows.querySelectorAll('.dyn-row').forEach(function(r){
      var w=parseFloat(r.querySelector('.w-weight').value)||0;
      var s=parseFloat(r.querySelector('.w-score').value)||0;
      if(w>0){ earned+=s*w/100; doneW+=w; }
    });
    var fw=num('wFinalWeight'), target=num('wTarget');
    var cur=doneW>0?(earned/(doneW/100)):0;
    var html='<div class="big">Grade points earned so far: <span>'+earned.toFixed(1)+'</span> / 100</div><table>'+
      '<tr><td>Completed weight</td><td>'+doneW.toFixed(0)+'%</td></tr>'+
      '<tr><td>Your average on completed work</td><td>'+cur.toFixed(1)+'% ('+letterGrade(cur)+')</td></tr>';
    if(fw>0&&target>0){
      var need=(target-earned)/(fw/100);
      html+='<tr><td>Score needed on the final ('+fw+'% weight) for a '+target+'%</td><td>'+(need>100?'Not possible ('+need.toFixed(1)+'%)':need<=0?'Already secured 🎉':need.toFixed(1)+'%')+'</td></tr>';
    }
    html+='</table>';
    showResult('wResult',html);
  }
  addRow('Assignments',20,88); addRow('Midterm Exam',30,82);
  document.getElementById('wAdd').addEventListener('click',function(){ addRow('',0,''); });
  bindCalc(['wFinalWeight','wTarget'],calc); calc();
})();

/* ---------- Test Grade Calculator ---------- */
(function(){
  if(!document.getElementById('tgCorrect')) return;
  function calc(){
    var c=num('tgCorrect'), t=num('tgTotal');
    if(t<=0){ showResult('tgResult','<div class="big">Enter your test marks to see your grade.</div>'); return; }
    var p=c/t*100;
    var rows=[90,80,70,60].map(function(th){
      var need=Math.ceil(th/100*t);
      return '<tr><td>For a '+letterGrade(th)+' ('+th+'%)</td><td>'+need+' correct</td></tr>';
    }).join('');
    showResult('tgResult','<div class="big">Your score: <span>'+p.toFixed(1)+'%</span> — Grade '+letterGrade(p)+'</div><table><tr><td>Correct answers</td><td>'+c+' / '+t+'</td></tr>'+rows+'</table>');
  }
  bindCalc(['tgCorrect','tgTotal'],calc);
})();

/* ---------- Loan Calculator (with amortization) ---------- */
function pmtCalc(P,annualRate,years){
  var r=annualRate/100/12, n=years*12;
  if(r===0) return P/n;
  var f=Math.pow(1+r,n); return P*r*f/(f-1);
}
(function(){
  if(!document.getElementById('loanAmt')) return;
  function calc(){
    var P=num('loanAmt'), rate=num('loanRate'), yrs=num('loanYears'), extra=num('loanExtra'), s=sym('loanCur');
    var r=rate/100/12, pay=Math.round(pmtCalc(P,rate,yrs)*100)/100;
    var bal=P, months=0, interest=0, rowsHtml='';
    var baseInterest=0; { var b2=P; while(b2>0.005&&months<1200){ var i2=b2*r; baseInterest+=i2; b2-=(pay-i2); if(++months>=1200) break; } months=0; }
    while(bal>0.005&&months<1200){
      var interestM=bal*r; var principal=pay+extra-interestM;
      if(principal>bal) principal=bal;
      bal-=principal; months++; interest+=interestM;
      if(months<=24||months%12===0||bal<=0.005)
        rowsHtml+='<tr><td>'+months+'</td><td>'+money(s,pay+extra)+'</td><td>'+money(s,principal)+'</td><td>'+money(s,interestM)+'</td><td>'+money(s,Math.max(bal,0))+'</td></tr>';
    }
    showResult('loanResult','<div class="big">Monthly payment: <span>'+money(s,pay)+'</span></div><table>'+
      '<tr><td>Payoff time'+(extra>0?' (with extra '+money(s,extra)+'/mo)':'')+'</td><td>'+months+' months ('+(months/12).toFixed(1)+' years)</td></tr>'+
      '<tr><td>Total interest</td><td>'+money(s,interest)+'</td></tr>'+
      (extra>0?'<tr><td>Interest saved vs no extra payment</td><td>'+money(s,Math.max(baseInterest-interest,0))+'</td></tr>':'')+
      '<tr><td>Total cost of loan</td><td>'+money(s,P+interest)+'</td></tr></table>'+
      '<div class="mini-table-wrap"><table class="mini-table"><thead><tr><th>Month</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div>'+
      '<p style="margin-top:10px">Want the full month-by-month schedule in Excel? Download the free <a href="/templates/loan-amortization-schedule-template">Loan Amortization Schedule Template</a>.</p>');
  }
  bindCalc(['loanAmt','loanRate','loanYears','loanExtra','loanCur'],calc);
})();

/* ---------- Mortgage Payoff Calculator ---------- */
(function(){
  if(!document.getElementById('mpBal')) return;
  function simulate(bal,r,pay,extra){
    var months=0,interest=0;
    while(bal>0.005&&months<1200){ var i=bal*r; interest+=i; bal-=(pay+extra-i); months++; }
    return {months:months,interest:interest};
  }
  function calc(){
    var bal=num('mpBal'), rate=num('mpRate'), pay=num('mpPay'), extra=num('mpExtra'), s=sym('mpCur');
    var r=rate/100/12;
    var base=simulate(bal,r,pay,0), withX=simulate(bal,r,pay,extra);
    var d=new Date(); d.setMonth(d.getMonth()+withX.months);
    var dateStr=d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    showResult('mpResult','<div class="big">Mortgage-free in: <span>'+withX.months+' months</span></div><table>'+
      '<tr><td>Payoff date</td><td>'+dateStr+'</td></tr>'+
      '<tr><td>Total interest with your plan</td><td>'+money(s,withX.interest)+'</td></tr>'+
      (extra>0?'<tr><td>Time saved by extra payments</td><td>'+(base.months-withX.months)+' months</td></tr><tr><td>Interest saved</td><td>'+money(s,Math.max(base.interest-withX.interest,0))+'</td></tr>':'<tr><td>Tip</td><td>Add an extra monthly amount to see how much sooner you finish.</td></tr>')+
      '</table>');
  }
  bindCalc(['mpBal','mpRate','mpPay','mpExtra','mpCur'],calc);
})();

/* ---------- Compound Interest Calculator ---------- */
(function(){
  if(!document.getElementById('ciPrin')) return;
  function calc(){
    var P=num('ciPrin'), pmt=num('ciMonthly'), rate=num('ciRate'), yrs=num('ciYears'), s=sym('ciCur');
    var r=rate/100/12, n=yrs*12;
    var fv= r===0 ? P+pmt*n : P*Math.pow(1+r,n)+pmt*((Math.pow(1+r,n)-1)/r);
    var deposited=P+pmt*n, earned=fv-deposited;
    var rowsHtml='';
    for(var y=1;y<=yrs;y++){ var m=y*12; var v= r===0? P+pmt*m : P*Math.pow(1+r,m)+pmt*((Math.pow(1+r,m)-1)/r);
      rowsHtml+='<tr><td>Year '+y+'</td><td>'+money(s,P+pmt*m)+'</td><td>'+money(s,v-(P+pmt*m))+'</td><td>'+money(s,v)+'</td></tr>'; }
    showResult('ciResult','<div class="big">Future value: <span>'+money(s,fv)+'</span></div><table>'+
      '<tr><td>You deposit in total</td><td>'+money(s,deposited)+'</td></tr>'+
      '<tr><td>Interest earned</td><td>'+money(s,earned)+'</td></tr></table>'+
      '<div class="mini-table-wrap"><table class="mini-table"><thead><tr><th>Year</th><th>Deposited</th><th>Interest</th><th>Balance</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div>');
  }
  bindCalc(['ciPrin','ciMonthly','ciRate','ciYears','ciCur'],calc);
})();

/* ---------- Savings Goal Calculator ---------- */
(function(){
  if(!document.getElementById('svGoal')) return;
  function calc(){
    var goal=num('svGoal'), have=num('svHave'), monthly=num('svMonthly'), rate=num('svRate'), s=sym('svCur');
    var r=rate/100/12, bal=have, months=0, contributed=0;
    if(monthly<=0&&r<=0){ showResult('svResult','<div class="big">Add a monthly contribution to see your timeline.</div>'); return; }
    while(bal<goal&&months<1200){ bal=bal*(1+r)+monthly; contributed+=monthly; months++; }
    var d=new Date(); d.setMonth(d.getMonth()+months);
    showResult('svResult','<div class="big">Goal reached in: <span>'+months+' months</span> ('+(months/12).toFixed(1)+' years)</div><table>'+
      '<tr><td>Target date</td><td>'+d.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</td></tr>'+
      '<tr><td>You will contribute</td><td>'+money(s,contributed)+'</td></tr>'+
      '<tr><td>Growth / interest earned</td><td>'+money(s,Math.max(bal-have-contributed,0))+'</td></tr>'+
      '<tr><td>Final amount</td><td>'+money(s,bal)+'</td></tr></table>'+
      '<p style="margin-top:10px">Track it month by month with the free <a href="/templates/savings-goal-tracker">Savings Goal Tracker</a>.</p>');
  }
  bindCalc(['svGoal','svHave','svMonthly','svRate','svCur'],calc);
})();

/* ---------- Salary to Hourly Calculator ---------- */
(function(){
  if(!document.getElementById('salAmt')) return;
  function calc(){
    var mode=document.getElementById('salMode').value, amt=num('salAmt'), hrs=num('salHours')||40, wks=num('salWeeks')||52, s=sym('salCur');
    var annual,hourly;
    if(mode==='annual'){ annual=amt; hourly=amt/(hrs*wks); } else { hourly=amt; annual=amt*hrs*wks; }
    showResult('salResult','<div class="big">'+(mode==='annual'?'Hourly rate: <span>'+money(s,hourly)+'</span> / hour':'Annual salary: <span>'+money(s,annual)+'</span> / year')+'</div><table>'+
      '<tr><td>Hourly</td><td>'+money(s,hourly)+'</td></tr>'+
      '<tr><td>Weekly ('+hrs+' hrs)</td><td>'+money(s,hourly*hrs)+'</td></tr>'+
      '<tr><td>Monthly</td><td>'+money(s,annual/12)+'</td></tr>'+
      '<tr><td>Annual ('+wks+' weeks)</td><td>'+money(s,annual)+'</td></tr></table>');
  }
  bindCalc(['salMode','salAmt','salHours','salWeeks','salCur'],calc);
})();

/* ---------- Upwork Fee Calculator ---------- */
(function(){
  if(!document.getElementById('upAmt')) return;
  function calc(){
    var amt=num('upAmt'), feePct=num('upTier'), s=sym('upCur');
    var fee=amt*feePct/100;
    showResult('upResult','<div class="big">You receive: <span>'+money(s,amt-fee)+'</span></div><table>'+
      '<tr><td>Client pays</td><td>'+money(s,amt)+'</td></tr>'+
      '<tr><td>Upwork fee ('+feePct+'%)</td><td>− '+money(s,fee)+'</td></tr>'+
      '<tr><td>To earn '+money(s,amt)+' after fees, charge</td><td>'+money(s,amt/(1-feePct/100))+'</td></tr></table>');
  }
  bindCalc(['upAmt','upTier','upCur'],calc);
})();

/* ---------- Fiverr Fee Calculator ---------- */
(function(){
  if(!document.getElementById('fvPrice')) return;
  function calc(){
    var price=num('fvPrice'), want=num('fvWant'), s=sym('fvCur');
    var html='';
    if(price>0) html+='<div class="big">From a '+money(s,price)+' gig you keep: <span>'+money(s,price*0.8)+'</span></div><table><tr><td>Fiverr fee (20%)</td><td>− '+money(s,price*0.2)+'</td></tr>';
    if(want>0) html+=(html?'':'<div class="big">Price to charge: <span>'+money(s,want/0.8)+'</span></div><table>')+'<tr><td>To take home '+money(s,want)+', set your gig price to</td><td>'+money(s,want/0.8)+'</td></tr>';
    if(html) html+='</table>';
    showResult('fvResult',html||'<div class="big">Enter a gig price or your target earnings.</div>');
  }
  bindCalc(['fvPrice','fvWant','fvCur'],calc);
})();

/* ---------- Percentage Calculator ---------- */
(function(){
  if(!document.getElementById('pc1a')) return;
  function calc(){
    var a1=num('pc1a'), b1=num('pc1b');
    document.getElementById('pc1Out').textContent=(a1&&b1)?(a1+'% of '+b1+' = '+(a1/100*b1).toLocaleString('en-US',{maximumFractionDigits:4})):'—';
    var a2=num('pc2a'), b2=num('pc2b');
    document.getElementById('pc2Out').textContent=(b2!==0)?(a2+' is '+(a2/b2*100).toFixed(2)+'% of '+b2):'—';
    var a3=num('pc3a'), b3=num('pc3b');
    document.getElementById('pc3Out').textContent=(a3!==0)?('Change from '+a3+' to '+b3+' = '+((b3-a3)/Math.abs(a3)*100).toFixed(2)+'% ('+(b3>=a3?'increase':'decrease')+')'):'—';
  }
  bindCalc(['pc1a','pc1b','pc2a','pc2b','pc3a','pc3b'],calc);
})();
