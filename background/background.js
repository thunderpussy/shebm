(function(){
var thread = null,
upd_data = null,
port,
time = (new Date()).getTime(),
store = "webms",
name = "webmdb",
empty = true,
ver = 2,
tab = 0;
//options 
var opt = optInit();
var defOpt = {};
initdb();
chrome.tabs.onActivated.addListener(function(obj){
 if(obj.tabId == tab){
  setOpt();
  chrome.tabs.sendMessage(tab, { id: "setOpt"});
  //cb(tab);
  console.log("debug : my tab activated.");
 }
});
function optInit(){
 opt = {};
 opt.names = [ 'hidStyle', 'applyHidStyle', 'autohide', 'hidePosts',
  'saveAll', 'pHide', 'szBias', 'savePvwMd5', 'dnWebm',
  'dnPath', 'doClones', 'chkPvw', 'chkSzWH', 'applyCloneStyle',
  'cloneStyle', 'hideClonePosts', 'utags', 'pics'
 ];
 return opt;
}
function getBase64Image(img) {
 var c, ctx, url, data;
 c = document.createElement("canvas");
 c.width = img.width;
 c.height = img.height;
 ctx = c.getContext("2d");
 ctx.drawImage(img, 0, 0);
 url = c.toDataURL("image/png");
 data = url.replace(/^data:image\/(png|jpg);base64,/, "");
 return data;
}
function firstTimeInit(){
 var opt = optInit();
 defOpt = {
  'hidStyle': { border: '4px dashed', opacity: '0.5'},
  'applyHidStyle': true,
  'autohide': true,
  'hidePosts': true,
  'saveAll': false,
  'pHide': 'all',
  'szBias': 0,
  'savePvwMd5': true,
  'dnWebm': false,
  'dnPath': null,
  'doClones': true,
  'chkPvw': false,
  'chkSzWH': true,
  'applyCloneStyle': true,
  'cloneStyle': { border: '4px dashed', opacity: '0.5', borderColor: '#006E6E'},
  'hideClonePosts' : false,
  'utags': [ {title: 'funny', path: 'funny/'}, {title: 'music', path: 'music/'},
   {title: 'xxx', path: 'xxx/'}, {title: 'games', path: 'games/'},
   {title: 'trash', path: 'trash/'}
  ],
  'pics' : ['res/funny.png', 'res/music.png', 'res/xxx.png', 'res/games.png', 'res/trash.png']
 };
 setDefOpt(0);
 //chrome.extension.sendMessage({id: 'setDefUT'});
 loadImages(defOpt.pics.length - 1, null);
}
function loadImages(i, img){
 if(i < 0){
  chrome.storage.local.set({ utags: defOpt.utags });
  return;
 }
 if(!img){
  img = document.createElement('img');
  img.src = chrome.extension.getURL(defOpt.pics[i]);
 }
 if(img.width == 0){
  setTimeout(function(){
   loadImages(i, img);
  }, 100);
  return;
 }
 defOpt.utags[i].img = getBase64Image(img);
 return loadImages(--i, null);
}
///////////////////////////////////////
function setDefOpt(i){
 var name, value, obj;
 name = opt.names[i];
 value = defOpt[name];
 obj = {};
 obj[name] = value;
 chrome.storage.local.set(obj, function(r1){
  i++;
  if( i == opt.names.length){
   //initdb();
   chrome.storage.local.get( opt.names, function(r2){
    console.log("test", r2);
    opt = r2;
   });
  } else {
   setDefOpt(i);
  }
 });
}
function setOpt(){
 chrome.storage.local.get( opt.names, function(res){
  opt = res;
  opt.pHide = res.pHide == "all";
 });
}
function initdb(){
 setOpt();
 console.log("db init...");
 window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
 IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction
 || window.msIDBTransaction;
 if (!window.indexedDB) {
  window.alert("Your browser doesn't support a stable version of IndexedDB.");
 }
}
function dberr(err){
 console.log(err);
}
function connect(f){
 var rq = window.indexedDB.open(name, ver);
 rq.onerror = function(err){
  console.log(err);
 };
 rq.onsuccess = function(){
  console.log("db connect success.");
  f(rq.result);
 };
 rq.onupgradeneeded = function(e){
  var st = e.currentTarget.result.createObjectStore(store, { keyPath: "md5" });
  st.createIndex("pvwMd5", "pvwMd5", {unique: false});
  st.createIndex("filename", "filename", { unique: false });
  st.createIndex("date_add", "date_add", { unique: false });
  st.createIndex("date_upd", "date_upd", { unique: false });
  st.createIndex("upd_thread", "upd_thread", { unique: false });
  st.createIndex("width", "width", { unique: false });
  st.createIndex("height", "heigth", { unique: false });
  st.createIndex("size", "size", { unique: false });
  st.createIndex("hits", "hits", { unique: false });
  st.createIndex("hide", "hide", { unique: false });
  connect(f);
 };
}
function getStore(store, mod, f){
 connect( function(base){
  var objStore = base.transaction([store], mod).objectStore(store);
  if(f){
   f(objStore);
  } else {
   console.log("Error store not found.");
  }
 });
}
function setWebm(webm, f){
 getStore(store, "readwrite", function(st){
  var rq = st.put(webm);
  rq.onerror = function(err){
   console.log(err);
  };
  rq.onsuccess = function(){
   if(f)
    f(rq.result);
  };
 });
}
function getWebm(md5, f){
 getStore(store, "readonly", function(st){
  var rq = st.get(md5);
  rq.onerror = function(err){
   console.log(err);
  };
  rq.onsuccess = function(){
   if(f){
    f(rq.result);
   }
  };
 });
}
function getCount(f){
 getStore(store, "readonly", function(st){
  var rq = st.count();
  rq.onsuccess = function() {
   //console.log("Records in base : " + rq.result);
   if(f){
    f(rq.result);
   }
  }
 });
}
function drop(f){
 console.log("deleting " + name + " database.");
 indexedDB.deleteDatabase(name);
 initdb();
 if(f){
  f();
 }
}
function getAllItems(f, step, prog){
 var count, done = 0, proc = 0, p = 0;
 getCount(function(res){
   count = res;
 });
 getStore(store, "readonly", function(st){
  var all = [];
  var rq = st.openCursor();
  rq.onerror = function(err){ console.log(err); };
  rq.onsuccess = function(e){
   if(f && e.target.result){
    //console.log("Preparing export...");
    var curs = e.target.result;
    if(curs){
     all.push(curs.value);
     done = all.length;
     p = 100 / count * done;
     if(p - proc >= step){
      proc = p;
      prog(proc);
     }
     if(done == count){
      prog(0);
      f(all);
     } else {
      curs.continue();
     }
    }
   }
  }
 });
}
function checkClones1(data, cb){
 var w = data.webm;
 var from = w.size - parseInt(opt.szBias);
 var to = w.size + parseInt(opt.szBias);
 var range = IDBKeyRange.bound(from, to);
 getStore(store, "readonly", function(st){
  var idx = st.index("size");
  var rq = idx.openCursor(range);
  rq.onerror = function(err){
   console.log(err);
  };
  rq.onsuccess = function(e){
   var curs = event.target.result;
   if(curs) {
    var w2 = curs.value;
    if(w.width == w2.width && w.heigth == w2.heigth && w2.hide){
     return cb(w2);
    }
    curs.continue();
   } else {
    return cb(null);
   }
  };
 });
}
function checkClones2(data, cb){
 var w = data.webm;
 getStore(store, "readonly", function(st){
  var idx = st.index("pvwMd5");
  //var rq = idx.openCursor();
  var rq = idx.get(data.webm.pvwMd5);
  rq.onerror = function(err){
   console.log(err);
  };
  rq.onsuccess = function(e){
   var curs = event.target.result;
   if(curs) {
    var w2 = curs.value;
    if(w2 && w2.hide){
     return cb(w2);
    }
    curs.continue();
   } else if(opt.chkSzWh){
    return checkClones1(data, cb);
   } else {
    return cb(null);
   }
  };
 });
}
function checkClones(data, cb, done){
 if(opt.chkSzWH && opt.chkPvw){
  checkClones2(data, cb);
 } else if(opt.chkSzWH){
  checkClones1(data, cb);
 } else if(opt.chkPvw){
  checkClones2(data, cb);
 }
 /*

	if(!opt.chkSzWH){

		checkClones2(data, cb);

	}

	else checkClones1(data, cb);

	*/
}
/*request partial content

function getPartial(url, r1, r2, cb){

	

	var rq = new XMLHttpRequest();	

	var range = "bytes=" + r1 + "-" + r2;

	rq.setRequestHeader("Range", range);

	

	rq.onreadystatechange = function() {

			if (rq.readyState == 4 && rq.status == 200) {

					var myArr = JSON.parse(rq.responseText);

					myFunction(myArr);

			}

	}

	rq.open("GET", url, true);

	rq.send(); 

} */
function update(data, cb){
 if(data == null){
  console.log("Error updating. data == null");
  return;
 } else {
  for(var i = 0; i < data.length; i++){
   setWebm(data[i]);
  }
 }
 if(cb != null){
  cb();
 }
}
function openOptions(){
 chrome.tabs.create({ url: "options.html" }, function(tab){
  console.log("open options tab...");
 });
}
function dbExport(){
 console.time("Export finished");
 getAllItems(function(base){
  var myJson = JSON.stringify(base);
  var blob = new Blob([myJson], {type: "application/json"});
  var baseUrl = window.URL.createObjectURL(blob);
  chrome.downloads.download({ url: baseUrl }, function(){
   console.timeEnd("Export finished");
  });
 }, 1, function(prog){
  chrome.runtime.sendMessage({ id: "ioProg", data: prog});
 });
}
function dbImport(base, step, prog){
 var len = base.length, done = 0, proc = 0, p = 0;
 if(base == null || len == null){
  console.log("Error importing base. Invalid import paramenter.");
  return;
 }
 time = (new Date()).getTime();
 console.time("Import finished");
 getStore(store, "readwrite", function(st){
  for(var i = 0; i < len; i++){
   var w = base[i];
   if(w.md5 === undefined){
    console.log("Warning: unable to import record (" + i + "). " +
    "MD5 is undefined. Skipping...");
    continue;
   }
   if(w.hide === undefined){
    w.hide = false;
   }
   w.hits = w.hits == null ? 1 : w.hits;
   w.date_add = w.date_add == null ? time : w.date_add;
   w.date_upd = w.date_upd == null ? time : w.date_upd;
   w.upd_thread = w.upd_thread == null ? 0 : w.upd_thread;
   if(w.pvwMd5 == undefined){
    w.pvwMd5 = null;
   }
   w.date_import = time;
   var r = st.put(base[i]);
   r.onerror = function(err){
    console.log(err);
   };
   r.onsuccess = function()
   {
    done++;
    p = 100 / len * done;
    if(p - proc >= step){
     proc = p;
     prog(proc);
    }
    if(done == len){
     prog(0);
     console.timeEnd("Import finished");
     //db.close();
    }
   }
  }
 });
}
function dbImport2(base, step, prog){
 var len = base.length;
 if(base == null || len == null){
  console.log("Error importing base. Invalid import paramenter.");
  return;
 }
 time = (new Date()).getTime();
 var done = 0, proc = 0, p;
 console.time("Import finished");
 for(var i = 0; i < base.length; i++){
  var w = base[i];
  if(w.md5 === undefined){
   console.log("Warning: unable to import record (" + i + "). " +
   "MD5 is undefined. Skipping...");
   continue;
  }
  if(w.hide === undefined){
   w.hide = false;
  }
  if(w.except === undefined){
   w.except = false;
  }
  if(w.hits === undefined){
   w.hits = 1;
  }
  if(w.date_add === undefined){
   w.date_add = time;
  }
  if(w.date_upd === undefined){
   w.date_upd = time;
  }
  if(w.upd_thread === undefined){
   w.upd_thread = 0;
  }if(w.pvwMd5 == undefined){
   w.pvwMd5 = null;
  }
  w.date_import = time;
  getStore(store, "readwrite", function(st){
   for(var i = 0; i < len; i++){
    (function(i){
     var r = st.put(base[i]);
     r.onerror = function(err){ console.log(err); };
     r.onsuccess = function()
     {
      done++;
      p = 100 / len * done;
      if(p - proc >= step){
       proc = p;
       prog(proc);
      }
      if(done == len){
       prog(0);
       console.timeEnd("Import finished");
       db.close();
      }
     }
    })(i);
   }
  });
  /*setWebm(w, function(w){ 

			done++;			

			p = 100 / len * done; 

			if(p - proc >= step){

				proc = p;

				prog(proc);

			}

			if(done == len){

				prog(0);				

			}			

		});*/
 }
}
function download(options, cb) {
 chrome.downloads.download(options);
}
//messaging
///////////////////////////////////////////////////////////////////////////////
chrome.extension.onMessage.addListener(function (msg, sender, cb){
 switch(msg.id){
 case "update":
  update(msg.data, cb);
  break;
 case "base_export":
  dbExport();
  break;
 case "download":
  download(msg.data);
  break;
 case "base_import":
  dbImport(msg.base, 1, function(p){
   chrome.runtime.sendMessage({ id: "ioProg", data: p});
  });
  break;
 case "getWebm":
  getWebm(msg.md5, cb);
  break;
 case "setWebm":
  setWebm(msg.data, cb);
  break;
 case "getCount":
  getCount(function(count){
   chrome.tabs.query({ active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage( tabs[0].id, {id:"recordsCount", data: count });
   });
  });
  break;
 case "base_drop":
  drop();
  break;
 case "checkClones":
  checkClones(msg, cb);
  break;
 case "tabid":
  tab = sender.tab.id;
  break;
 default:
  break;
 }
 return true;
});
chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
 port = chrome.tabs.connect(tabs[0].id);
});
chrome.runtime.onConnect.addListener(function(port){
 port.onMessage.addListener(function(msg) {
  console.log("background msg at port " + port.name);
  switch(msg.id){
  /*case "getWebm":

			db.getWebm(msg.md5, msg.cb);*/
  default:
  break;
  }
 });
});
chrome.runtime.onInstalled.addListener(function(event){
 switch(event.reason){
  case "install":
   firstTimeInit();
   break;
  case "update":
   firstTimeInit();
   break;
  break;
  default:
  break;
 }
});
///////////////////////////////////////////////////////////////////////////////
})();
