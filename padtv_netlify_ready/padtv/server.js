const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const {WebSocketServer}=require('ws'),QR=require('qrcode');
const PORT=process.env.PORT||3000,PUB=path.join(__dirname,'public'),GAMES=['arena'];
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webp':'image/webp','.json':'application/json; charset=utf-8'};
const ALIAS={'/':'/index.html','/tv':'/tv.html','/c':'/controller.html'};
const lan=()=>{for(const l of Object.values(os.networkInterfaces()))for(const i of l)if(i.family==='IPv4'&&!i.internal)return i.address;return'localhost'};

const srv=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,'http://x');
    if(u.pathname==='/api/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,service:'PadTV Realtime',rooms:rooms.size}))}
    if(u.pathname==='/api/info'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({lan:lan()}))}
    if(u.pathname==='/qr'){
      const svg=await QR.toString(String(u.searchParams.get('t')||'').slice(0,300),{type:'svg',margin:0});
      res.setHeader('Content-Type','image/svg+xml');return res.end(svg);
    }
    const f=path.join(PUB,ALIAS[u.pathname]||decodeURIComponent(u.pathname));
    if(!f.startsWith(PUB+path.sep))throw 403;
    fs.readFile(f,(e,d)=>{
      if(e){res.statusCode=404;return res.end('Not found')}
      res.setHeader('Content-Type',MIME[path.extname(f)]||'application/octet-stream');
      res.setHeader('Cache-Control','no-cache');res.end(d);
    });
  }catch(e){res.statusCode=e===403?403:400;res.end()}
});

// ---- Phòng chơi: mỗi phòng = 1 TV + tối đa 2 điện thoại (slot 0 và 1) ----
const rooms=new Map(),wss=new WebSocketServer({server:srv,maxPayload:2048});
const send=(c,o)=>{if(c&&c.readyState===1)c.send(JSON.stringify(o))};
const host=r=>r.p[0]?0:r.p[1]?1:-1;
const cast=r=>{const m={t:'room',code:r.code,p:[!!r.p[0],!!r.p[1]],host:host(r),st:r.st,g:r.g,tv:!!r.tv,res:r.res};[r.tv,...r.p].forEach(c=>send(c,m))};
const cl=v=>Math.max(-1,Math.min(1,+v||0));
const newCode=()=>{let c;do c=String(1000+Math.floor(Math.random()*9000));while(rooms.has(c));return c};

wss.on('connection',ws=>{
  ws.alive=true;ws.on('pong',()=>ws.alive=true);
  ws.on('message',raw=>{
    try{
      const m=JSON.parse(raw);if(!m||typeof m!=='object')return;
      const r=ws.room,isTv=ws.role==='tv',isHost=!!r&&ws.role==='p'&&ws.slot===host(r);
      switch(m.t){
        case'create':{ // TV tạo phòng (hoặc nối lại phòng cũ sau khi tải lại trang)
          let x=rooms.get(String(m.code));
          if(!x||x.tv){x={code:newCode(),tv:null,p:[null,null],st:'lobby',g:GAMES[0],res:null};rooms.set(x.code,x)}
          clearTimeout(x.timer);x.tv=ws;ws.room=x;ws.role='tv';cast(x);break}
        case'join':{ // điện thoại vào phòng ở vị trí Người chơi 1 hoặc 2
          const x=rooms.get(String(m.code).replace(/\D/g,'')),s=m.slot===1?1:0;
          if(!x)return send(ws,{t:'err',m:'Không tìm thấy phòng. Hãy kiểm tra lại mã phòng.'});
          const old=x.p[s];
          if(old&&old!==ws){if(old.pid&&old.pid===m.id)old.terminate();else return send(ws,{t:'err',m:'Vị trí Người chơi '+(s+1)+' đã có người.'})}
          if(ws.role==='p'&&ws.room&&ws.room.p[ws.slot]===ws)ws.room.p[ws.slot]=null;
          ws.room=x;ws.role='p';ws.slot=s;ws.pid=String(m.id||'').slice(0,40);x.p[s]=ws;
          send(ws,{t:'joined',slot:s});cast(x);break}
        case'in':if(r&&r.tv&&ws.role==='p'&&r.st==='play')send(r.tv,{t:'in',s:ws.slot,x:cl(m.x),y:cl(m.y),a:m.a?1:0,b:m.b?1:0});break;
        case'st':if(r&&ws.role==='p')send(r.tv,{t:'st',s:ws.slot,ping:m.ping|0,bat:m.bat==null?null:m.bat|0});break;
        case'ping':send(ws,{t:'pong',ts:m.ts});break;
        case'hap':if(r&&isTv&&Array.isArray(m.p)&&m.p.length<6)send(r.p[m.s===1?1:0],{t:'hap',p:m.p.map(n=>Math.min(500,+n||0))});break;
        case'start':if(isHost&&r.p[0]&&r.p[1]&&r.tv){if(GAMES.includes(m.g))r.g=m.g;r.st='play';r.res=null;cast(r)}break;
        case'lobby':if(isHost||isTv){r.st='lobby';r.res=null;cast(r)}break;
        case'end':if(isTv&&r.st==='play'){const sc=Array.isArray(m.sc)?m.sc:[0,0];r.st='end';r.res={win:m.win|0,sc:[sc[0]|0,sc[1]|0]};cast(r)}break;
      }
    }catch(e){}
  });
  ws.on('close',()=>{
    const r=ws.room;if(!r)return;
    if(ws.role==='tv'&&r.tv===ws){ // giữ phòng 60 giây để TV kịp kết nối lại
      r.tv=null;cast(r);
      r.timer=setTimeout(()=>{r.p.forEach(c=>send(c,{t:'closed'}));rooms.delete(r.code)},60000);
    }else if(ws.role==='p'&&r.p[ws.slot]===ws){
      r.p[ws.slot]=null;if(r.st!=='lobby'){r.st='lobby';r.res=null}cast(r);
    }
  });
});
setInterval(()=>wss.clients.forEach(c=>{if(!c.alive)return c.terminate();c.alive=false;c.ping()}),20000);
srv.listen(PORT,'0.0.0.0',()=>console.log('\n  PadTV đang chạy\n  Trên máy này  : http://localhost:'+PORT+'/tv\n  Trong mạng LAN: http://'+lan()+':'+PORT+'/tv\n'));
