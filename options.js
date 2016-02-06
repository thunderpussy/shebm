window.addEventListener("load", function() {
	
	var check, 
	table = [],
	row = 0,
	umodTO = 0,
	upd_block = false,
	
	/*pics = ['res/funny.png', 'res/music.png', 'res/xxx.png', 
		'res/games.png', 'res/trash.png'],*/
	
	keys = [ 'hidStyle', 'applyHidStyle', 'autohide', 'hidePosts', 
		'saveAll', 'pHide', 'doClones', 'szBias', 'savePvwMd5', 'dnWebm', 
		'dnPath', 'chkSzWH', 'chkPvw', 'applyCloneStyle', 'cloneStyle', 
		'hideClonePosts', 'utags', 'utags_enabled' ],
		
	names = [ 'inp_hidStyle', 'btn_hidStyle', 'chb_hidStyle', 'chb_autohide',
		'chb_hidePosts', 'chb_saveAll', 'hb_collectInfo', 'chb_doClones', 'pHide1', 'pHide2',
		'btn_export', 'btn_import', 'btn_drop', 'dbImport', 'inp_szBias',
		'btn_szBias', 'chb_savePvwMd5', 'chb_chkSzWH', 'chb_chkPvw', 'chb_dnWebm', 'inp_dnPath', 
		'btn_dnPath', 'chb_cloneStyle', 'inp_cloneStyle', 'btn_cloneStyle', 'chb_hideClPosts',
		'io_prog', 'utags_table', 'utag_mod', 'utag_add', 'utag_del', 
		'utag_th', 'inp_uico', 'chb_utags'
	],
		
	opt = {};

	for(var i = 0; i < names.length; i++){
		opt[names[i]] = document.getElementById(names[i]);	
	}  
	
	chrome.storage.local.get( keys, function(res){
		
		opt.chb_autohide.checked = res.autohide; 
		opt.inp_hidStyle.value = JSON.stringify(res.hidStyle);
		
		opt.chb_hidePosts.checked = res.hidePosts;
		check = opt.chb_hidePosts.checked;		
		opt.pHide1.disabled = opt.pHide2.disabled = !check;
		
		opt.chb_hidStyle.checked = res.applyHidStyle;	
		check = !opt.chb_hidStyle.checked;		
		opt.btn_hidStyle.disabled = opt.inp_hidStyle.disabled = check;
		
		//clones
		opt.chb_doClones.checked = res.doClones;
		check = opt.chb_doClones.checked; 
		
		opt.chb_chkPvw.checked = res.chkPvw;
		opt.chb_chkSzWH.checked = res.chkSzWH;
		
		opt.inp_szBias.value = res.szBias;
		opt.inp_szBias.disabled = !opt.chb_chkSzWH.checked;
		
		opt.chb_cloneStyle.checked = res.applyCloneStyle;
		opt.chb_cloneStyle.disabled = !res.doClones;
		
		opt.inp_cloneStyle.value = JSON.stringify(res.cloneStyle);
		opt.inp_cloneStyle.disabled = !res.doClones;
		
		opt.chb_hideClPosts.value = res.hideClonePosts;
		opt.chb_hideClPosts.disabled = !res.doClones;
		
		opt.chb_utags.checked = res.utags_enabled;
		
		table = res.utags;
		if(table){
			setRows(0, table.length);
		}
		
		/*if(res.defutags){
			chrome.storage.local.set({defutags: false});
			utSetDefault();
		}*/
  
		//////////////////////
		
		var radio = res.pHide == "all" ? 0 : 1;
		document.forms[0][radio].checked = true; 
		
		opt.chb_saveAll.checked = res.saveAll;
		opt.chb_savePvwMd5.checked = res.savePvwMd5; 
 	
		opt.chb_dnWebm.checked = res.dnWebm;		
		opt.inp_dnPath.value = res.dnPath == null ? " " : res.dnPath;
		opt.inp_dnPath.disabled = opt.chb_dnWebm.checked ? false : true;
 
	});
	
	////////////////////////////////////////////////////////////////////////////
	
	chrome.runtime.onMessage.addListener(function(msg, sender, callback){
		switch(msg.id){
		case "recordsCount":
			document.getElementById("numRecords").innerHTML = msg.data;
			break; 
		case "ioProg":
			//console.log("export progress: " + msg.data + "%");
			opt.io_prog.value = msg.data;
			if(msg.data == 0){
				opt.io_prog.style.opacity = 0;
			}
			break; 
		return true;
		}
	});
	
	chrome.extension.sendMessage({id: "getCount" });
	
	var dbImportBase = null;	
	opt.dbImport.addEventListener("change", function(e){
		var f = e.target.files[0];
		if(f){
			var reader = new FileReader();
			reader.onload = function(e){
				dbImportBase = JSON.parse(e.target.result);
				//console.log("File:", content);
			}
			reader.readAsText(f);
		}
	});
	
	opt.btn_export.onclick = function(){ 
		chrome.runtime.sendMessage({ id: "base_export" });	
		opt.io_prog.style.opacity = 1;
	};
 
	opt.btn_import.onclick = function(){ 	 
		chrome.runtime.sendMessage({ id: "base_import", base: dbImportBase });
		opt.io_prog.style.opacity = 1; 		
	};	
	
	opt.btn_drop.onclick = function(){ 
		chrome.runtime.sendMessage({ id: "base_drop"}); 
	};
	
	////////////////////////////////////////////////////////////////////////////
 
	opt.pHideGr = document.forms[0];
	opt.pHideGr[0].onchange = getChecked;
	opt.pHideGr[1].onchange = getChecked;
	
	function getChecked(){
		var pHide;
		for(var i = 0; i < pHideGr.length; i++){
			if(pHideGr[i].checked){
				pHide = pHideGr[i].value;
				chrome.storage.local.set({ pHide: pHide });
			}
		} 
	}
	  
	opt.btn_hidStyle.onclick = function(){ 	
		var style = {}; 
		try {
			style = JSON.parse(opt.inp_hidStyle.value);
		} catch(err){
			opt.inp_hidStyle.style.background = "#ffa3a3";
			return;
		}
		opt.inp_hidStyle.style.backgroundColor = "initial";
		 
		chrome.storage.local.set({ hidStyle: style });
	};
	
	opt.btn_szBias.onclick = function(){ 
		if(isNaN(opt.inp_szBias.value)){
			opt.inp_szBias.value = 0;
		} else {
			chrome.storage.local.set({ szBias: opt.inp_szBias.value });
		}
	};
 
	opt.chb_hidStyle.addEventListener("change", function(e){ 
		chrome.storage.local.set({applyHidStyle: opt.chb_hidStyle.checked});
		check = opt.chb_hidStyle.checked ? false : true;		
		opt.btn_hidStyle.disabled = opt.inp_hidStyle.disabled = check;
	});
	
	opt.chb_autohide.addEventListener("change", function(e){ 
		chrome.storage.local.set({ autohide: opt.chb_autohide.checked });
	});
		
	opt.chb_hidePosts.addEventListener("change", function(e){ 
		chrome.storage.local.set({hidePosts: opt.chb_hidePosts.checked});
		check = opt.chb_hidePosts.checked ? false : true;		
		opt.pHide1.disabled = opt.pHide2.disabled = check;
	});
	
	opt.chb_saveAll.addEventListener("change", function(e){ 
		chrome.storage.local.set({ saveAll: opt.chb_saveAll.checked });
	});
	
	opt.chb_doClones.addEventListener("change", function(e){
		chrome.storage.local.set({ doClones: opt.chb_doClones.checked });
		
		check = opt.chb_doClones.checked;		
		opt.chb_chkPvw.checked = opt.chb_chkSzWH.checked = check;
		opt.inp_szBias.disabled = opt.btn_szBias.disabled = 
		opt.chb_cloneStyle.disabled = opt.inp_cloneStyle.disabled =
		opt.btn_cloneStyle.disabled = opt.chb_hideClPosts.disabled = !check;
		
		chrome.storage.local.set({ chkPvw: opt.chb_chkPvw.checked });
		chrome.storage.local.set({ chkSzWH: opt.chb_chkSzWH.checked });
	});
 
	opt.chb_dnWebm.addEventListener("change", function(e){
		opt.inp_dnPath.disabled = opt.chb_dnWebm.checked ? false : true;
		chrome.storage.local.set({ dnWebm: opt.chb_dnWebm.checked });
	});
	 
	opt.btn_dnPath.onclick = function(){ 
		var path = opt.inp_dnPath.value;
		path = path == " " ? null : path;
		chrome.storage.local.set({ dnPath: path });
	};
	
	opt.chb_savePvwMd5.addEventListener("change", function(e){
		chrome.storage.local.set({ savePvwMd5: opt.chb_savePvwMd5.checked });
	});
	
	opt.chb_chkPvw.addEventListener("change", function(e){
		check = opt.chb_chkPvw.checked;
		if(check){
			if(!opt.chb_doClones.checked){
				opt.chb_doClones.click();
				opt.chb_chkSzWH.click();
			}
		} else if(!opt.chb_chkSzWH.checked){
			if(opt.chb_doClones.checked){
				opt.chb_doClones.click();
			}
		}
		chrome.storage.local.set({ chkPvw: check }); 
	}); 
	
	opt.chb_chkSzWH.addEventListener("change", function(e){
		check = opt.chb_chkSzWH.checked;				
		if(check){
			if(!opt.chb_doClones.checked){
				opt.chb_doClones.click();
				opt.chb_chkPvw.click();
			}	
		} else if(!opt.chb_chkPvw.checked){
			if(opt.chb_doClones.checked){
				opt.chb_doClones.click();
			}			
		}
		inp_szBias.disabled = btn_szBias.disabled = !check;
		chrome.storage.local.set({ chkSzWH: check });		
	}); 
 
	opt.chb_cloneStyle.addEventListener("change", function(e){
		check = opt.chb_cloneStyle.checked;
		chrome.storage.local.set({ applyCloneStyle: check });		
	});
	
	opt.btn_cloneStyle.onclick = function(){
		var style = {}; 
		try {
			style = JSON.parse(opt.inp_cloneStyle.value);
		} catch(err){
			opt.inp_cloneStyle.style.background = "#ffa3a3";
			return;
		}
		opt.inp_cloneStyle.style.backgroundColor = "initial";
		chrome.storage.local.set({ cloneStyle: style });
	};
 
	opt.utags_table = opt.utags_table.children[0];
	
	opt.utag_th.addEventListener("mouseover", trCbHover);
	opt.utags_table.addEventListener("mouseout", onMouseOut);
	
	opt.utag_mod.addEventListener("mouseover", function(e){
		console.log("mouseover utag_mod");
		clearTimeout(umodTO);
	});
	
	opt.utag_mod.addEventListener("mouseout", onMouseOut);
	
	opt.chb_utags.addEventListener("change", function(e){ 
		chrome.storage.local.set({ utags_enabled: opt.chb_utags.checked });
	});
	
	function onMouseOut(event){        
		if(event.toElement == null){
			return;
		}
		
		var t = event.toElement.tagName;
		//if(t == "TD" || t == "TR" || t == "TH" || t == "table"){
		if(t != "DIV"){
			return;
		}
		umodTO = setTimeout(utModHide, 2000);
	}
 
	function utModHide(){
		opt.utag_mod.style.display = "none";
	}
	
	function trCbHover(e){
		if(upd_block){
			return;
		}
		row = parseInt(this.rowIndex);
		console.log("mouseenter row: " + row);
		opt.utag_mod.style.display = "initial";
		var offTop = 0, offSide = 0, i;
		var r1 = opt.utags_table.children[0].children;
		for(i = 0; i < row; i++){
			offTop += opt.utags_table.children[i].clientHeight;
		}
		for(i = 0; i < r1.length; i++){
			offSide += r1[i].clientWidth;
		}
		opt.utag_mod.style.marginTop = (offTop + 2) + "px";
		opt.utag_mod.style.marginLeft = (offSide + 8) + "px";
	}
	
	function delRow(id){
		if(id <= 0 || id > opt.utags_table.children.length){
			return;
		}
		upd_block = true;
		
		var del = opt.utags_table.children[id];
		opt.utags_table.removeChild(del);
		row--;		
		table.splice(row, 1);
		chrome.storage.local.set({ utags: table });
		upd_block = false;
	}
	
	function addRow(id, title, path, img, save){
	
		var len = opt.utags_table.children.length;		
		if(id < 0 || id > len){
			return;
		}
		
		var r = {};
		var tr = document.createElement("tr");
		var inp_ico = document.createElement("img");
 
		inp_ico.src = img ? "data:image/png;base64," + img : chrome.extension.getURL('res/none.png');
		//inp_ico.src = img ? img : chrome.extension.getURL('res/none.png');
 
		
		var td = [];
		for(var i = 0; i < 3; i++){
			td.push(document.createElement("td"));
			tr.appendChild(td[i]);
		}
		
		title = title ? title : "title";
		path = path ? path : "path";
		
		if(save){
			r.img = img ? img : null;
			r.title = title;
			r.path = path;
			console.log("test add row", title, path);
			table.push(r);
		}
		
		td[0].innerHTML = title;
		td[1].innerHTML = path;
		td[0].contentEditable = true;
		td[1].contentEditable = true;		
		td[2].appendChild(inp_ico);
		td[2].className = "tdIco";
		td[2].onclick = function(){
			upd_block = true;
			opt.inp_uico.click();
		}
		
		tr.name = id;
		tr.addEventListener("mouseover", trCbHover);
		
		if(id == len - 1 || id == 0){
			opt.utags_table.appendChild(tr);
		} else {
			var tr2 = opt.utags_table.children[id];
			opt.utags_table.insertBefore(tr, tr2);
		}
	}
	
	opt.utag_add.onclick = function(){
		addRow(row, null, null, null, true);
	}
	
	opt.utag_del.onclick = function(){
		delRow(row);
	}
	
	opt.inp_uico.addEventListener("change", function(e){
		var f = e.target.files[0];		
		if(f.type.search('image') == -1){
			return;
		}
 
		if(f){
			var fr = new FileReader;
			fr.onloadend = changeImg;
			fr.readAsDataURL(f); 
		}
		
		this.value = "";
	});
 
	function changeImg(f){
		console.log(f.target.result);	
		var icocell = opt.utags_table.children[row].children[2];
		
		var img = icocell.children[0];
		upd_block = false;
		img.src = f.target.result;	
		table[row - 1].img = getBase64Image(img);
		chrome.storage.local.set({ utags: table });
	}
	
	function imgToTable(f){
		if(f.target.result == null){
			table[row - 1].img = null;
			return;
		}
		
		//var img = new Blob([f.target.result]);
		var img = f.target.result;
		table[row - 1].img = img;	
		chrome.storage.local.set({ utags: table });
	}
	
	opt.utags_table.addEventListener('DOMSubtreeModified', function(e){		
		if(upd_block){
			return;
		}
		console.log("debug table modified");		
		
		var idx = e.srcElement.parentNode.parentNode.rowIndex;
		idx = idx ? idx: row;
		if(idx == 0){
			idx++;
		}		
		
		var r = opt.utags_table.children[idx];		
		table[idx - 1].title = r.children[0].innerHTML;
		table[idx - 1].path  = r.children[1].innerHTML;
				
		chrome.storage.local.set({ utags: table });		
	});
	
	function setRows(r, l){
		if(r == l){
			upd_block = false;
			return;
		}		
		
		upd_block = true;
		var title, path, src;
		title = table[r].title;
		path  = table[r].path;
		
		if(table[r].img){
			var f = new Blob([table[r].img], {type: 'image/png'});
			var fr = new FileReader();
			fr.onloadend = function(img){				
				//var src = img.target.result;
				var src = img.target.result; 
				addRow(++r, title, path, src, false);				
				setRows(r, l);
			}
			//fr.readAsDataURL(f);
			fr.readAsBinaryString(f);
		} else {
			r++;	//first row is a header
			addRow(r, title, path, null, false);
			setRows(r, l);
		}
	}
	
	/*function utSetDefault(){
	
		table = [ {title: 'funny', path: 'funny/'},
			{title: 'music', path: 'music/'},
			{title: 'xxx', path: 'xxx/'},
			{title: 'games', path: 'games/'},
			{title: 'trash', path: 'trash/'}
		];
		
		loadImages(pics.length - 1, null);	 
	}
	
	function loadImages(i, img){
		if(i < 0){
			setRows(0, pics.length);
			chrome.storage.local.set({ utags: table });
			return;
		}
		
		if(!img){
			img = document.createElement('img');		
			img.src = chrome.extension.getURL(pics[i]);
		}
		
		if(img.width == 0){
			setTimeout(function(){
				loadImages(i, img);
			}, 100);
			return;
		}
		
		table[i].img = getBase64Image(img);		
		return loadImages(--i, null);
	}*/
	
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
 
}, true);
 
