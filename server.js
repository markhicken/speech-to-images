// setup
var request = require('request');
var cheerio = require('cheerio');
var express = require('express');

// configuration
var config = {
  port: 8080,
  dictionaryApiUrl: 'http://www.dictionaryapi.com/api/v1/references/collegiate/xml/{word}?key=7ed05f56-dcaf-40c3-bbe2-a1e7ee4b494f',
  thesaurusApiUrl: 'http://www.dictionaryapi.com/api/v1/references/thesaurus/xml/{word}?key=eb8fc4fe-b486-4925-b18e-0b389f733a25'
}

// begin app
var app = express();
app.use(express.static('.'));

app.get('/', function (req, res) {
  res.send('You found the server.');
});

app.get('/dictionary/', function(req, res, next){
  res.send('No words specified');
});
app.get('/dictionary/:words', function(req, res, next){
  var words = req.params.words;
  if(words) {
    words = words
      .replace(/%20/ig, ',')
      .replace(/\s/ig, ',');
  }

  var aWords = [words];

  // split words
  if(words && words.indexOf(',')!=-1) {
    aWords = words.split(',');
  }
  console.log('Requested words: ' + aWords);

  // limit words to 3 at a time
  // if(aWords.length > 3) {
    // aWords = aWords.slice(0, 3);
    // console.log('Words limited to the first 3');
  // }

  var loadedWords = [];
  var errors = [];

  // scope helper functions
  function getNextWord() {
    if(aWords.length) { // more words to load?
      var word = aWords.shift();

      var apiUrl = config.dictionaryApiUrl.replace(/{word}/gi, encodeURIComponent(word));
      console.log('Querying for word: ' + word);
      console.log('\t' + apiUrl);
      request(apiUrl, function(error, response, body) {
        var error = error;
        if (!error && response.statusCode == 200) {
          // try {
            loadedWords.push(parseLoadedWord(body));
          // }
          // catch(er) { errors.push({ error: 'Error parsing results' }); }
        }
        if(error) { errors.push(error); }

        getNextWord();
      });
    }
    else { // done loading words
      allWordsLoaded();
    }
  }

  function parseLoadedWord(data){
    var $xml = cheerio.load(data);
    var $entry = $xml('entry').first();

    var word = $entry.find('ew').first().text();
    var type = $entry.find('fl').first().text();

    return {
      word: word,
      type: type
    };
  }

  getNextWord();

  function allWordsLoaded() {
    if(loadedWords.length) { res.send(loadedWords); }
    else { res.status(500).send(errors); }
    next(req, res, next);
  }
});

app.listen(config.port, function () {
  console.log('Listening on port ' + config.port);
});
