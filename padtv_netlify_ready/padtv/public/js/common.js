var $=function(s,e){return(e||document).querySelector(s)};
function getSocketUrl(){
  var cfg=window.PADTV_CONFIG||{},params=new URLSearchParams(location.search);
  var fromQuery=params.get('server');
  var raw=fromQuery||cfg.websocketUrl||'';
  if(raw){try{var u=new URL(raw);if(u.protocol==='https:')u.protocol='wss:';if(u.protocol==='http:')u.protocol='ws:';return u.href.replace(/\/$/,'')}catch(e){}}
  return (location.protocol==='https:'?'wss://':'ws://')+location.host;
}
function Net(onOpen,onMsg,onState){
  var ws,delay=500,closed=false,api={
    send:function(o){if(ws&&ws.readyState===1)ws.send(JSON.stringify(o));},
    close:function(){closed=true;if(ws)ws.close();}
  };
  function go(){
    if(closed)return;
    try{ws=new WebSocket(getSocketUrl())}catch(e){onState(0);retry();return}
    ws.onopen=function(){delay=500;onState(1);onOpen(api)};
    ws.onmessage=function(e){var m;try{m=JSON.parse(e.data)}catch(x){return}onMsg(m)};
    ws.onerror=function(){try{ws.close()}catch(e){}};
    ws.onclose=function(){onState(0);retry()};
  }
  function retry(){if(closed)return;setTimeout(go,delay);delay=Math.min(Math.round(delay*1.7),8000)}
  go();return api;
}
