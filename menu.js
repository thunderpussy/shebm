window.onload = function()
{	
	var btn_hidew = document.getElementById("btn_hidew");
	btn_hidew.onclick = function(){
		chrome.tabs.query({"active": true, "currentWindow": true}, function(tabs){		 
			chrome.tabs.sendMessage( tabs[0].id, { id: "threadUpdate"} ); 		
		});
	};
	
	var btn_hideall = document.getElementById("btn_hideall");
	btn_hideall.onclick = function(){
		chrome.tabs.query({"active": true, "currentWindow": true}, function(tabs){		 
			chrome.tabs.sendMessage( tabs[0].id, { id: "hideAll"} ); 		
		});
	};
	
	var btn_options = document.getElementById("btn_options");
	btn_options.onclick = function(){
		chrome.tabs.query({"active": true, "currentWindow": true}, function(tabs){		 
			chrome.extension.sendMessage( { id: "open_options"} );
		});
	};
	
	/*
	var btn_unhideall = document.getElementById("btn_unhideall");
	btn_unhideall.onclick = function(){
		chrome.tabs.query({"active": true, "currentWindow": true}, function(tabs){		 
			chrome.tabs.sendMessage( tabs[0].id, { id: "unhide_all"} ); 		
		});
	};
	*/
	
	var btn_report = document.getElementById("btn_report");
	btn_report.onclick = function(){
		chrome.tabs.query({"active": true, "currentWindow": true}, function(tabs){		 
			chrome.tabs.sendMessage( tabs[0].id, { id: "report"} ); 		
		});
	}; 
};