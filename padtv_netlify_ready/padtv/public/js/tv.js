var cv=$('#cv'),net,game=null,raf=0,last=0,room={p:[0,0],st:'lobby'},ping=[null,null],bat=[null,null];
var inp=[0,1].map(function(){return{x:0,y:0,a:0,b:0,la:0,lb:0}});
var cfg=window.PADTV_CONFIG||{},siteBase=(cfg.siteUrl||location.origin).replace(/\/$/,''),serverParam=cfg.websocketUrl?'&server='+encodeURIComponent(cfg.websocketUrl):'';
function fit(){var s=Math.min(innerWidth/1600,innerHeight/900);cv.style.width=1600*s+'px';cv.style.height=900*s+'px'}
addEventListener('resize',fit);fit();
function qr(){
  if(!room.code)return;
  var joinUrl=siteBase+'/c?room='+room.code+serverParam;
  $('#url').textContent=siteBase.replace(/^https?:\/\//,'')+'/c';
  if(window.QRCode&&QRCode.toDataURL){QRCode.toDataURL(joinUrl,{width:360,margin:1,color:{dark:'#101326',light:'#ffffff'}}).then(function(data){$('#qr').src=data}).catch(function(){$('#url').textContent=joinUrl})}
  else {$('#qr').removeAttribute('src');$('#url').textContent=joinUrl}
}
function view(v){$('#lobby').hidden=v!=='lobby';cv.hidden=v!=='game'}
function paint(){
  [0,1].forEach(function(i){var c=$('#s'+i);c.classList.toggle('on',!!room.p[i]);$('.st',c).textContent=room.p[i]?'Sẵn sàng':'Đang chờ kết nối…';$('.mt',c).textContent=room.p[i]&&ping[i]!=null?ping[i]+' ms'+(bat[i]!=null?' · Pin '+bat[i]+'%':''):''});
  var n=(room.p[0]?1:0)+(room.p[1]?1:0),d=GAMES.filter(function(g){return g.id===room.g})[0];
  $('#hint').textContent=n<2?'Chờ đủ 2 người chơi để bắt đầu…':'Người chơi '+(room.host+1)+' là chủ phòng: chọn game và bấm Bắt đầu trên điện thoại.';$('#gname').textContent=d?d.icon+' '+d.name:'';
}
function start(id){cancelAnimationFrame(raf);var d=GAMES.filter(function(g){return g.id===id})[0];if(!d||!d.create)return;inp.forEach(function(n){n.x=n.y=n.a=n.b=n.la=n.lb=0});view('game');game=d.create(cv,inp,{hap:function(s,p){net.send({t:'hap',s:s,p:p})},end:function(r){net.send({t:'end',win:r.win,sc:r.sc})}});last=performance.now();raf=requestAnimationFrame(loop)}
function loop(t){raf=requestAnimationFrame(loop);var dt=Math.min(.05,(t-last)/1000);last=t;if(game){game.update(dt);game.draw()}}
function stop(){cancelAnimationFrame(raf);game=null;view('lobby')}
function onMsg(m){
  if(m.t==='room'){var prev=room.st;room=m;sessionStorage.setItem('room',m.code);$('#code').textContent='GAME-'+m.code;qr();paint();if(m.st==='play'&&prev!=='play')start(m.g);if(m.st==='lobby'&&game)stop();$('#end').hidden=m.st!=='end';if(m.st==='end'&&m.res){var w=m.res.win;$('#win').textContent='Người chơi '+(w+1)+' chiến thắng!';$('#win').className='win p'+(w+1);$('#sc').textContent=m.res.sc[0]+' – '+m.res.sc[1]}}
  else if(m.t==='in'){var n=inp[m.s];if(!n)return;if(m.a&&!n.a)n.la=1;if(m.b&&!n.b)n.lb=1;n.x=m.x;n.y=m.y;n.a=m.a;n.b=m.b}
  else if(m.t==='st'){ping[m.s]=m.ping;bat[m.s]=m.bat;paint()}
  else if(m.t==='closed'){sessionStorage.removeItem('room');location.reload()}
}
net=Net(function(n){n.send({t:'create',code:sessionStorage.getItem('room')})},onMsg,function(ok){var c=$('#conn');c.textContent=ok?'● Đã kết nối máy chủ':'● Mất kết nối — đang thử lại…';c.className='pill '+(ok?'ok':'no')});
