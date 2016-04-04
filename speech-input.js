/*global webkitSpeechRecognition */

(function() {
	'use strict';

	if (! ('webkitSpeechRecognition' in window) ) return;

	var config = {
		longestBlurb: 3, // seconds
		flickr: {
			apiUrlYql: 'https://query.yahooapis.com/v1/public/yql',
			apiUrl: 'http://www.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=7bab52281fa5a9a3d4be9857f0d0779a',
			apiSecret: '3cb1428fb5b48162',
			photoUrl: 'https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg'
		}
	}

	var pendingAjaxRequests = 0;
	$(document).ajaxStart(function() {
		pendingAjaxRequests++;
	  $('#loading').removeClass('hidden');
	});
	$(document).ajaxComplete(function() {
		pendingAjaxRequests--;
		if(pendingAjaxRequests<=0) {
			pendingAjaxRequests = 0;
			$('#loading').addClass('hidden');
		}
	});

	var speechInputWrappers = document.getElementsByClassName('si-wrapper');

	[].forEach.call(speechInputWrappers, function(speechInputWrapper) {

		// find elements
		var inputEl = speechInputWrapper.querySelector('.si-input');
		var micBtn = speechInputWrapper.querySelector('.si-btn');

		// size and position them
		var inputHeight = inputEl.offsetHeight;
		var inputRightBorder = parseInt(getComputedStyle(inputEl).borderRightWidth, 10);
		var buttonSize = 0.8 * inputHeight;
		micBtn.style.top = 0.1 * inputHeight + 'px';
		micBtn.style.height = micBtn.style.width = buttonSize + 'px';

		// setup recognition
		var recognition = new webkitSpeechRecognition();
		var finalTranscript = '';
		var recognizing = false;
		var timeout;
		var oldPlaceholder = null;
		recognition.continuous = false;
		recognition.interimResults = true;

		function resetTimer(){
			clearTimeout(timeout);
			timeout = setTimeout(function(){
				recognition.stop(); // will automatically restart if recognizing is still set to true
			}, config.longestBlurb * 1000);
		}

		recognition.onstart = function() {
			resetTimer();
		};

		recognition.onend = function() {
			clearTimeout(timeout);
			if(recognizing) {
				recognition.start();
				resetTimer();
			}
		};

		recognition.onresult = function(event) {
			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					finalTranscript += event.results[i][0].transcript;
				}
			}
			finalTranscript = finalTranscript.trim() + ' ';
			inputEl.value = finalTranscript;
		};

		micBtn.addEventListener('click', function(event) {
			event.preventDefault();
			if (recognizing) {
				recognizing = false;
				micBtn.classList.remove('listening');
				if (oldPlaceholder !== null) inputEl.placeholder = oldPlaceholder;
				clearTimeout(timeout);
				recognition.stop();
			}
			else {
				recognizing = true;
				recognition.start();
				inputEl.value = finalTranscript = '';
				micBtn.classList.add('listening');
				oldPlaceholder = inputEl.placeholder;
				inputEl.placeholder = 'Start talking...';
			}
		}, false);
	});




	function lookupWords(words) {
		if(words && words.length) {
			if(words) { words = words.replace(/%20/ig, ',').replace(/\s/ig, ','); }
		  var aWords = [words];
		  if(words && words.indexOf(',')!=-1) { aWords = words.split(','); }

			$(aWords).each(function(index, word){
				if(word && word.length) {
					$.get({
						url: '/dictionary/' + encodeURIComponent(word),
						success: function(data){
							if(data){
								data.forEach(function(word){
									if(word.type=='noun') {
										// console.log('searching for images for: ' + word.word);
										doImageSearch(word.word);
									}
									else {
										// console.log('ignoring word by type (' + word.type + '): ' + word.word);
									}
								});
							}
							else {
								console.log('no data for: ' + words);
							}
						}
					});
				}
			});
		}
	}

	function doImageSearch(word) {
		var word = word;
		// https://developer.yahoo.com/yql/console/#h=select+*+from+flickr.photos.search+where+text%3D%22dog%22+and+api_key%3D'7bab52281fa5a9a3d4be9857f0d0779a'
		$.ajax({
		    url: config.flickr.apiUrlYql,
		    dataType: "jsonp",
		    data: {
					q: 'select * from flickr.photos.search where text="' + word + '" and api_key=\'7bab52281fa5a9a3d4be9857f0d0779a\'',
					format: "json"
		    },
		    success: function(data) { imageSearchComplete(data, word); }
		});
	}

	function imageSearchComplete(data, word) {
		// console.log('image search complete for: ' + word);
		if(data && data.query && data.query.results && data.query.results.photo) {
			var photos = data.query.results.photo;
			var result = photos[Math.floor(Math.random()*photos.length)]; // random item
			var $template = $('#imageTemplate').clone().removeAttr('id').removeClass('hidden').hide();
			$template.find('.title').text(word/*.toUpperCase() + ':' + result.title*/);
			$template.find('.img').attr('src', buildFlickrImageUrl(result));
			$('body').prepend($template);
			$template.find('.img').load(function(){
				$template.show(750);
			});
		}
		else {
			// console.log('No image search results for "' + word + '"');
		}
	}

	function buildFlickrImageUrl(result){
		// https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
		return config.flickr.photoUrl
			.replace(/{farm-id}/ig, result.farm)
			.replace(/{server-id}/ig, result.server)
			.replace(/{id}/ig, result.id)
			.replace(/{secret}/ig, result.secret);
	}

	function cleanUpText(text) {
		//add more words separated by | here
		var commonWords = /\babout\b|\bgoing\b|\bknow\b|\bwill\b|\bup\b|\ball\b|\bmy\b|\bmake\b|\bor\b|\bas\b|\blike\b|\bwhat\b|\bgo\b|\bby\b|\bfrom\b|\bnot\b|\bis\b|\bisn't\b|\bhis\b|\bhers\b|\bours\b|\bat\b|\bthat\b|\bthis\b|\bsaid\b|\bsay\b|\bon\b|\bdo\b|\bwe\b|\bshe\b|\bhe\b|\bthey\b|\btheir\b|\bhave\b|\bto\b|\bin\b|\bbe\b|\bthere\b|\bbe\b|\bto\b|\bif\b|\bI\b|\byou\b|\ba\b|\bsome\b|\band\b|\bor\b|\bfor\b|\bthe\b|\bbut\b|\betc\b|\bit\b|\bthat\b/gi;
		//remove the common words
		text=text.replace(commonWords, '');
		//remove numbers
		text=text.replace(/\d/g, '');
		//remove consecutive whitespaces
		text=text.replace(/\s{2,}/g, ' ');
		return text;
	}

	var lastInputValue = '';
	function checkForInput() {
		var inputVal = $('.si-input').val();
		if(inputVal.trim() != lastInputValue.trim()) {
			var toLookup = inputVal.substring(lastInputValue.length).trim();
			lookupWords(cleanUpText(toLookup));
			lastInputValue = inputVal;
		}
	}

	setInterval(checkForInput, 1000);

})();
