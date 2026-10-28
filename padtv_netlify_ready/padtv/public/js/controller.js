var ss=sessionStorage,pid=ss.pid||(ss.pid=Math.random().toString(36).slice(2));
var S={x:0,y:0,a:0,b:0},me=-1,room=null,ping=0,bat=null,sel='arena',built='',lastT=0,tm=0,net;
function view(v){['join','lobby','pad','end'].forEach(function(k){$('#v-'+k).hidden=k!==v})}
function join(c,s){ss.room=c;ss.slot=s;net.send({t:'join',code:c,slot:s,id:pid})}
function reset(t){me=-1;delete ss.room;delete ss.slot;built='';$('#err').textContent=t||'';view('join')}
function enter(){try{var d=document.documentElement;if(d.requestFullscreen)d.requestFullscreen().catch(function(){});if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){})}catch(e){}}
function orient(on){try{if(!screen.orientation)return;if(on)screen.orientation.lock('landscape').catch(function(){});else screen.orientation.unlock()}catch(e){}}

// ---- Gửi trạng thái điều khiển (giới hạn ~40 lần/giây) ----
function push(f){var n=performance.now();clearTimeout(tm);if(f||n-lastT>=25){lastT=n;net.send({t:'in',x:S.x,y:S.y,a:S.a,b:S.b})}else tm=setTimeout(function(){push(1)},25-(n-lastT))}
var stick=$('#stick'),knob=$('#knob'),sid=null;
function mv(e){var r=stick.getBoundingClientRect(),R=r.width/2,dx=e.clientX-r.left-R,dy=e.clientY-r.top-R,d=Math.hypot(dx,dy),k=d>R?R/d:1;dx*=k;dy*=k;knob.style.transform='translate('+dx+'px,'+dy+'px)';S.x=+(dx/R).toFixed(2);S.y=+(dy/R).toFixed(2);push()}
stick.onpointerdown=function(e){sid=e.pointerId;stick.setPointerCapture(sid);mv(e)};
stick.onpointermove=function(e){if(e.pointerId===sid)mv(e)};
function rel(e){if(e.pointerId!==sid)return;sid=null;knob.style.transform='';S.x=S.y=0;push(1)}
stick.onpointerup=rel;stick.onpointercancel=rel;

function buildPad(){
  var d=GAMES.filter(function(g){return g.id===room.g})[0];built=room.g;
  $('#btns').innerHTML=d.pad.map(function(b){return'<button class="pb'+(b.big?' big':'')+'" data-k="'+b.k+'">'+b.label+'</button>'}).join('');
  [].forEach.call(document.querySelectorAll('.pb'),function(el){
    var k=el.dataset.k,up=function(){S[k]=0;el.classList.remove('on');push(1)};
    el.onpointerdown=function(e){e.preventDefault();el.setPointerCapture(e.pointerId);S[k]=1;el.classList.add('on');if(navigator.vibrate)navigator.vibrate(12);push(1)};
    el.onpointerup=up;el.onpointercancel=up;
  });
}

// ---- Hiển thị theo trạng thái phòng: phòng chờ / tay cầm / kết quả ----
function render(){
  var host=room.host===me,r=room.res||{win:-1,sc:[0,0]},c='p'+(me+1);
  if(room.st==='play'){
    if(built!==room.g)buildPad();
    $('#v-pad').className=c;$('#pme').textContent='Người chơi '+(me+1);$('#pme').className='chip '+c;
    $('#nt').hidden=room.tv;orient(1);view('pad');push(1);return;
  }
  orient(0);
  if(room.st==='end'){
    $('#rt').textContent=r.win===me?'🏆 Bạn đã thắng!':'Thua rồi — đòi lại nào!';
    $('#rs').textContent=r.sc[me]+' – '+r.sc[1-me];
    $('#endhost').hidden=!host;$('#endwait').hidden=host;view('end');return;
  }
  $('#me').textContent='Người chơi '+(me+1);$('#me').className='chip '+c;$('#rc').textContent='Phòng GAME-'+room.code;
  $('#pp').innerHTML=[0,1].map(function(i){return'<span class="chip p'+(i+1)+(room.p[i]?'':' off')+'">Người chơi '+(i+1)+(room.p[i]?' ✓':' …')+'</span>'}).join('');
  $('#tvw').hidden=room.tv;$('#hostbox').hidden=!host;$('#wait').hidden=host;
  if(host){
    $('#games').innerHTML=GAMES.map(function(g){return'<button class="gm'+(g.id===sel?' sel':'')+'" data-id="'+g.id+'"'+(g.soon?' disabled':'')+'><span class="ic">'+g.icon+'</span><span><b>'+g.name+'</b>'+(g.soon?'<em>Sắp ra mắt</em>':'')+'<br><small class="mut">'+g.desc+'</small></span></button>'}).join('');
    var ready=room.p[0]&&room.p[1]&&room.tv,b=$('#go');b.disabled=!ready;b.textContent=ready?'▶ Bắt đầu':'Chờ đủ 2 người chơi…';
  }
  view('lobby');
}
function onMsg(m){
  if(m.t==='joined'){me=m.slot;ss.slot=m.slot}
  else if(m.t==='room'){room=m;if(me>=0)render()}
  else if(m.t==='pong'){ping=Math.round(performance.now()-m.ts);$('#png').textContent=ping}
  else if(m.t==='hap'){if(navigator.vibrate)navigator.vibrate(m.p)}
  else if(m.t==='closed')reset('Phòng đã đóng.');
  else if(m.t==='err')reset(m.m);
}
net=Net(function(){if(ss.room&&ss.slot!=null)join(ss.room,+ss.slot)},onMsg,function(ok){$('#off').hidden=ok});

// ---- Sự kiện giao diện ----
[].forEach.call(document.querySelectorAll('.slot'),function(b){b.onclick=function(){
  var c=$('#code').value.replace(/\D/g,'');
  if(c.length<4){$('#err').textContent='Nhập mã phòng gồm 4 chữ số.';return}
  $('#err').textContent='';enter();join(c,+b.dataset.s);
}});
$('#games').onclick=function(e){var b=e.target.closest('.gm');if(b&&!b.disabled){sel=b.dataset.id;render()}};
$('#go').onclick=function(){net.send({t:'start',g:sel})};
$('#again').onclick=function(){net.send({t:'start',g:room.g})};
$('#back').onclick=function(){net.send({t:'lobby'})};
var q=new URLSearchParams(location.search).get('room');if(q&&!ss.room)$('#code').value='GAME-'+q.replace(/\D/g,'');
document.addEventListener('contextmenu',function(e){e.preventDefault()});
if(navigator.getBattery)navigator.getBattery().then(function(b){var f=function(){bat=Math.round(b.level*100);$('#bt').textContent='🔋 '+bat+'%'};f();b.onlevelchange=f});
setInterval(function(){if(me<0)return;net.send({t:'ping',ts:performance.now()});net.send({t:'st',ping:ping,bat:bat})},2000);
