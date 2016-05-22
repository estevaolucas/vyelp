(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

chrome.extension.sendMessage({}, function (response) {
  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      var metadata = JSON.parse($('.lightbox-map')[0].dataset.mapState),
          location = metadata.markers.starred_business.location,
          name = $('.biz-page-title.embossed-text-white').text().trim();

      if (location) {
        new Vyelp(name, location);
      }
    }
  }, 10);
});

var YOUTUBE_KEY = 'AIzaSyCaKJByB-7jJY_2E3boyJ78p0Jv8oeuriI';
var YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
var FACEBOOK_API = 'https://graph.facebook.com';

var Vyelp = function () {
  function Vyelp(name, location) {
    _classCallCheck(this, Vyelp);

    this.name = name;
    this.location = location;

    this.fetchVideos();
  }

  _createClass(Vyelp, [{
    key: 'fetchVideos',
    value: function fetchVideos() {
      var _this = this;

      this.requests = [];

      // is use logged in facebook?
      chrome.storage.local.get('access_token', $.proxy(function (keys) {
        _this.requests.push(_this.fetchYouTubeVideos());

        if ('access_token' in keys) {
          _this.facebok_token = keys.access_token;
          _this.requests.push(_this.fetchFacebookVideos());
        }

        Promise.all(_this.requests).then(function (values) {
          var videos = values[0];

          if (values.length == 2 && $.isArray(values[0]) && $.isArray(values[1])) {
            // fist Facebook videos
            videos = $.merge(values[1], values[0]);
          }

          _this.buildStructure(videos);
        });
      }, this));
    }
  }, {
    key: 'fetchYouTubeVideos',
    value: function fetchYouTubeVideos() {
      var _this2 = this;

      return new Promise($.proxy(function (resolve, reject) {
        $.ajax({
          url: YOUTUBE_API + '/search',
          data: {
            part: 'snippet',
            type: 'video',
            location: _this2.location.latitude + ',' + _this2.location.longitude,
            locationRadius: '250m',
            order: 'viewCount',
            maxResults: '50',
            videoEmbeddable: true,
            key: YOUTUBE_KEY
          }
        }).then($.proxy(function (response) {
          var videos = response.items.map(function (video) {
            video.type = 'youtube';
            video.youtube = true;

            return video;
          });
          resolve(videos);
        }, _this2), function (response) {
          debugger;
          reject(response);
        });
      }, this));
    }
  }, {
    key: 'fetchFacebookVideos',
    value: function fetchFacebookVideos(access_token) {
      var _this3 = this;

      return new Promise($.proxy(function (resolve, reject) {
        $.ajax({
          url: FACEBOOK_API + '/search',
          data: {
            q: _this3.name,
            type: 'page',
            fields: 'location,name',
            access_token: _this3.facebok_token
          }
        }).then($.proxy(function (response) {
          if (!response.data.length) {
            debugger;
            reject();
          }

          var checkPlace = function checkPlace(place) {
            if (!('location' in place)) {
              return false;
            }

            return place.location.latitude.toFixed(3) == _this3.location.latitude.toFixed(3) && place.location.longitude.toFixed(3) == _this3.location.longitude.toFixed(3);
          },
              place = void 0;

          if (response.data.length > 1) {
            var places = response.data.filter($.proxy(checkPlace, _this3));

            if (places.length) {
              place = places[0];
            } else {
              debugger;
              reject();
              return;
            }
          } else {
            place = response.data[0];
          }

          if (place) {
            _this3.fetchFacebookVideosWithPageId(place.id, resolve, reject);
          } else {
            debugger;
            reject();
          }
        }, _this3)).fail(function (response) {
          if (response.responseJSON.error.code == 190) {
            alert('Your authentication is over. You need to make Facebook login in Vyelp extension again.');

            // remove access_token from storage
            chrome.storage.local.clear();
          }

          reject(response);
        });
      }, this));
    }
  }, {
    key: 'fetchFacebookVideosWithPageId',
    value: function fetchFacebookVideosWithPageId(id, resolve, reject) {
      var _this4 = this;

      $.ajax({
        url: FACEBOOK_API + '/' + id + '/videos',
        data: {
          access_token: this.facebok_token,
          fields: 'embed_html,description,created_time,thumbnails'
        }
      }).then($.proxy(function (response) {
        if (!response.data.length) {
          resolve(null);
        }

        _this4.facebookLoaded = true;

        var videos = response.data.map(function (video) {
          video.type = 'facebook';
          video.pageId = id;
          video.youtube = false;

          return video;
        });

        resolve(videos);
      }, this));
    }
  }, {
    key: 'buildStructure',
    value: function buildStructure(videos) {
      var _this5 = this;

      var $placeholder = $('#super-container');

      this.$container = $('<div />').addClass('showcase-photos vyelp');
      this.videos = videos;

      if (this.videos.length) {
        this.videos.forEach(function (item, i) {
          var $item = void 0,
              data = void 0;

          if (item.youtube) {
            data = {
              i: i + 1,
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.medium,
              channelTitle: item.snippet.channelTitle,
              excerpt: item.snippet.title.length > 50 ? item.snippet.title.substring(0, 50) + ' ...' : item.snippet.title,
              type: 'youtube',
              youtube: true
            };
          } else {
            data = {
              i: i + 1,
              id: item.id,
              thumbnail: item.thumbnails.data[0],
              description: item.description,
              excerpt: item.description.length > 50 ? item.description.substring(0, 50) + ' ...' : item.description,
              type: 'facebook',
              youtube: false
            };
          }

          $item = $(htmlTemplates.thubnailItem(data));

          if (i > 2) {
            $item.hide();
          }

          $item.data('meta', item).on('click', $.proxy(_this5.openVideo, _this5));

          _this5.$container.append($item);
        });

        this.$items = this.$container.find('> .js-photo');
        this.$container.prependTo($placeholder);

        // just add pagination buttons if needed
        if (this.videos.length > 3) {
          // add previous button
          this.$prevButton = $(htmlTemplates.prevButton()).on('click', $.proxy(this.onPaginationClicked, this)).prependTo(this.$container);
          // add next button
          this.$nextButton = $(htmlTemplates.nextButton()).on('click', $.proxy(this.onPaginationClicked, this)).prependTo(this.$container);

          this.preloadThumbnail(3);
        }

        console.log('facebook', this.facebookLoaded);
        // disclaimer message
        var $disclaimer = $('<div class="arrange_unit arrange_unit--fill" />').text(chrome.i18n.getMessage(!this.facebookLoaded ? 'l10nDisclaimer' : 'l10nFacebookDisclaimer'));

        $('<h2 />').text(chrome.i18n.getMessage(!this.facebookLoaded ? 'l10nHeader' : 'l10nFacebookHeader')).prependTo(this.$container.parent()).after($disclaimer);

        this.render();
      }
    }

    // carrosel's pagination handler

  }, {
    key: 'onPaginationClicked',
    value: function onPaginationClicked(e) {
      var _this6 = this;

      var $button = $(e.target),
          $visible = this.$items.filter(':visible');

      if (!$button.is('button')) {
        $button = $button.closest('button');
      }

      // prev case
      if ($button.is('.prev')) {
        (function () {
          var $prev = $visible.first().prev('.photo'),
              $elements = $prev.length ? $prev.add($visible) : $visible;

          // disable/enable pagination buttons
          $button.attr('disabled', $prev.prevAll('.photo').length == 0);
          _this6.$nextButton.attr('disabled', false);

          $elements.each(function (i, item) {
            var $item = $(item);

            if (i + 1 == $elements.length) {
              $item.hide();
            } else {
              $item.show().removeClass('photo-' + i).addClass('photo-' + (i + 1));
            }
          });
          // next case
        })();
      } else {
          var $next = $visible.last().next('.photo'),
              isToDisable = $next.nextAll('.photo').length == 0;

          // disable/enable pagination buttons
          $button.attr('disabled', isToDisable);
          this.$prevButton.attr('disabled', false);

          // preload next image to avoid a blink on next pagination
          if (!isToDisable) {
            var $nextToPreload = $next.next('.photo');

            this.preloadThumbnail(this.$items.index($nextToPreload));
          }

          $visible.add($next).each(function (i, item) {
            var $item = $(item);

            if (!i) {
              $item.hide();
            } else {
              $item.show().removeClass('photo-' + (i + 1)).addClass('photo-' + i);
            }
          });
        }
    }
  }, {
    key: 'openVideo',
    value: function openVideo(e) {
      var $item = $(e.target).closest('.photo'),
          meta = $item.data('meta'),
          $modal = $(htmlTemplates.videoModal(meta)),
          $buttons = $('button.pag', $modal);

      $modal.show().appendTo('body')
      // close modal when its overlay is clicked
      .on('click', $.proxy(this.closeVideo, this)).find('.js-modal-close', $.proxy(this.closeVideo, this));

      // hide prev/next buttons
      if (this.videos.length == 1) {
        $button.hide();
      }

      this.current = {
        video: meta,
        $element: $modal,
        index: this.videos.indexOf(meta),
        $prevButton: $buttons.filter('.prev'),
        $nextButton: $buttons.filter('.next')
      };

      this.current.$prevButton = $buttons.filter('.prev');
      this.current.$nextButton = $buttons.filter('.next');

      this.videoPaginationButtonsState();

      // event handler
      $buttons.on('click', $.proxy(this.onVideoPrevNextClicked, this));
    }
  }, {
    key: 'onVideoPrevNextClicked',
    value: function onVideoPrevNextClicked(e) {
      var $button = $(e.target);

      if (!$button.is('button')) {
        $button = $button.closest('button');
      }

      this.paginateVideo($button.is('.prev'));
    }
  }, {
    key: 'paginateVideo',
    value: function paginateVideo(toPrevious) {
      var $iframe = $('iframe', this.current.$element),
          currentIndex = this.current.index,
          data = void 0;

      // exit if is the first or the last video
      if (toPrevious && !currentIndex || !toPrevious && currentIndex + 1 == this.videos.length) {
        return;
      }

      // set a new index
      toPrevious ? --currentIndex : ++currentIndex;

      // get right video data
      data = this.videos[currentIndex];

      // change iframe
      $iframe.after(htmlTemplates.iframe(data)).remove();

      // change title
      this.current.$element.find('h2').text(data.youtube ? data.snippet.title : chrome.i18n.getMessage('l10nFacebookTitle'));

      // change description
      this.current.$element.find('p').text(!data.youtube ? data.description : '');

      // update current data
      this.current.video = data;
      this.current.index = currentIndex;

      // change pagination buttons state
      this.videoPaginationButtonsState();
    }
  }, {
    key: 'videoPaginationButtonsState',
    value: function videoPaginationButtonsState() {
      this.current.$prevButton.attr('disabled', !this.current.index);
      this.current.$nextButton.attr('disabled', this.current.index + 1 == this.videos.length);
    }
  }, {
    key: 'closeVideo',
    value: function closeVideo(e) {
      if (e) {
        var $target = $(e.target);

        if (!$target.is('.js-modal-close') && !$target.is('.modal')) {
          return;
        }
      }

      this.current.$element.remove();
      this.current = null;
    }

    // preload image to avoid a blink in pagination trasition

  }, {
    key: 'preloadThumbnail',
    value: function preloadThumbnail(index) {
      var item = this.videos[index],
          url = item.youtube ? item.snippet.thumbnails.medium.url : item.thumbnails.data[0].uri,
          image = new Image();

      image.src = url;
      image.onload = function () {
        return console.log(url + ' preloaded');
      };
    }
  }, {
    key: 'render',
    value: function render() {
      var _this7 = this;

      // animation to shows up modal comming from CSS with transition on element
      setTimeout(function () {
        _this7.$container.addClass('show');

        setTimeout(function () {
          _this7.$container.addClass('overflow');
        }, 1000);
      }, 1000);

      // close video modal when esc is pressed
      $(document).keydown($.proxy(function (e) {
        if (!_this7.current) {
          return;
        }

        switch (e.keyCode) {
          // close modal
          case 27:
            _this7.closeVideo();
            break;

          // previous video
          case 37:
            _this7.paginateVideo(true);
            break;

          // next video
          case 39:
            _this7.paginateVideo(false);
            break;
        }
      }, this));
    }
  }]);

  return Vyelp;
}();

;

var htmlTemplates = {
  thubnailItem: function thubnailItem(video) {
    if (video.youtube) {
      return '<div class="js-photo photo youtube photo-' + video.i + '">\n         <div class="showcase-photo-box">\n            <a href="#" style="background-image:url(\'' + video.thumbnail.url + '\')"><span class="play" /></a>\n         </div>\n         <div class="photo-box-overlay js-overlay">\n            <div class="media-block photo-box-overlay_caption">\n               <div class="media-story">\n                  <a class="photo-desc" href="#">' + video.excerpt + '</a>\n                  <span class="author">\n                  by <a class="user-display-name" href="#">' + video.channelTitle + '</a>\n                  </span>\n               </div>\n            </div>\n         </div>\n      </div>';
    } else {
      return '<div class="js-photo photo facebook photo-' + video.i + '">\n         <div class="showcase-photo-box">\n            <a href="#" style="background-image:url(\'' + video.thumbnail.uri + '\')"><span class="play" /><span class="badge" />\n                  </a>\n         </div>\n         <div class="photo-box-overlay js-overlay">\n            <div class="media-block photo-box-overlay_caption">\n               <div class="media-story">\n                  <a class="photo-desc" href="#">' + video.excerpt + '</a>\n                  <span class="author">\n                  by <a class="user-display-name" href="#">Facebook page</a>\n                  </span>\n               </div>\n            </div>\n         </div>\n      </div>';
    }
  },

  prevButton: function prevButton() {
    return '<button class="prev pag ybtn ybtn--big" disabled>\n      <span class="icon icon--48-chevron-left icon--size-48">\n        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_left"></use></svg>\n      </span>\n    </button>';
  },

  nextButton: function nextButton() {
    return '<button class="next pag ybtn ybtn--big">\n      <span class="icon icon--48-chevron-right icon--size-48">\n        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_right"></use></svg>\n      </span>\n    </button>';
  },

  iframe: function iframe(data) {
    var url = data.youtube ? '//www.youtube.com/embed/' + data.id.videoId : 'https://www.facebook.com/v2.3/plugins/video.php?allowfullscreen=true&autoplay=true&container_width=800&href=https://www.facebook.com/' + data.pageId + '/videos/' + data.id + '/&locale=en_US&sdk=joey';

    return '<iframe height="360" width="650" src="' + url + '?rel=0&amp;autoplay=1" frameborder="0" allowfullscreen data-autoplay="true"></iframe>';
  },

  videoModal: function videoModal(data) {
    return '<div class="modal modal--large vyelp-modal" data-component-bound="true">\n      <div class="modal_inner">\n        <div class="modal_close js-modal-close">×</div>\n        <div class="modal_dialog" role="dialog"><div class="">\n          <div class="modal_head">\n            <h2>' + (data.youtube ? data.snippet.title : chrome.i18n.getMessage("l10nFacebookTitle")) + '</h2>\n            <p>' + (!data.youtube ? data.description : '') + '</p>\n          </div>\n          <div class="modal_body">\n            ' + htmlTemplates.prevButton() + '\n            ' + htmlTemplates.iframe(data) + '\n            ' + htmlTemplates.nextButton() + '\n            <div class="modal_section u-bg-color">\n              ' + chrome.i18n.getMessage("l10nFooterMessage") + '\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>';
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DO1VBRUUsT0FBTyxFQUFFLHFDQUFGLEVBQXlDLElBQXpDLEdBQWdELElBQWhELEVBRlQ7O0FBSUEsVUFBSSxRQUFKLEVBQWM7QUFDWixZQUFJLEtBQUosQ0FBVSxJQUFWLEVBQWdCLFFBQWhCO0FBQ0Q7QUFDRjtBQUNGLEdBWjZCLEVBWTNCLEVBWjJCLENBQTlCO0FBYUQsQ0FkRDs7QUFnQkEsSUFBTSxjQUFjLHlDQUFwQjtBQUNBLElBQU0sY0FBYyx1Q0FBcEI7QUFDQSxJQUFNLGVBQWUsNEJBQXJCOztJQUVNLEs7QUFDSixpQkFBWSxJQUFaLEVBQWtCLFFBQWxCLEVBQTRCO0FBQUE7O0FBQzFCLFNBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7O0FBRUEsU0FBSyxXQUFMO0FBQ0Q7Ozs7a0NBRWE7QUFBQTs7QUFDWixXQUFLLFFBQUwsR0FBZ0IsRUFBaEI7OztBQUdBLGFBQU8sT0FBUCxDQUFlLEtBQWYsQ0FBcUIsR0FBckIsQ0FBeUIsY0FBekIsRUFBeUMsRUFBRSxLQUFGLENBQVEsVUFBQyxJQUFELEVBQVU7QUFDekQsY0FBSyxR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QWEsS0FBNUIsR0FBb0MsT0FBTyxJQUFQLENBQVksVUFBWixDQUF1QixtQkFBdkIsQ0FMbEQsZ0NBTWEsQ0FBQyxLQUFLLE9BQU4sR0FBZ0IsS0FBSyxXQUFyQixHQUFtQyxFQU5oRCxpRkFTVSxjQUFjLFVBQWQsRUFUVixzQkFVVSxjQUFjLE1BQWQsQ0FBcUIsSUFBckIsQ0FWVixzQkFXVSxjQUFjLFVBQWQsRUFYViw0RUFhWSxPQUFPLElBQVAsQ0FBWSxVQUFaLENBQXVCLG1CQUF2QixDQWJaO0FBbUJEO0FBbEZtQixDQUF0QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjaHJvbWUuZXh0ZW5zaW9uLnNlbmRNZXNzYWdlKHt9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICB2YXIgcmVhZHlTdGF0ZUNoZWNrSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICBjbGVhckludGVydmFsKHJlYWR5U3RhdGVDaGVja0ludGVydmFsKTtcblxuICAgICAgbGV0IG1ldGFkYXRhID0gSlNPTi5wYXJzZSgkKCcubGlnaHRib3gtbWFwJylbMF0uZGF0YXNldC5tYXBTdGF0ZSksXG4gICAgICAgIGxvY2F0aW9uID0gbWV0YWRhdGEubWFya2Vycy5zdGFycmVkX2J1c2luZXNzLmxvY2F0aW9uLFxuICAgICAgICBuYW1lID0gJCgnLmJpei1wYWdlLXRpdGxlLmVtYm9zc2VkLXRleHQtd2hpdGUnKS50ZXh0KCkudHJpbSgpO1xuXG4gICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgbmV3IFZ5ZWxwKG5hbWUsIGxvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDEwKTtcbn0pOyBcblxuY29uc3QgWU9VVFVCRV9LRVkgPSAnQUl6YVN5Q2FLSkJ5Qi03akpZXzJFM2JveUo3OHAwSnY4b2V1cmlJJztcbmNvbnN0IFlPVVRVQkVfQVBJID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3lvdXR1YmUvdjMnO1xuY29uc3QgRkFDRUJPT0tfQVBJID0gJ2h0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tJztcblxuY2xhc3MgVnllbHAge1xuICBjb25zdHJ1Y3RvcihuYW1lLCBsb2NhdGlvbikge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuXG4gICAgdGhpcy5mZXRjaFZpZGVvcygpO1xuICB9XG5cbiAgZmV0Y2hWaWRlb3MoKSB7XG4gICAgdGhpcy5yZXF1ZXN0cyA9IFtdO1xuXG4gICAgLy8gaXMgdXNlIGxvZ2dlZCBpbiBmYWNlYm9vaz9cbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ2FjY2Vzc190b2tlbicsICQucHJveHkoKGtleXMpID0+IHtcbiAgICAgIHRoaXMucmVxdWVzdHMucHVzaCh0aGlzLmZldGNoWW91VHViZVZpZGVvcygpKTtcbiAgICAgIFxuICAgICAgaWYgKCdhY2Nlc3NfdG9rZW4nIGluIGtleXMpIHtcbiAgICAgICAgdGhpcy5mYWNlYm9rX3Rva2VuID0ga2V5cy5hY2Nlc3NfdG9rZW47XG4gICAgICAgIHRoaXMucmVxdWVzdHMucHVzaCh0aGlzLmZldGNoRmFjZWJvb2tWaWRlb3MoKSk7XG4gICAgICB9XG5cbiAgICAgIFByb21pc2UuYWxsKHRoaXMucmVxdWVzdHMpLnRoZW4oKHZhbHVlcykgPT4ge1xuICAgICAgICBsZXQgdmlkZW9zID0gdmFsdWVzWzBdO1xuICAgICAgICBcbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPT0gMiAmJiAkLmlzQXJyYXkodmFsdWVzWzBdKSAmJiAkLmlzQXJyYXkodmFsdWVzWzFdKSkge1xuICAgICAgICAgIC8vIGZpc3QgRmFjZWJvb2sgdmlkZW9zXG4gICAgICAgICAgdmlkZW9zID0gJC5tZXJnZSh2YWx1ZXNbMV0sIHZhbHVlc1swXSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJ1aWxkU3RydWN0dXJlKHZpZGVvcyk7XG4gICAgICB9KTtcbiAgICB9LCB0aGlzKSk7XG4gIH1cblxuICBmZXRjaFlvdVR1YmVWaWRlb3MoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCQucHJveHkoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBgJHtZT1VUVUJFX0FQSX0vc2VhcmNoYCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHBhcnQ6ICdzbmlwcGV0JyxcbiAgICAgICAgICB0eXBlOiAndmlkZW8nLFxuICAgICAgICAgIGxvY2F0aW9uOiBgJHt0aGlzLmxvY2F0aW9uLmxhdGl0dWRlfSwke3RoaXMubG9jYXRpb24ubG9uZ2l0dWRlfWAsXG4gICAgICAgICAgbG9jYXRpb25SYWRpdXM6ICcyNTBtJyxcbiAgICAgICAgICBvcmRlcjogJ3ZpZXdDb3VudCcsXG4gICAgICAgICAgbWF4UmVzdWx0czogJzUwJyxcbiAgICAgICAgICB2aWRlb0VtYmVkZGFibGU6IHRydWUsXG4gICAgICAgICAga2V5OiBZT1VUVUJFX0tFWVxuICAgICAgICB9XG4gICAgICB9KS50aGVuKCQucHJveHkoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGxldCB2aWRlb3MgPSByZXNwb25zZS5pdGVtcy5tYXAoKHZpZGVvKSA9PiB7XG4gICAgICAgICAgdmlkZW8udHlwZSA9ICd5b3V0dWJlJztcbiAgICAgICAgICB2aWRlby55b3V0dWJlID0gdHJ1ZTtcblxuICAgICAgICAgIHJldHVybiB2aWRlbztcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc29sdmUodmlkZW9zKTtcbiAgICAgIH0sIHRoaXMpLCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgZGVidWdnZXI7XG4gICAgICAgIHJlamVjdChyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICB9LCB0aGlzKSk7XG4gIH1cblxuICBmZXRjaEZhY2Vib29rVmlkZW9zKGFjY2Vzc190b2tlbikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgkLnByb3h5KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICQuYWpheCh7XG4gICAgICAgIHVybDogYCR7RkFDRUJPT0tfQVBJfS9zZWFyY2hgLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgcTogdGhpcy5uYW1lLFxuICAgICAgICAgIHR5cGU6ICdwYWdlJywgXG4gICAgICAgICAgZmllbGRzOiAnbG9jYXRpb24sbmFtZScsXG4gICAgICAgICAgYWNjZXNzX3Rva2VuOiB0aGlzLmZhY2Vib2tfdG9rZW5cbiAgICAgICAgfVxuICAgICAgfSkudGhlbigkLnByb3h5KChyZXNwb25zZSkgPT4ge1xuICAgICAgICBpZiAoIXJlc3BvbnNlLmRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY2hlY2tQbGFjZSA9IChwbGFjZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCEoJ2xvY2F0aW9uJyBpbiBwbGFjZSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcGxhY2UubG9jYXRpb24ubGF0aXR1ZGUudG9GaXhlZCgzKSA9PSB0aGlzLmxvY2F0aW9uLmxhdGl0dWRlLnRvRml4ZWQoMylcbiAgICAgICAgICAgICAgICYmIHBsYWNlLmxvY2F0aW9uLmxvbmdpdHVkZS50b0ZpeGVkKDMpID09IHRoaXMubG9jYXRpb24ubG9uZ2l0dWRlLnRvRml4ZWQoMyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwbGFjZTtcblxuICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgbGV0IHBsYWNlcyA9IHJlc3BvbnNlLmRhdGEuZmlsdGVyKCQucHJveHkoY2hlY2tQbGFjZSwgdGhpcykpO1xuXG4gICAgICAgICAgaWYgKHBsYWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHBsYWNlID0gcGxhY2VzWzBdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgICAgIHJlamVjdCgpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBsYWNlID0gcmVzcG9uc2UuZGF0YVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwbGFjZSkge1xuICAgICAgICAgIHRoaXMuZmV0Y2hGYWNlYm9va1ZpZGVvc1dpdGhQYWdlSWQocGxhY2UuaWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpKS5mYWlsKChyZXNwb25zZSkgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2UucmVzcG9uc2VKU09OLmVycm9yLmNvZGUgPT0gMTkwKSB7XG4gICAgICAgICAgYWxlcnQoJ1lvdXIgYXV0aGVudGljYXRpb24gaXMgb3Zlci4gWW91IG5lZWQgdG8gbWFrZSBGYWNlYm9vayBsb2dpbiBpbiBWeWVscCBleHRlbnNpb24gYWdhaW4uJyk7XG5cbiAgICAgICAgICAvLyByZW1vdmUgYWNjZXNzX3Rva2VuIGZyb20gc3RvcmFnZVxuICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWplY3QocmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgfSwgdGhpcykpOyBcbiAgfVxuXG4gIGZldGNoRmFjZWJvb2tWaWRlb3NXaXRoUGFnZUlkKGlkLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBgJHtGQUNFQk9PS19BUEl9LyR7aWR9L3ZpZGVvc2AsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogdGhpcy5mYWNlYm9rX3Rva2VuLFxuICAgICAgICBmaWVsZHM6ICdlbWJlZF9odG1sLGRlc2NyaXB0aW9uLGNyZWF0ZWRfdGltZSx0aHVtYm5haWxzJ1xuICAgICAgfVxuICAgIH0pLnRoZW4oJC5wcm94eSgocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmICghcmVzcG9uc2UuZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5mYWNlYm9va0xvYWRlZCA9IHRydWU7XG5cbiAgICAgIGxldCB2aWRlb3MgPSByZXNwb25zZS5kYXRhLm1hcCgodmlkZW8pID0+IHtcbiAgICAgICAgdmlkZW8udHlwZSA9ICdmYWNlYm9vayc7XG4gICAgICAgIHZpZGVvLnBhZ2VJZCA9IGlkO1xuICAgICAgICB2aWRlby55b3V0dWJlID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHZpZGVvO1xuICAgICAgfSk7XG5cbiAgICAgIHJlc29sdmUodmlkZW9zKTtcbiAgICB9LCB0aGlzKSk7IFxuICB9XG5cbiAgYnVpbGRTdHJ1Y3R1cmUodmlkZW9zKSB7XG4gICAgY29uc3QgJHBsYWNlaG9sZGVyID0gJCgnI3N1cGVyLWNvbnRhaW5lcicpO1xuXG4gICAgdGhpcy4kY29udGFpbmVyID0gJCgnPGRpdiAvPicpLmFkZENsYXNzKCdzaG93Y2FzZS1waG90b3MgdnllbHAnKTtcbiAgICB0aGlzLnZpZGVvcyA9IHZpZGVvcztcbiAgICBcbiAgICBpZiAodGhpcy52aWRlb3MubGVuZ3RoKSB7XG4gICAgICB0aGlzLnZpZGVvcy5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSwgZGF0YTtcblxuICAgICAgICBpZiAoaXRlbS55b3V0dWJlKSB7XG4gICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgIGk6IGkgKyAxLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWQudmlkZW9JZCxcbiAgICAgICAgICAgIHRpdGxlOiBpdGVtLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICB0aHVtYm5haWw6IGl0ZW0uc25pcHBldC50aHVtYm5haWxzLm1lZGl1bSxcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogaXRlbS5zbmlwcGV0LmNoYW5uZWxUaXRsZSxcbiAgICAgICAgICAgIGV4Y2VycHQ6IGl0ZW0uc25pcHBldC50aXRsZS5sZW5ndGggPiA1MCA/IGAke2l0ZW0uc25pcHBldC50aXRsZS5zdWJzdHJpbmcoMCwgNTApfSAuLi5gOiBpdGVtLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICB0eXBlOiAneW91dHViZScsXG4gICAgICAgICAgICB5b3V0dWJlOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICBpOiBpICsgMSxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgICAgdGh1bWJuYWlsOiBpdGVtLnRodW1ibmFpbHMuZGF0YVswXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgZXhjZXJwdDogaXRlbS5kZXNjcmlwdGlvbi5sZW5ndGggPiA1MCA/IGAke2l0ZW0uZGVzY3JpcHRpb24uc3Vic3RyaW5nKDAsIDUwKX0gLi4uYDogaXRlbS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgIHR5cGU6ICdmYWNlYm9vaycsXG4gICAgICAgICAgICB5b3V0dWJlOiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICRpdGVtID0gJChodG1sVGVtcGxhdGVzLnRodWJuYWlsSXRlbShkYXRhKSk7XG5cbiAgICAgICAgaWYgKGkgPiAyKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuZGF0YSgnbWV0YScsIGl0ZW0pXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vcGVuVmlkZW8sIHRoaXMpKVxuXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hcHBlbmQoJGl0ZW0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuJGl0ZW1zID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJz4gLmpzLXBob3RvJyk7XG4gICAgICB0aGlzLiRjb250YWluZXIucHJlcGVuZFRvKCRwbGFjZWhvbGRlcik7XG5cbiAgICAgIC8vIGp1c3QgYWRkIHBhZ2luYXRpb24gYnV0dG9ucyBpZiBuZWVkZWRcbiAgICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGggPiAzKSB7XG4gICAgICAgIC8vIGFkZCBwcmV2aW91cyBidXR0b24gXG4gICAgICAgIHRoaXMuJHByZXZCdXR0b24gPSAkKGh0bWxUZW1wbGF0ZXMucHJldkJ1dHRvbigpKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdpbmF0aW9uQ2xpY2tlZCwgdGhpcykpXG4gICAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIpO1xuICAgICAgICAvLyBhZGQgbmV4dCBidXR0b25cbiAgICAgICAgdGhpcy4kbmV4dEJ1dHRvbiA9ICQoaHRtbFRlbXBsYXRlcy5uZXh0QnV0dG9uKCkpXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2luYXRpb25DbGlja2VkLCB0aGlzKSlcbiAgICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lcik7ICAgICAgIFxuXG4gICAgICAgIHRoaXMucHJlbG9hZFRodW1ibmFpbCgzKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ2ZhY2Vib29rJywgdGhpcy5mYWNlYm9va0xvYWRlZCk7XG4gICAgICAvLyBkaXNjbGFpbWVyIG1lc3NhZ2VcbiAgICAgIGNvbnN0ICRkaXNjbGFpbWVyID0gJCgnPGRpdiBjbGFzcz1cImFycmFuZ2VfdW5pdCBhcnJhbmdlX3VuaXQtLWZpbGxcIiAvPicpXG4gICAgICAgIC50ZXh0KGNocm9tZS5pMThuLmdldE1lc3NhZ2UoIXRoaXMuZmFjZWJvb2tMb2FkZWQgPyAnbDEwbkRpc2NsYWltZXInIDogJ2wxMG5GYWNlYm9va0Rpc2NsYWltZXInKSlcblxuICAgICAgJCgnPGgyIC8+JylcbiAgICAgICAgLnRleHQoY2hyb21lLmkxOG4uZ2V0TWVzc2FnZSghdGhpcy5mYWNlYm9va0xvYWRlZCA/ICdsMTBuSGVhZGVyJyA6ICdsMTBuRmFjZWJvb2tIZWFkZXInKSlcbiAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIucGFyZW50KCkpXG4gICAgICAgIC5hZnRlcigkZGlzY2xhaW1lcik7XG5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gY2Fycm9zZWwncyBwYWdpbmF0aW9uIGhhbmRsZXJcbiAgb25QYWdpbmF0aW9uQ2xpY2tlZChlKSB7XG4gICAgbGV0ICRidXR0b24gPSAkKGUudGFyZ2V0KSxcbiAgICAgICR2aXNpYmxlID0gdGhpcy4kaXRlbXMuZmlsdGVyKCc6dmlzaWJsZScpXG5cbiAgICBpZiAoISRidXR0b24uaXMoJ2J1dHRvbicpKSB7XG4gICAgICAkYnV0dG9uID0gJGJ1dHRvbi5jbG9zZXN0KCdidXR0b24nKTtcbiAgICB9XG5cbiAgICAvLyBwcmV2IGNhc2VcbiAgICBpZiAoJGJ1dHRvbi5pcygnLnByZXYnKSkge1xuICAgICAgbGV0ICRwcmV2ID0gJHZpc2libGUuZmlyc3QoKS5wcmV2KCcucGhvdG8nKSxcbiAgICAgICAgJGVsZW1lbnRzID0gJHByZXYubGVuZ3RoID8gJHByZXYuYWRkKCR2aXNpYmxlKSA6ICR2aXNpYmxlO1xuXG4gICAgICAvLyBkaXNhYmxlL2VuYWJsZSBwYWdpbmF0aW9uIGJ1dHRvbnNcbiAgICAgICRidXR0b24uYXR0cignZGlzYWJsZWQnLCAkcHJldi5wcmV2QWxsKCcucGhvdG8nKS5sZW5ndGggPT0gMCk7XG4gICAgICB0aGlzLiRuZXh0QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXG4gICAgICAkZWxlbWVudHMuZWFjaCgoaSwgaXRlbSkgPT4ge1xuICAgICAgICBsZXQgJGl0ZW0gPSAkKGl0ZW0pO1xuXG4gICAgICAgIGlmIChpICsgMSA9PSAkZWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRpdGVtXG4gICAgICAgICAgICAuc2hvdygpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3Bob3RvLScgKyBpKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdwaG90by0nICsgKGkgKyAxKSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgLy8gbmV4dCBjYXNlXG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCAkbmV4dCA9ICR2aXNpYmxlLmxhc3QoKS5uZXh0KCcucGhvdG8nKSxcbiAgICAgICAgaXNUb0Rpc2FibGUgPSAkbmV4dC5uZXh0QWxsKCcucGhvdG8nKS5sZW5ndGggPT0gMDtcblxuICAgICAgLy8gZGlzYWJsZS9lbmFibGUgcGFnaW5hdGlvbiBidXR0b25zXG4gICAgICAkYnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgaXNUb0Rpc2FibGUpO1xuICAgICAgdGhpcy4kcHJldkJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcblxuICAgICAgLy8gcHJlbG9hZCBuZXh0IGltYWdlIHRvIGF2b2lkIGEgYmxpbmsgb24gbmV4dCBwYWdpbmF0aW9uXG4gICAgICBpZiAoIWlzVG9EaXNhYmxlKSB7XG4gICAgICAgIGxldCAkbmV4dFRvUHJlbG9hZCA9ICRuZXh0Lm5leHQoJy5waG90bycpO1xuXG4gICAgICAgIHRoaXMucHJlbG9hZFRodW1ibmFpbCh0aGlzLiRpdGVtcy5pbmRleCgkbmV4dFRvUHJlbG9hZCkpO1xuICAgICAgfVxuXG4gICAgICAkdmlzaWJsZS5hZGQoJG5leHQpLmVhY2goKGksIGl0ZW0pID0+IHtcbiAgICAgICAgbGV0ICRpdGVtID0gJChpdGVtKTtcblxuICAgICAgICBpZiAoIWkpIHtcbiAgICAgICAgICAkaXRlbS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGl0ZW1cbiAgICAgICAgICAgIC5zaG93KClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncGhvdG8tJyArIChpICsgMSkpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bob3RvLScgKyBpKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBvcGVuVmlkZW8oZSkge1xuICAgIGxldCAkaXRlbSA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5waG90bycpLFxuICAgICAgbWV0YSA9ICRpdGVtLmRhdGEoJ21ldGEnKSxcbiAgICAgICRtb2RhbCA9ICQoaHRtbFRlbXBsYXRlcy52aWRlb01vZGFsKG1ldGEpKSxcbiAgICAgICRidXR0b25zID0gJCgnYnV0dG9uLnBhZycsICRtb2RhbCk7XG5cbiAgICAkbW9kYWxcbiAgICAgIC5zaG93KClcbiAgICAgIC5hcHBlbmRUbygnYm9keScpXG4gICAgICAvLyBjbG9zZSBtb2RhbCB3aGVuIGl0cyBvdmVybGF5IGlzIGNsaWNrZWRcbiAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuY2xvc2VWaWRlbywgdGhpcykpXG4gICAgICAuZmluZCgnLmpzLW1vZGFsLWNsb3NlJywgJC5wcm94eSh0aGlzLmNsb3NlVmlkZW8sIHRoaXMpKTtcblxuICAgIC8vIGhpZGUgcHJldi9uZXh0IGJ1dHRvbnNcbiAgICBpZiAodGhpcy52aWRlb3MubGVuZ3RoID09IDEpIHtcbiAgICAgICRidXR0b24uaGlkZSgpO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHtcbiAgICAgIHZpZGVvICAgICAgIDogbWV0YSxcbiAgICAgICRlbGVtZW50ICAgIDogJG1vZGFsLFxuICAgICAgaW5kZXggICAgICAgOiB0aGlzLnZpZGVvcy5pbmRleE9mKG1ldGEpLFxuICAgICAgJHByZXZCdXR0b24gOiAkYnV0dG9ucy5maWx0ZXIoJy5wcmV2JyksXG4gICAgICAkbmV4dEJ1dHRvbiA6ICRidXR0b25zLmZpbHRlcignLm5leHQnKVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudC4kcHJldkJ1dHRvbiA9ICRidXR0b25zLmZpbHRlcignLnByZXYnKTtcbiAgICB0aGlzLmN1cnJlbnQuJG5leHRCdXR0b24gPSAkYnV0dG9ucy5maWx0ZXIoJy5uZXh0Jyk7XG5cbiAgICB0aGlzLnZpZGVvUGFnaW5hdGlvbkJ1dHRvbnNTdGF0ZSgpO1xuXG4gICAgLy8gZXZlbnQgaGFuZGxlclxuICAgICRidXR0b25zLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblZpZGVvUHJldk5leHRDbGlja2VkLCB0aGlzKSk7XG4gIH1cblxuICBvblZpZGVvUHJldk5leHRDbGlja2VkKGUpIHtcbiAgICBsZXQgJGJ1dHRvbiA9ICQoZS50YXJnZXQpXG5cbiAgICBpZiAoISRidXR0b24uaXMoJ2J1dHRvbicpKSB7XG4gICAgICAkYnV0dG9uID0gJGJ1dHRvbi5jbG9zZXN0KCdidXR0b24nKTtcbiAgICB9XG5cbiAgICB0aGlzLnBhZ2luYXRlVmlkZW8oJGJ1dHRvbi5pcygnLnByZXYnKSk7XG4gIH1cblxuICBwYWdpbmF0ZVZpZGVvKHRvUHJldmlvdXMpIHtcbiAgICBsZXQgJGlmcmFtZSA9ICQoJ2lmcmFtZScsIHRoaXMuY3VycmVudC4kZWxlbWVudCksXG4gICAgICBjdXJyZW50SW5kZXggPSB0aGlzLmN1cnJlbnQuaW5kZXgsXG4gICAgICBkYXRhO1xuXG4gICAgLy8gZXhpdCBpZiBpcyB0aGUgZmlyc3Qgb3IgdGhlIGxhc3QgdmlkZW9cbiAgICBpZiAoKHRvUHJldmlvdXMgJiYgIWN1cnJlbnRJbmRleCkgfHwgKCF0b1ByZXZpb3VzICYmIGN1cnJlbnRJbmRleCArIDEgPT0gdGhpcy52aWRlb3MubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHNldCBhIG5ldyBpbmRleFxuICAgIHRvUHJldmlvdXMgPyAtLWN1cnJlbnRJbmRleCA6ICsrY3VycmVudEluZGV4O1xuXG4gICAgLy8gZ2V0IHJpZ2h0IHZpZGVvIGRhdGFcbiAgICBkYXRhID0gdGhpcy52aWRlb3NbY3VycmVudEluZGV4XTtcblxuICAgIC8vIGNoYW5nZSBpZnJhbWVcbiAgICAkaWZyYW1lLmFmdGVyKGh0bWxUZW1wbGF0ZXMuaWZyYW1lKGRhdGEpKS5yZW1vdmUoKTtcblxuICAgIC8vIGNoYW5nZSB0aXRsZVxuICAgIHRoaXMuY3VycmVudC4kZWxlbWVudC5maW5kKCdoMicpLnRleHQoZGF0YS55b3V0dWJlID8gXG4gICAgICBkYXRhLnNuaXBwZXQudGl0bGUgOiBcbiAgICAgIGNocm9tZS5pMThuLmdldE1lc3NhZ2UoJ2wxMG5GYWNlYm9va1RpdGxlJykpO1xuXG4gICAgLy8gY2hhbmdlIGRlc2NyaXB0aW9uXG4gICAgdGhpcy5jdXJyZW50LiRlbGVtZW50LmZpbmQoJ3AnKS50ZXh0KCFkYXRhLnlvdXR1YmUgPyBkYXRhLmRlc2NyaXB0aW9uIDogJycpO1xuXG4gICAgLy8gdXBkYXRlIGN1cnJlbnQgZGF0YVxuICAgIHRoaXMuY3VycmVudC52aWRlbyA9IGRhdGE7XG4gICAgdGhpcy5jdXJyZW50LmluZGV4ID0gY3VycmVudEluZGV4O1xuXG4gICAgLy8gY2hhbmdlIHBhZ2luYXRpb24gYnV0dG9ucyBzdGF0ZVxuICAgIHRoaXMudmlkZW9QYWdpbmF0aW9uQnV0dG9uc1N0YXRlKCk7XG4gIH1cblxuICB2aWRlb1BhZ2luYXRpb25CdXR0b25zU3RhdGUoKSB7XG4gICAgdGhpcy5jdXJyZW50LiRwcmV2QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgIXRoaXMuY3VycmVudC5pbmRleCk7XG4gICAgdGhpcy5jdXJyZW50LiRuZXh0QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgdGhpcy5jdXJyZW50LmluZGV4ICsgMSA9PSB0aGlzLnZpZGVvcy5sZW5ndGgpO1xuICB9XG5cbiAgY2xvc2VWaWRlbyhlKSB7XG4gICAgaWYgKGUpIHtcbiAgICAgIGxldCAkdGFyZ2V0ID0gJChlLnRhcmdldCk7XG4gICAgICAgIFxuICAgICAgaWYgKCEkdGFyZ2V0LmlzKCcuanMtbW9kYWwtY2xvc2UnKSAmJiAhJHRhcmdldC5pcygnLm1vZGFsJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gICAgXG5cbiAgICB0aGlzLmN1cnJlbnQuJGVsZW1lbnQucmVtb3ZlKCk7XG4gICAgdGhpcy5jdXJyZW50ID0gbnVsbDsgIFxuICB9XG5cbiAgLy8gcHJlbG9hZCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIGluIHBhZ2luYXRpb24gdHJhc2l0aW9uXG4gIHByZWxvYWRUaHVtYm5haWwoaW5kZXgpIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudmlkZW9zW2luZGV4XSwgXG4gICAgICB1cmwgPSBpdGVtLnlvdXR1YmUgPyBcbiAgICAgICAgaXRlbS5zbmlwcGV0LnRodW1ibmFpbHMubWVkaXVtLnVybCA6IFxuICAgICAgICBpdGVtLnRodW1ibmFpbHMuZGF0YVswXS51cmksXG4gICAgICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gICAgaW1hZ2Uuc3JjID0gdXJsO1xuICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IGNvbnNvbGUubG9nKGAke3VybH0gcHJlbG9hZGVkYCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gYW5pbWF0aW9uIHRvIHNob3dzIHVwIG1vZGFsIGNvbW1pbmcgZnJvbSBDU1Mgd2l0aCB0cmFuc2l0aW9uIG9uIGVsZW1lbnRcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcygnc2hvdycpXG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3MoJ292ZXJmbG93Jyk7ICBcbiAgICAgIH0sIDEwMDApO1xuICAgIH0sIDEwMDApO1xuXG4gICAgLy8gY2xvc2UgdmlkZW8gbW9kYWwgd2hlbiBlc2MgaXMgcHJlc3NlZFxuICAgICQoZG9jdW1lbnQpLmtleWRvd24oJC5wcm94eSgoZSkgPT4geyBcbiAgICAgIGlmICghdGhpcy5jdXJyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgLy8gY2xvc2UgbW9kYWxcbiAgICAgICAgY2FzZSAyNzpcbiAgICAgICAgICB0aGlzLmNsb3NlVmlkZW8oKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgLy8gcHJldmlvdXMgdmlkZW9cbiAgICAgICAgY2FzZSAzNzpcbiAgICAgICAgICB0aGlzLnBhZ2luYXRlVmlkZW8odHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgIC8vIG5leHQgdmlkZW9cbiAgICAgICAgY2FzZSAzOTpcbiAgICAgICAgICB0aGlzLnBhZ2luYXRlVmlkZW8oZmFsc2UpO1xuICAgICAgICBicmVhazsgXG4gICAgICB9XG4gICAgfSwgdGhpcykpXG4gIH1cbn07XG5cbmNvbnN0IGh0bWxUZW1wbGF0ZXMgPSB7XG4gIHRodWJuYWlsSXRlbTogKHZpZGVvKSA9PiB7XG4gICAgaWYgKHZpZGVvLnlvdXR1YmUpIHtcbiAgICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImpzLXBob3RvIHBob3RvIHlvdXR1YmUgcGhvdG8tJHt2aWRlby5pfVwiPlxuICAgICAgICAgPGRpdiBjbGFzcz1cInNob3djYXNlLXBob3RvLWJveFwiPlxuICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6dXJsKCcke3ZpZGVvLnRodW1ibmFpbC51cmx9JylcIj48c3BhbiBjbGFzcz1cInBsYXlcIiAvPjwvYT5cbiAgICAgICAgIDwvZGl2PlxuICAgICAgICAgPGRpdiBjbGFzcz1cInBob3RvLWJveC1vdmVybGF5IGpzLW92ZXJsYXlcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZWRpYS1ibG9jayBwaG90by1ib3gtb3ZlcmxheV9jYXB0aW9uXCI+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWVkaWEtc3RvcnlcIj5cbiAgICAgICAgICAgICAgICAgIDxhIGNsYXNzPVwicGhvdG8tZGVzY1wiIGhyZWY9XCIjXCI+JHt2aWRlby5leGNlcnB0fTwvYT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYXV0aG9yXCI+XG4gICAgICAgICAgICAgICAgICBieSA8YSBjbGFzcz1cInVzZXItZGlzcGxheS1uYW1lXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmNoYW5uZWxUaXRsZX08L2E+XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJqcy1waG90byBwaG90byBmYWNlYm9vayBwaG90by0ke3ZpZGVvLml9XCI+XG4gICAgICAgICA8ZGl2IGNsYXNzPVwic2hvd2Nhc2UtcGhvdG8tYm94XCI+XG4gICAgICAgICAgICA8YSBocmVmPVwiI1wiIHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTp1cmwoJyR7dmlkZW8udGh1bWJuYWlsLnVyaX0nKVwiPjxzcGFuIGNsYXNzPVwicGxheVwiIC8+PHNwYW4gY2xhc3M9XCJiYWRnZVwiIC8+XG4gICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICA8L2Rpdj5cbiAgICAgICAgIDxkaXYgY2xhc3M9XCJwaG90by1ib3gtb3ZlcmxheSBqcy1vdmVybGF5XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWVkaWEtYmxvY2sgcGhvdG8tYm94LW92ZXJsYXlfY2FwdGlvblwiPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLXN0b3J5XCI+XG4gICAgICAgICAgICAgICAgICA8YSBjbGFzcz1cInBob3RvLWRlc2NcIiBocmVmPVwiI1wiPiR7dmlkZW8uZXhjZXJwdH08L2E+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImF1dGhvclwiPlxuICAgICAgICAgICAgICAgICAgYnkgPGEgY2xhc3M9XCJ1c2VyLWRpc3BsYXktbmFtZVwiIGhyZWY9XCIjXCI+RmFjZWJvb2sgcGFnZTwvYT5cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PmA7XG4gICAgfVxuICB9LFxuXG4gIHByZXZCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJwcmV2IHBhZyB5YnRuIHlidG4tLWJpZ1wiIGRpc2FibGVkPlxuICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tbGVmdCBpY29uLS1zaXplLTQ4XCI+XG4gICAgICAgIDxzdmcgY2xhc3M9XCJpY29uX3N2Z1wiPjx1c2UgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeGxpbms6aHJlZj1cIiM0OHg0OF9jaGV2cm9uX2xlZnRcIj48L3VzZT48L3N2Zz5cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2J1dHRvbj5gO1xuICB9LFxuXG4gIG5leHRCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJuZXh0IHBhZyB5YnRuIHlidG4tLWJpZ1wiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tcmlnaHQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj48dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9yaWdodFwiPjwvdXNlPjwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgaWZyYW1lOiAoZGF0YSkgPT4ge1xuICAgIHZhciB1cmwgPSBkYXRhLnlvdXR1YmUgPyBcbiAgICAgIGAvL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8ke2RhdGEuaWQudmlkZW9JZH1gIDogXG4gICAgICBgaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL3YyLjMvcGx1Z2lucy92aWRlby5waHA/YWxsb3dmdWxsc2NyZWVuPXRydWUmYXV0b3BsYXk9dHJ1ZSZjb250YWluZXJfd2lkdGg9ODAwJmhyZWY9aHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLyR7ZGF0YS5wYWdlSWR9L3ZpZGVvcy8ke2RhdGEuaWR9LyZsb2NhbGU9ZW5fVVMmc2RrPWpvZXlgO1xuXG4gICAgcmV0dXJuIGA8aWZyYW1lIGhlaWdodD1cIjM2MFwiIHdpZHRoPVwiNjUwXCIgc3JjPVwiJHt1cmx9P3JlbD0wJmFtcDthdXRvcGxheT0xXCIgZnJhbWVib3JkZXI9XCIwXCIgYWxsb3dmdWxsc2NyZWVuIGRhdGEtYXV0b3BsYXk9XCJ0cnVlXCI+PC9pZnJhbWU+YDtcbiAgfSxcblxuICB2aWRlb01vZGFsOiAoZGF0YSkgPT4ge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIm1vZGFsIG1vZGFsLS1sYXJnZSB2eWVscC1tb2RhbFwiIGRhdGEtY29tcG9uZW50LWJvdW5kPVwidHJ1ZVwiPlxuICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2lubmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9jbG9zZSBqcy1tb2RhbC1jbG9zZVwiPsOXPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9kaWFsb2dcIiByb2xlPVwiZGlhbG9nXCI+PGRpdiBjbGFzcz1cIlwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9oZWFkXCI+XG4gICAgICAgICAgICA8aDI+JHtkYXRhLnlvdXR1YmUgPyBkYXRhLnNuaXBwZXQudGl0bGUgOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwibDEwbkZhY2Vib29rVGl0bGVcIil9PC9oMj5cbiAgICAgICAgICAgIDxwPiR7IWRhdGEueW91dHViZSA/IGRhdGEuZGVzY3JpcHRpb24gOiAnJ308L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2JvZHlcIj5cbiAgICAgICAgICAgICR7aHRtbFRlbXBsYXRlcy5wcmV2QnV0dG9uKCl9XG4gICAgICAgICAgICAke2h0bWxUZW1wbGF0ZXMuaWZyYW1lKGRhdGEpfVxuICAgICAgICAgICAgJHtodG1sVGVtcGxhdGVzLm5leHRCdXR0b24oKX1cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9zZWN0aW9uIHUtYmctY29sb3JcIj5cbiAgICAgICAgICAgICAgJHtjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwibDEwbkZvb3Rlck1lc3NhZ2VcIil9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG59O1xuIl19
