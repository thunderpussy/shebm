//#define DEBUG
(function(){
var s = document.createElement('script');
s.src = chrome.extension.getURL('makabinj.js');
s.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head || document.documentElement).appendChild(s);
var time = (new Date()).getTime(), thread = null, posts = [], webms = 0,
tid = null, upd_data = [], phidden = [], whidden = [], wclones = [],
cur = 0, tab = 0, last = 0, mpics = [], calls = 0, timeout = 500, listeners = 0,
utWrap = null, lastImg, utTO, imWrap;
opt = {};
opt.names = [ "hidStyle", "applyHidStyle", "autohide", "hidePosts",
  "saveAll", "pHide", "szBias", "savePvwMd5", "savePvw",
  "dnWebm", "dnPath", "doClones", "chkPvw", "chkSzWH",
  'applyCloneStyle', 'cloneStyle', 'hideClonePosts', 'utags',
  'utags_enabled'
 ];
opt.hideAll = false;
window.addEventListener('message', function(event) {
    //log('content.js got message:', event);
    // check event.type and event.data
 switch(event.data.id){
 case 'thread_update':
  threadUpdate();
  break
 default:
  break;
 }
});
chrome.runtime.onMessage.addListener(function(msg, sender, callback){
 switch(msg.id){
 case "thread_update":
  threadUpdate();
  break;
 case "report":
  report();
  break;
 case "hidStyle":
  if(style === undefined){
   opt.hidStyle = {};
   console.log("Invalid style.");
   return;
  } else {
   opt.hidStyle = msg.data;
  }
  break;
 case "setOpt":
  setOpt();
  break;
 case "hideAll":
  opt.hideAll = true;
  cur = 0;
  threadUpdate();
  break;
 case "unhide_all":
  unhideAll();
  break;
 default:
  break;
 }
 return true;
});
var port = chrome.runtime.connect();
chrome.runtime.onConnect.addListener(function(port) {
 port.onMessage.addListener(function(msg) {
  switch(msg.type){
  case "hide_post":
   hidePost(msg.post);
   break;
  default:
   console.log("unknown msg " + msg.type);
  }
 });
});
function merge(from, to){
 for(var p in from){
  to[p] = from[p];
 }
}
function timeFormat(sec){
 var str, t;
 t = (new Date);
 t.setTime(sec);
 str = numPad(t.getDate(), 2) + "." + numPad((t.getMonth() + 1), 2) + "." +
 (t.getFullYear() + "").substr(2,2) + " " + numPad(t.getHours(), 2) + ":" +
 numPad(t.getMinutes(), 2);
 return str;
}
function disappear(el, step, time){
 var o = parseInt(el.style.opacity)
 o -= step;
 if(o <= 0){
  el.style.display = 'none';
  return;
 }
 el.style.opacity = o;
 setTimeout( function(){
  disappear(el, step, time);
 });
}
function numPad(num, sz){
 num = num + "";
 if(num.length >= sz){
  return num;
 }
 return new Array(sz - num.length + 1).join('0') + num;
}
function postFromImg(img){
 return img.parentNode
}
function getMd5(el){
 var link = el.parentNode.getAttribute("onclick");
 return link.match(/[0-9a-f]{32}/)[0];
}
 // ut - user tags
function infoMenu(){
 imWrap = document.createElement('div');
 imWrap.id = 'im_wrap';
 imWrap.style = "overflow: overlay; display: none; position: fixed;" +
  "top: 50%; left: 50%; margin-top: -50px; margin-left: -50px";
 var imMenu = document.createElement('div');
 imWrap.appendChild(imMenu);
 imMenu.id = 'im_menu';
 imMenu.style = 'margin: 4px; overflow: overlay; ' +
  'background-color: #DDDDDD; border: 2px solid grey; border-radius: 4px';
 imMenu.innerHTML = '<ul id="wbb-info"><li>Hide: <span id="wbb-hide"></span></li>' +
 '<li>Added: <span id="wbb-add"></span></li>' +
 '<li>Last seen: <span id="wbb-upd"></span></li>' +
 '<li>Hits: <span id="wbb-hits"></span></li></ul>';
 imMenu.children[0].style = "list-style-type: none; padding: 2px; margin: 2px";
 imMenu.setAttribute('name', 'expandfunc');
 var b = document.getElementsByTagName("body")[0];
 b.appendChild(imWrap);
}
function utMenuHide(){
 disappear(utWrap, 0.2, 100);
 window.removeEventListener('click', utMenuHide);
}
function setutWrap(){
 utWrap = document.createElement('div');
 utWrap.id = 'ut_wrap';
 utWrap.style = "overflow: overlay; display: none; position: absolute";
 utMenu = document.createElement('div');
 utMenu.id = 'ut_menu';
 utMenu.style = 'margin: 2px; overflow: overlay; ' +
  'background-color: #DDDDDD; border: 2px solid grey; border-radius: 4px';
 utMenu.setAttribute('name', 'expandfunc');
 utWrap.appendChild(utMenu);
 /*utWrap.onclick = func(){

		utWrap.style.display = 'none';

	};*/
 utMenu.onmouseenter = function(){
  console.log("mouseenter menu");
  clearTimeout(utTO);
  utWrap.style.opacity = 1;
 };
 utMenu.onmouseleave = function(){
  if(event.toElement.id != 'ut_wrap'){
   return;
  }
  console.log("mouseleave menu");
  utTO = setTimeout(function(){
   utWrap.style.display = 'none';
  }, 500);
 };
 utMenu.appendChild(document.createElement('ul'));
 var list = utMenu.children[0];
 list.style = "list-style-type: none; padding: 2px; margin: 2px";
 var i = 0;
 for( ; i < opt.utags.length; i++ ){
  var li, img;
  list.appendChild(document.createElement('li'));
  li = list.children[i];
  li.appendChild(document.createElement('img'));
  img = li.children[0];
  img.idx = i;
  img.style.cursor = 'pointer';
  img.setAttribute('name', 'expandfunc');
  if(opt.utags[i].img == null){
   img.src = chrome.extension.getURL("res/none.png");
  } else {
   img.src = "data:image/png;base64," + opt.utags[i].img;
  }
  li.style = "float: left; margin: 2px;";
  img.onclick = function(e){
   var idx, src, md5, fname, path, dnOpt = {};
   idx = parseInt(this.idx);
   src = lastImg.parentNode.href;
   //md5 = getMd5(lastImg);
   fname = src.match(/\d+\.webm/);
   path = opt.utags[idx].path;
   if(path){
    var ch = path.charAt(path.length -1);
    if(ch != '/' || ch != '\\'){
     path += '/';
    }
    path += fname;
    dnOpt.filename = path;
   }
   dnOpt.url = src;
   dnOpt.conflictAction = "overwrite";
   chrome.runtime.sendMessage({id: "download", data: dnOpt});
  };
 }
 list.appendChild(document.createElement('li'));
 var li = list.children[i];
 li.style = "float: left; margin: 2px;";
 li.appendChild(document.createElement('img'));
 var img = li.children[0];
 img.style.cursor = 'pointer';
 img.setAttribute('name', 'expandfunc');
 img.src = chrome.extension.getURL("res/info.png");
 img.addEventListener('click', showInfoMenu);
 var b = document.getElementsByTagName("body")[0];
 b.appendChild(utWrap);
}
function showInfoMenu(fc){
 console.log('Show Info Menu');
 var list = utMenu.children[0];
 var info = list.children[list.children.length - 1].children[0];
 info.removeEventListener('click', showInfoMenu);
 //var r = lastImg.getBoundingClientRect();
 infMenuUpd(lastImg);
 imWrap.style.display = 'initial';
 imWrap.addEventListener('click', hideInfoMenu);
 info.addEventListener('click', hideInfoMenu);
}
function hideInfoMenu(fc){
 console.log('hideInfoMenu');
 imWrap.style.display = 'none';
 imWrap.removeEventListener('click', hideInfoMenu);
 var list = utMenu.children[0];
 var info = list.children[list.children.length - 1].children[0];
 info.removeEventListener('click', hideInfoMenu);
 info.addEventListener('click', showInfoMenu);
}
function createMenu(ico){
 var menu, hide, md5;
 menu = document.createElement("div");
 //menu.class = "wbb-menu";
 menu.id = "wbb-menu";
 menu.setAttribute("style", "background: #DDDDDD; position: absolute; z-index: 999;" +
 "width: auto; padding-right: 2cm; border:2px solid grey");
 menu.innerHTML = '<ul id="wbb-info"><li>Hide: <span id="wbb-hide"></span></li>' +
 '<li>Added: <span id="wbb-add"></span></li>' +
 '<li>Last seen: <span id="wbb-upd"></span></li>' +
 '<li>Hits: <span id="wbb-hits"></span></li></ul>';
 upd_block = true;
 ico.parentElement.appendChild(menu);
 menuUpdate(menu, ico.pic);
 upd_block = false;
 md5 = getMd5(ico.pic);
 hide = menu.querySelector("#wbb-hide");
 hide.addEventListener("click", function(){
  chrome.runtime.sendMessage({id: "getWebm", md5: md5}, function(w){
   if(w == null){
    makeWebm(ico.pic, function(ret){
     ret.hide = true;
     chrome.runtime.sendMessage({id: "setWebm", data: w});
     menuUpdate(menu, ico.pic);
    })
   } else {
    w.hide = w.hide ? false : true;
    this.innerHTML = w.hide ? "yes" : "no";
    chrome.runtime.sendMessage({id: "setWebm", data: w});
    menuUpdate(menu, ico.pic);
   }
  });
 });
}
function infMenuUpd(el){
 var hide, add, upd, hits, md5;
 hide = imWrap.querySelector("#wbb-hide");
 add = imWrap.querySelector("#wbb-add");
 upd = imWrap.querySelector("#wbb-upd");
 hits = imWrap.querySelector("#wbb-hits");
 md5 = getMd5(el);
 chrome.runtime.sendMessage({id: "getWebm", md5: md5}, function(w){
  upd_block = true;
  if(w == null){
   hide.innerHTML = "no";
   add.innerHTML = "never";
   upd.innerHTML = "never";
   hits.innerHTML = "0";
  } else {
   if(w.hide){
    hide.innerHTML = "yes";
   } else {
    hide.innerHTML = "no";
   }
   add.innerHTML = timeFormat(w.date_add);
   upd.innerHTML = timeFormat(w.date_upd);
   hits.innerHTML = w.hits;
  }
  upd_block = false;
 });
}
window.addEventListener("load", function() {
 upd_data = [], phidden = [], whidden = [], wclones = [];
 init(function(){
  setListeners();
  if(opt.autohide){
   threadUpdate();
  }
  setutWrap();
  infoMenu();
 });
 chrome.runtime.sendMessage({ id: "tabid" }, function(ret){
  tab = ret;
  setOpt();
 });
 var fc = document.getElementById('fullscreen-container');
 fc.addEventListener("wheel", function(){
  setTimeout(function(){
   var r = fc.getBoundingClientRect();
   utWrap.style.left = r.left + window.pageXOffset + 'px';
   utWrap.style.top = (r.top + window.pageYOffset - utWrap.clientHeight) + 'px';
  }, 50);
 });
 fc.addEventListener('mouseenter', function(){
  if(!opt.utags_enabled || this.children[0].tagName != 'VIDEO'){
   return;
  }
  utWrap.style.display = 'initial';
  utWrap.style.opacity = 1;
  var r = fc.getBoundingClientRect();
  utWrap.style.left = r.left + window.pageXOffset + 'px';
  utWrap.style.top = (r.top + window.pageYOffset - utWrap.clientHeight) + 'px';
  clearTimeout(utTO);
 });
 fc.addEventListener("mouseleave", function(e){
  if(!opt.utags_enabled){
   return;
  }
  utTO = setTimeout( utMenuHide, 200 );
 });
 window.addEventListener('click', function(e){
  if(e.srcElement.className == "img preview webm-file"){
   lastImg = e.srcElement;
   var el = e.srcElement;
   var md5 = parseMd5(el);
   chrome.runtime.sendMessage({id: 'getWebm', md5: md5}, function(webm){
    webmListener(webm, el);
   });
   if(opt.applyHidStyle){
    merge(opt.hidStyle, el.style);
   }
   var fc = document.getElementById('fullscreen-container');
  }
  utMenuHide();
 });
 window.postMessage({ type: 'init' }, '*');
}, true);
function malert(text){
 makab_call('$alert', text);
}
function hidePost(p){
 var num = parseInt(p.id.match(/\d+/));
 window.postMessage({ type: 'hide', data: num }, '*');
}
function showPost(p){
 var num = parseInt(p.getAttribute('data-num'));
 window.postMessage({ type: 'unhide', data: num }, '*');
}
function makab_call(f, args){
 window.postMessage({ type: 'call', f: f, args: [args]}, '*');
}
function setListeners(){
 var els = document.getElementsByClassName("img preview webm-file");
 if(els == null){
  return;
 }
 var len = els.length;
 if(listeners == len){
  return;
 }
 for( ; listeners < len; listeners++){
  els[listeners].style.border = "2px solid";
  var ico = els[listeners].parentNode.parentNode.previousElementSibling.children[1];
  ico.pic = els[listeners];
  ico.style.cursor = "pointer";
  ico.onclick = function(e){
   var pic = this.pic;
   var md5 = parseMd5(pic);
   chrome.runtime.sendMessage({id: 'getWebm', md5: md5}, function(webm){
    if(webm){
     time = (new Date()).getTime();
     webm.date_upd = time;
     if(webm.hide){
      webm.hide = false;
      pic.style = "border: 1px dashed; border-color: #818181";
     } else {
      webm.hide = true;
      if(opt.applyHidStyle){
       merge(opt.hidStyle, pic.style);
      }
     }
     chrome.runtime.sendMessage({id: 'setWebm', data: webm}, function(md5){
      console.log(md5);
     });
    } else {
     webmListener(null, pic);
     if(opt.applyHidStyle){
      merge(opt.hidStyle, pic.style);
     }
    }
   });
  }
 }
}
function setOpt(cb){
 chrome.storage.local.get( opt.names, function(res){
  opt = res;
  //opt.hidStyle = JSON.parse(res.hidStyle);		
  opt.pHide = res.pHide == "all" ? true : false;
  opt.hideAll = false;
  if(cb){
   cb();
  }
 });
}
function init(cb){
 upd_data = [];
 posts = document.getElementsByClassName("post-wrapper");
 webms = document.getElementsByClassName("img preview webm-file").length;
 thread = document.getElementsByClassName("thread")[0];
 tid = thread.id.match(/\d+/)[0];
 setOpt(cb);
}
function threadUpdate(){
 var oppost = document.getElementsByClassName("post oppost")[0];
 var oppostWebms = oppost.getElementsByClassName("img preview webm-file").length;
 posts = document.getElementsByClassName("post-wrapper");
 webms = document.getElementsByClassName("img preview webm-file").length;
 webms -= oppostWebms;
 if(opt.hideAll){
  last = 0;
  whidden = [];
  wclones = [];
 }
 if(!posts.length || !webms || posts.length == last){
  //calls = 0;
  return;
 }
 time = (new Date()).getTime();
 upd_data = [];
 upd_block = true;
 postCheck(last);
 last = posts.length;
 setListeners();
}
function postCheck(i){
 if(i == posts.length){
  upd_block = false;
  return;
 }
 var p = {};
 p.post = posts[i];
 p.ewi = p.post.getElementsByClassName("img preview webm-file");
 p.pIdx = i;
 p.wIdx = 0;
 p.wHiden = 0;
 if(p.ewi.length == 0){
  return postCheck(++i);
 } else {
  return webmsCheck(p);
 }
}
function webmsCheck(p){
 if(p.wIdx == p.ewi.length){
  return postCheck(++p.pIdx);
 }
 var md5 = parseMd5(p.ewi[p.wIdx]);
 (function(p, wIdx){
  chrome.runtime.sendMessage({ id: "getWebm", md5: md5 }, function(w){
   //cur++;
   webmCheck(p, w, wIdx, true);
  });
 })(p, p.wIdx);
 p.wIdx++;
 webmsCheck(p);
}
function webmCheck(p, w, wIdx, clones, prvw){
 var img = p.ewi[wIdx];
 if(w == null){
  if(opt.doClones || opt.hideAll || opt.saveAll){
   return makeWebm(img, function(webm){
    webmCheck(p, webm, wIdx, true);
   });
  } else {
   return endcheck();
  }
 }
 if(prvw == null){
  prvw = true;
 }
 if(!w.pvwMd5 && opt.savePvwMd5 && prvw){
  getPvwMd5(w, img, function(w){
   webmCheck(p, w, wIdx, true, false);
  });
 }
 if(!w.hide){
  if(opt.hideAll){
   w.hide = true;
   w.upd_thread = -1;
   return webmCheck(p, w, wIdx, false);
  }
  if(opt.doClones && clones){
   chrome.runtime.sendMessage({ id: "checkClones", webm: w }, function(clone){
    if(clone){
     wclones.push(w);
     w.hide = true;
     w.clone = true;
    }
    webmCheck(p, w, wIdx, false);
   });
   return;
  }
  if(opt.saveAll){
   upd_data.push(w);
   return endcheck();
  }
 } else {
  if(opt.hidePosts){
   var hide = false;
   p.wHiden++;
   if(opt.pHide){
    hide = p.wHiden == p.ewi.length;
   } else {
    hide = true;
   }
   if(hide && p.post.style.display != "none"){
    hidePost(p.post);
   }
  }
  if(w.clone){
   if(opt.applyCloneStyle) {
    merge(opt.cloneStyle, img.style);
   }
  } else if(opt.applyHidStyle){
   merge(opt.hidStyle, img.style);
  }
  whidden.push(img);
 }
 if(w.upd_thread != tid){
  w.hits++;
  w.date_upd = time;
  w.upd_thread = tid;
  upd_data.push(w);
 }
 //cur++;
 return endcheck();
}
function endcheck(){
 if(++cur != webms)
  return;
 if(opt.hideAll)
  opt.hideAll = false;
 console.log("cur: " + cur + " webms: " + webms + " upd_data " + upd_data.length);
 report();
 upd_block = false;
 console.timeEnd("Update finished");
 console.profileEnd("Update profile");
 chrome.runtime.sendMessage({id: "update", data: upd_data}, function(response) {
  //log("posts hidden: " + phidden.length + "\n" + "webms hidden: " + whidden.length);		
 });
}
function updateData(){
 chrome.runtime.sendMessage({id: "update", data: upd_data}, function(response) {
  //log("posts hidden: " + phidden.length + "\n" + "webms hidden: " + whidden.length);		
 });
}
function makeWebm(el, cb){
 var w = {};
 w.size = parseInt(el.getAttribute("alt"));
 var image_link = el.parentNode.getAttribute("onclick");
 w.md5 = image_link.match(/[0-9a-f]{32}/)[0];
 w.filename = image_link.match(/\d+\.webm/)[0];
 var wh = image_link.match(/,(\d+),(\d+),\d+,\d+/);
 w.width = parseInt(wh[1]);
 w.heigth = parseInt(wh[2]);
 var tm = el.parentNode.parentNode.previousElementSibling.getElementsByClassName("filesize")[0].innerHTML.split(" ")[2];
 tm = tm.replace(")", "").split(":");
 w.length = parseInt(tm[0]) * 3600 + parseInt(tm[1]) * 60 + parseInt(tm[2]);
 time = (new Date()).getTime();
 w.date_add = time;
 w.date_upd = time;
 w.upd_thread = tid;
 w.hits = 1;
 w.hide = false;
 w.pvwMd5 = null;
 w.clone = false;
 if(opt.savePvwMd5 || opt.chkPvw){
  getPvwMd5(w, el, function(w){
   cb(w);
  });
 } else {
  return cb(w);
 }
}
function getPvwMd5(w, img, cb){
 var rq = new XMLHttpRequest();
 var url = img.src;
 rq.overrideMimeType('text/plain; charset=x-user-defined');
 rq.onreadystatechange = function() {
  if(rq.readyState == 4){
   if(rq.status == 200) {
    w.pvwMd5 = SparkMD5.hash(rq.responseText);
   }
   cb(w);
  }
 };
 rq.open("GET", url, true);
 rq.send();
}
function parseMd5(e){
 if(e.className != "img preview webm-file"){
  e = e.getElementsByClassName("img preview webm-file")[0];
 }
 return e.parentNode.getAttribute("onclick").match(/[0-9a-f]{32}/)[0];
}
function report(){
 //webms = document.getElementsByClassName("img preview webm-file").length;
 var proc = webms == 0 ? 0 : ( whidden.length / webms ) * 100.0;
 var text = whidden.length + " / " + webms + " hidden ( " +
  proc.toFixed(1) + "% )\n" + wclones.length + " clones.";
 malert(text);
}
function webmListener(w, el){
 if(!w){
  return makeWebm(el, function(webm){
   webmListener(webm, el);
  });
 }
 w.hide = true;
 w.date_upd = (new Date()).getTime();
 if(opt.dnWebm){
  var dnOpts = { url : el.parentNode.href, conflictAction: "overwrite" };
  if(opt.dnPath){
   if(opt.dnPath.charAt(opt.dnPath.length - 1) != "/"){
    opt.dnPath = opt.dnPath + "/";
   }
  }
  dnOpts.filename = opt.dnPath + w.filename;
  chrome.runtime.sendMessage({id: "download", data: dnOpts});
 }
 chrome.runtime.sendMessage({id: "setWebm", data: w}, function(md5){
 });
}
})();
