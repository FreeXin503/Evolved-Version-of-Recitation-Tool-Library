(function(){
  if(typeof window==='undefined')return;
  if(!window.location.pathname.includes('synomaster'))return;
  var st=document.createElement('style');
  st.id='syno-enhance-style';
  st.textContent='.grid.gap-3 button{font-size:1.35rem!important;padding:1.25rem 1.75rem!important;min-height:5rem!important;line-height:1.6!important;position:relative!important;font-weight:700!important}.grid.gap-3 button[data-m]::after{content:attr(data-m);display:block;font-size:1rem!important;color:#9ca3af;font-weight:400;margin-top:4px;line-height:1.3;pointer-events:none;opacity:0;transition:opacity .15s ease}body.syno-alt .grid.gap-3 button[data-m]::after{opacity:1!important}';
  document.head.appendChild(st);
  var mm={};
  function rebuildMm(){
    mm={};
    try{
      ['synomaster_synonym_data','synomaster_logic_data','synomaster_attitude_data'].forEach(function(k){
        JSON.parse(localStorage.getItem(k)||'[]').forEach(function(c){
          if(c.group&&Array.isArray(c.group))c.group.forEach(function(w){
            mm[w.toLowerCase().trim()]=c.meaning;
          });
        });
      });
    }catch(e){}
  }
  rebuildMm();
  window.addEventListener('storage',function(e){
    if(e.key&&e.key.startsWith('synomaster_')){
      rebuildMm();
    }
  });
  function en(){
    document.querySelectorAll('.grid.gap-3 button').forEach(function(b){
      var w=b.textContent.trim();
      var m=mm[w.toLowerCase()];
      if(m&&!b.hasAttribute('data-m'))b.setAttribute('data-m',m);
    });
    var sbtn=Array.from(document.querySelectorAll('button')).find(function(b){return b.textContent.trim()==='提交答案'});
    if(sbtn&&!sbtn.dataset.sd){
      sbtn.dataset.sd='1';
      sbtn.addEventListener('click',function(){
        setTimeout(function(){
          var rd=Array.from(document.querySelectorAll('div')).find(function(d){return d.textContent.includes('正确答案：')});
          if(!rd)return;
          var ct=rd.textContent.replace('正确答案：','').trim();
          var cs={};
          ct.split(/[、，,\s]+/).forEach(function(w){cs[w.trim().toLowerCase()]=true});
          document.querySelectorAll('.grid.gap-3 button.border-emerald-400').forEach(function(b){
            var w=b.textContent.trim().toLowerCase();
            var origText=b.textContent.trim();
            var m=mm[w];
            if(!cs[w]){
              if(m){
                b.textContent=origText+'\n'+m;
                b.style.color='#dc2626';
                b.style.fontSize='1.25rem';
                setTimeout(function(){
                  b.textContent=origText;
                  b.style.color='';
                  b.style.fontSize='';
                },1000);
              }
            }
          });
        },50);
      });
    }
  }
  var obs=new MutationObserver(function(){try{en()}catch(e){}});
  obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',function(e){
    if(e.key!=='Alt'||e.repeat)return;
    document.body.classList.add('syno-alt');
  });
  document.addEventListener('keyup',function(e){
    if(e.key!=='Alt')return;
    document.body.classList.remove('syno-alt');
  });
  setTimeout(en,100);
})();