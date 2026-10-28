// Thư viện game. Muốn thêm game: khai báo ở đây (pad = bố cục nút trên tay cầm) và thêm id vào GAMES trong server.js.
var GAMES=[
 {id:'arena',name:'Đấu Trường Neon',icon:'⚡',desc:'Di chuyển, bắn và lướt để hạ đối thủ. Thắng 2 hiệp để chiến thắng.',
  pad:[{k:'b',label:'LƯỚT'},{k:'a',label:'BẮN',big:1}],create:function(cv,inp,io){return Arena(cv,inp,io)}},
 {id:'race',name:'Đua Xe 2 Người',icon:'🏎️',desc:'Đua tốc độ trên đường đua neon.',soon:1},
 {id:'soccer',name:'Bóng Đá Mini',icon:'⚽',desc:'Trận đấu 1 chọi 1 trên sân nhỏ.',soon:1}
];

// Game mẫu: inp[i] = {x,y (joystick), a,b (đang giữ), la,lb (chốt 1 lần nhấn)}; io = {hap(slot,pattern), end({win,sc})}
function Arena(cv,inp,io){
  var W=1600,H=900,R=22,g=cv.getContext('2d'),col=['#22d3ee','#f472b6'];
  var walls=[[700,330,200,240],[260,140,40,230],[1300,530,40,230],[300,700,260,40],[1040,160,260,40]];
  var pl,bl,fx=[],wins=[0,0],cd,hold=0,done=0,shake=0,banner='';
  function blocked(x,y,r){return x<r||y<r||x>W-r||y>H-r||walls.some(function(w){return x>w[0]-r&&x<w[0]+w[2]+r&&y>w[1]-r&&y<w[1]+w[3]+r})}
  function burst(x,y,c,n){for(var i=0;i<n;i++){var a=Math.random()*6.28,s=60+Math.random()*280;fx.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.5,c:c})}}
  function reset(){pl=[0,1].map(function(i){return{x:i?1400:200,y:450,dx:i?-1:1,dy:0,hp:100,sh:0,dh:0,dt:0}});bl=[];cd=3;banner='';inp.forEach(function(n){n.la=n.lb=0})}
  function update(dt){
    shake=Math.max(0,shake-dt*40);
    fx=fx.filter(function(f){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.95;f.vy*=.95;return(f.l-=dt)>0});
    if(done)return;
    if(hold>0){hold-=dt;if(hold<=0)reset();return}
    if(cd>0){cd-=dt;return}
    pl.forEach(function(p,i){
      var n=inp[i],m=Math.hypot(n.x,n.y);
      p.sh-=dt;p.dh-=dt;p.dt-=dt;
      if(m>.15){p.dx=n.x/m;p.dy=n.y/m}
      if((n.b||n.lb)&&p.dh<=0){p.dh=2.2;p.dt=.18;burst(p.x,p.y,col[i],14);io.hap(i,[30])}
      if((n.a||n.la)&&p.sh<=0){p.sh=.32;bl.push({x:p.x+p.dx*28,y:p.y+p.dy*28,vx:p.dx*950,vy:p.dy*950,o:i})}
      n.la=n.lb=0;
      var sp=p.dt>0?1000:(m>.15?330*Math.min(1,m):0),nx=p.x+p.dx*sp*dt,ny=p.y+p.dy*sp*dt;
      if(!blocked(nx,p.y,R))p.x=nx;
      if(!blocked(p.x,ny,R))p.y=ny;
    });
    bl=bl.filter(function(b){
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(blocked(b.x,b.y,0)){burst(b.x,b.y,'#fff',6);return false}
      var q=pl[1-b.o];
      if(q.dt<=0&&Math.hypot(q.x-b.x,q.y-b.y)<R+6){
        q.hp-=20;var kx=q.x+b.vx*.02,ky=q.y+b.vy*.02;if(!blocked(kx,ky,R)){q.x=kx;q.y=ky}
        shake=10;burst(b.x,b.y,col[1-b.o],16);io.hap(1-b.o,[80]);return false}
      return true;
    });
    if(pl[0].hp<=0||pl[1].hp<=0){
      var d=pl[0].hp<pl[1].hp?0:1,w=1-d;wins[w]++;shake=20;burst(pl[d].x,pl[d].y,col[d],70);io.hap(d,[200]);
      if(wins[w]>=2){done=1;io.end({win:w,sc:wins.slice()})}
      else{banner='Người chơi '+(w+1)+' thắng hiệp '+(wins[0]+wins[1]);hold=2}
    }
  }
  function hud(){
    g.font='700 28px system-ui,sans-serif';g.textBaseline='middle';
    [0,1].forEach(function(i){
      var x=i?W-620:60,hp=Math.max(0,pl[i].hp)*5.6;
      g.fillStyle='rgba(255,255,255,.1)';g.fillRect(x,40,560,22);
      g.fillStyle=col[i];g.fillRect(i?x+560-hp:x,40,hp,22);
      g.textAlign=i?'right':'left';g.fillStyle='#fff';g.fillText('NGƯỜI CHƠI '+(i+1),i?x+560:x,92);
      for(var k=0;k<2;k++){g.fillStyle=k<wins[i]?col[i]:'rgba(255,255,255,.18)';g.beginPath();g.arc(i?x+548-k*34:x+12+k*34,130,11,0,7);g.fill()}
    });
    g.textAlign='center';g.fillStyle='#fff';
    if(cd>0){g.font='800 170px system-ui,sans-serif';g.fillText(Math.ceil(cd),W/2,H/2)}
    else if(hold>0){g.font='800 56px system-ui,sans-serif';g.fillText(banner,W/2,H/2)}
  }
  function draw(){
    g.save();
    if(shake)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    g.fillStyle='#070b16';g.fillRect(-30,-30,W+60,H+60);
    g.strokeStyle='rgba(124,92,255,.12)';g.lineWidth=1;g.beginPath();
    for(var x=0;x<=W;x+=50){g.moveTo(x,0);g.lineTo(x,H)}for(var y=0;y<=H;y+=50){g.moveTo(0,y);g.lineTo(W,y)}g.stroke();
    g.shadowBlur=18;g.shadowColor='#7c5cff';g.strokeStyle='#7c5cff';g.lineWidth=4;g.strokeRect(2,2,W-4,H-4);
    g.fillStyle='#17204a';walls.forEach(function(w){g.fillRect(w[0],w[1],w[2],w[3]);g.strokeRect(w[0],w[1],w[2],w[3])});
    bl.forEach(function(b){g.shadowColor=col[b.o];g.fillStyle=col[b.o];g.beginPath();g.arc(b.x,b.y,6,0,7);g.fill()});
    pl.forEach(function(p,i){
      if(p.hp<=0)return;
      g.shadowColor=col[i];g.fillStyle=p.dt>0?'#fff':col[i];g.beginPath();g.arc(p.x,p.y,R,0,7);g.fill();
      g.strokeStyle='#fff';g.lineWidth=5;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x+p.dx*(R+10),p.y+p.dy*(R+10));g.stroke();
    });
    fx.forEach(function(f){g.globalAlpha=Math.max(0,f.l*2);g.fillStyle=f.c;g.fillRect(f.x,f.y,4,4)});
    g.globalAlpha=1;g.shadowBlur=0;g.restore();hud();
  }
  reset();
  return{update:update,draw:draw};
}
