/*
window.addEventListener('click', function(e){
	console.log('click', e);
});
*/

window.addEventListener('message', function(e) {
	var e = e.data;
	switch(e.type){
	case 'init':
		init();
	case 'hide':
		Post(e.data).hide();
		break;
	case 'unhide':
		Post(e.data).unhide();
		break;
	case 'call':
		var f = window[e.f];
		if(!f)
			break; 
		f.apply(window, e.args);
	break;
	default: break;
	}
});

/*setTimeout(function() {
    //console.log('page javascript sending message');
    window.postMessage({ type: 'page_js_type',
                         text: "Hello from the page's javascript!"},
                       '*' /* targetOrigin: any );
}, 1000);*/

function init(){
	window.updateThread = function() { 
		$alert('Загрузка...', 'wait');

		updatePosts(function(data) {
			$close($id('ABU-alert-wait'));

			if(data.updated) $alert('Новых постов: ' + data.updated);
			else if(data.error) $alert('Ошибка: ' + data.errorText);
			else $alert('Нет новых постов');
			
			window.postMessage({id: 'thread_update'}, '*');

			if(Favorites.isFavorited(window.thread.id)) 
			Favorites.setLastPost(data.data, window.thread.id);
		});
	}
}