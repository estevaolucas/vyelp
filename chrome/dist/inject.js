(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

chrome.extension.sendMessage({}, function (response) {
  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      var metadata = JSON.parse($('.lightbox-map')[0].dataset.mapState),
          location = metadata.markers.starred_business.location;

      if (location) {
        new Vyelp(location);
      }
    }
  }, 10);
});

var YOUTUBE_KEY = 'AIzaSyBuQiHS4B-axfTUpBGNeJlF2J78k962zkc';

var Vyelp = function () {
  function Vyelp(location) {
    _classCallCheck(this, Vyelp);

    this.location = location;

    this.loadDependencies();
  }

  _createClass(Vyelp, [{
    key: 'loadDependencies',
    value: function loadDependencies() {
      var _this = this;

      $.getScript('https://apis.google.com/js/client.js', function () {
        var callback = function callback() {
          console.log('calback');
          gapi.client.load('youtube', 'v3', function () {
            _this.fetchVideos();
          });
        };

        (function checkIfLoaded() {
          console.log('teste');
          'gapi' in window && gapi.client ? callback() : window.setTimeout(checkIfLoaded, 1000);
        })();
      });
    }
  }, {
    key: 'fetchVideos',
    value: function fetchVideos() {
      console.log('fetch videos for', this.location);
    }
  }]);

  return Vyelp;
}();

;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLHlDQUFwQjs7SUFFTSxLO0FBQ0osaUJBQVksUUFBWixFQUFzQjtBQUFBOztBQUNwQixTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7O0FBRUEsU0FBSyxnQkFBTDtBQUNEOzs7O3VDQUVrQjtBQUFBOztBQUNqQixRQUFFLFNBQUYsQ0FBWSxzQ0FBWixFQUFvRCxZQUFNO0FBQ3hELFlBQUksV0FBVyxTQUFYLFFBQVcsR0FBTTtBQUNuQixrQkFBUSxHQUFSLENBQVksU0FBWjtBQUNBLGVBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsU0FBakIsRUFBNEIsSUFBNUIsRUFBa0MsWUFBTTtBQUN0QyxrQkFBSyxXQUFMO0FBQ0QsV0FGRDtBQUdELFNBTEQ7O0FBT0EsU0FBQyxTQUFTLGFBQVQsR0FBeUI7QUFDeEIsa0JBQVEsR0FBUixDQUFZLE9BQVo7QUFDQSxvQkFBVSxNQUFWLElBQW9CLEtBQUssTUFBekIsR0FBa0MsVUFBbEMsR0FBK0MsT0FBTyxVQUFQLENBQWtCLGFBQWxCLEVBQWlDLElBQWpDLENBQS9DO0FBQ0QsU0FIRDtBQUlELE9BWkQ7QUFhRDs7O2tDQUVhO0FBQ1osY0FBUSxHQUFSLENBQVksa0JBQVosRUFBZ0MsS0FBSyxRQUFyQztBQUNEOzs7Ozs7QUFDRiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjaHJvbWUuZXh0ZW5zaW9uLnNlbmRNZXNzYWdlKHt9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICB2YXIgcmVhZHlTdGF0ZUNoZWNrSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICBjbGVhckludGVydmFsKHJlYWR5U3RhdGVDaGVja0ludGVydmFsKTtcblxuICAgICAgbGV0IG1ldGFkYXRhID0gSlNPTi5wYXJzZSgkKCcubGlnaHRib3gtbWFwJylbMF0uZGF0YXNldC5tYXBTdGF0ZSksXG4gICAgICAgIGxvY2F0aW9uID0gbWV0YWRhdGEubWFya2Vycy5zdGFycmVkX2J1c2luZXNzLmxvY2F0aW9uO1xuXG4gICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgbmV3IFZ5ZWxwKGxvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDEwKTtcbn0pOyBcblxuY29uc3QgWU9VVFVCRV9LRVkgPSAnQUl6YVN5QnVRaUhTNEItYXhmVFVwQkdOZUpsRjJKNzhrOTYyemtjJztcblxuY2xhc3MgVnllbHAge1xuICBjb25zdHJ1Y3Rvcihsb2NhdGlvbikge1xuICAgIHRoaXMubG9jYXRpb24gPSBsb2NhdGlvbjtcblxuICAgIHRoaXMubG9hZERlcGVuZGVuY2llcygpO1xuICB9XG5cbiAgbG9hZERlcGVuZGVuY2llcygpIHtcbiAgICAkLmdldFNjcmlwdCgnaHR0cHM6Ly9hcGlzLmdvb2dsZS5jb20vanMvY2xpZW50LmpzJywgKCkgPT4ge1xuICAgICAgdmFyIGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnY2FsYmFjaycpO1xuICAgICAgICBnYXBpLmNsaWVudC5sb2FkKCd5b3V0dWJlJywgJ3YzJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZmV0Y2hWaWRlb3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAoZnVuY3Rpb24gY2hlY2tJZkxvYWRlZCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3Rlc3RlJyk7XG4gICAgICAgICdnYXBpJyBpbiB3aW5kb3cgJiYgZ2FwaS5jbGllbnQgPyBjYWxsYmFjaygpIDogd2luZG93LnNldFRpbWVvdXQoY2hlY2tJZkxvYWRlZCwgMTAwMCk7XG4gICAgICB9KSgpO1xuICAgIH0pO1xuICB9XG5cbiAgZmV0Y2hWaWRlb3MoKSB7XG4gICAgY29uc29sZS5sb2coJ2ZldGNoIHZpZGVvcyBmb3InLCB0aGlzLmxvY2F0aW9uKTtcbiAgfVxufTtcblxuIl19
