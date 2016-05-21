chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      let metadata = JSON.parse($('.lightbox-map')[0].dataset.mapState),
        location = metadata.markers.starred_business.location;

      if (location) {
        new Vyelp(location);
      }
    }
  }, 10);
}); 

const YOUTUBE_KEY = 'AIzaSyBuQiHS4B-axfTUpBGNeJlF2J78k962zkc';

class Vyelp {
  constructor(location) {
    this.location = location;

    this.loadDependencies();
  }

  loadDependencies() {
    $.getScript('https://apis.google.com/js/client.js', () => {
      var callback = () => {
        console.log('calback');
        gapi.client.load('youtube', 'v3', () => {
          this.fetchVideos();
        });
      };

      (function checkIfLoaded() {
        console.log('teste');
        'gapi' in window && gapi.client ? callback() : window.setTimeout(checkIfLoaded, 1000);
      })();
    });
  }

  fetchVideos() {
    console.log('fetch videos for', this.location);
  }
};

