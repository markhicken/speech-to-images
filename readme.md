# Speech To Images Streamer #

This is a node server/app that allows you to stream speech into images. It was an experiment to help visualize long talks. 

Words are checked against the dictionary.com API for type (noun, verb, adjective, etc). Noun images are loaded from the flickr API.

It's still pretty rough. Only tested in Chrome.

![speechToImages.gif](https://bitbucket.org/repo/L4MoA9/images/3608316079-speechToImages.gif)


# Instructions... #


```
#!bash

npm install
npm start
```

* Visit [http://localhost:8080/](http://localhost:8080/) in your browser
* Click the microphone to start capturing speech
* Play or speak to start loading images