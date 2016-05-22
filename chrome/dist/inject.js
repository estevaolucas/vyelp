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

var YOUTUBE_KEY = 'AIzaSyCaKJByB-7jJY_2E3boyJ78p0Jv8oeuriI';
var YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

var Vyelp = function () {
  function Vyelp(location) {
    _classCallCheck(this, Vyelp);

    this.location = location;
    this.fetchVideos();
  }

  _createClass(Vyelp, [{
    key: 'fetchVideos',
    value: function fetchVideos() {
      $.ajax({
        url: YOUTUBE_API + '/search?part=snippet&type=video&location=' + this.location.latitude + ',' + this.location.longitude + '&locationRadius=10km&key=' + YOUTUBE_KEY,
        success: $.proxy(this.buildStructure, this),
        error: function error(response) {
          console.log('Error fetching videos', response);
        }
      });
    }
  }, {
    key: 'buildStructure',
    value: function buildStructure(response) {
      var _this = this;

      var $placeholder = $('#super-container');

      this.$container = $('<div />').addClass('showcase-photos vyelp');
      this.videos = response.items;

      if (this.videos.length) {
        this.videos.forEach(function (item, i) {
          var $item = $(htmlTemplates.thubnailItem({
            i: i + 1,
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium,
            channelTitle: item.snippet.channelTitle,
            excerpt: item.snippet.title.length > 50 ? item.snippet.title.substring(0, 50) + ' ...' : item.snippet.title
          }));

          if (i > 2) {
            $item.hide();
          }

          $item.data('meta', item).on('click', $.proxy(_this.openVideo, _this));

          _this.$container.append($item);
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

        // disclaimer message
        var $disclaimer = $('<div class="arrange_unit arrange_unit--fill" />').text(chrome.i18n.getMessage("l10nDisclaimer"));

        $('<h2 />').text(chrome.i18n.getMessage("l10nHeader")).prependTo(this.$container.parent()).after($disclaimer);

        this.render();
      }
    }

    // carrosel's pagination handler

  }, {
    key: 'onPaginationClicked',
    value: function onPaginationClicked(e) {
      var _this2 = this;

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
          _this2.$nextButton.attr('disabled', false);

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
      this.current.$element.find('h2').text(data.snippet.title);

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
          url = item.snippet.thumbnails.medium.url,
          image = new Image();

      image.src = url;
      image.onload = function () {
        return console.log(url + ' preloaded');
      };
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      // animation to shows up modal comming from CSS with transition on element
      setTimeout(function () {
        _this3.$container.addClass('show');

        setTimeout(function () {
          _this3.$container.addClass('overflow');
        }, 1000);
      }, 1000);

      // close video modal when esc is pressed
      $(document).keydown($.proxy(function (e) {
        if (!_this3.current) {
          return;
        }

        switch (e.keyCode) {
          // close modal
          case 27:
            _this3.closeVideo();
            break;

          // previous video
          case 37:
            _this3.paginateVideo(true);
            break;

          // next video
          case 39:
            _this3.paginateVideo(false);
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
    return '<div class="js-photo photo photo-' + video.i + '">\n       <div class="showcase-photo-box">\n          <a href="#" style="background-image:url(\'' + video.thumbnail.url + '\')"><span /></a>\n       </div>\n       <div class="photo-box-overlay js-overlay">\n          <div class="media-block photo-box-overlay_caption">\n             <div class="media-story">\n                <a class="photo-desc" href="#">' + video.excerpt + '</a>\n                <span class="author">\n                by <a class="user-display-name" href="#">' + video.channelTitle + '</a>\n                </span>\n             </div>\n          </div>\n       </div>\n    </div>';
  },

  prevButton: function prevButton() {
    return '<button class="prev pag ybtn ybtn--big" disabled>\n      <span class="icon icon--48-chevron-left icon--size-48">\n        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_left"></use></svg>\n      </span>\n    </button>';
  },

  nextButton: function nextButton() {
    return '<button class="next pag ybtn ybtn--big">\n      <span class="icon icon--48-chevron-right icon--size-48">\n        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_right"></use></svg>\n      </span>\n    </button>';
  },

  iframe: function iframe(data) {
    return '<iframe height="360" src="//www.youtube.com/embed/' + data.id.videoId + '?rel=0&amp;autoplay=1" frameborder="0" allowfullscreen></iframe>';
  },

  videoModal: function videoModal(data) {
    return '<div class="modal modal--large vyelp-modal" data-component-bound="true">\n      <div class="modal_inner">\n        <div class="modal_close js-modal-close">×</div>\n        <div class="modal_dialog" role="dialog"><div class="">\n          <div class="modal_head">\n            <h2>' + data.snippet.title + '</h2>\n          </div>\n          <div class="modal_body">\n            ' + htmlTemplates.prevButton() + '\n            ' + htmlTemplates.iframe(data) + '\n            ' + htmlTemplates.nextButton() + '\n            <div class="modal_section u-bg-color">\n              ' + chrome.i18n.getMessage("l10nFooterMessage") + '\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>';
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLHlDQUFwQjtBQUNBLElBQU0sY0FBYyx1Q0FBcEI7O0lBRU0sSztBQUNKLGlCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxXQUFMO0FBQ0Q7Ozs7a0NBRWE7QUFDWixRQUFFLElBQUYsQ0FBTztBQUNMLGFBQVEsV0FBUixpREFBK0QsS0FBSyxRQUFMLENBQWMsUUFBN0UsU0FBeUYsS0FBSyxRQUFMLENBQWMsU0FBdkcsaUNBQTRJLFdBRHZJO0FBRUwsaUJBQVMsRUFBRSxLQUFGLENBQVEsS0FBSyxjQUFiLEVBQTZCLElBQTdCLENBRko7QUFHTCxlQUFPLGVBQVMsUUFBVCxFQUFtQjtBQUN4QixrQkFBUSxHQUFSLENBQVksdUJBQVosRUFBcUMsUUFBckM7QUFDRDtBQUxJLE9BQVA7QUFPRDs7O21DQUVjLFEsRUFB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QW1CO0FBQ2pCO0FBQ0Q7O0FBRUQsZ0JBQVEsRUFBRSxPQUFWOztBQUVFLGVBQUssRUFBTDtBQUNFLG1CQUFLLFVBQUw7QUFDRjs7O0FBR0EsZUFBSyxFQUFMO0FBQ0UsbUJBQUssYUFBTCxDQUFtQixJQUFuQjtBQUNGOzs7QUFHQSxlQUFLLEVBQUw7QUFDRSxtQkFBSyxhQUFMLENBQW1CLEtBQW5CO0FBQ0Y7QUFkRjtBQWdCRCxPQXJCbUIsRUFxQmpCLElBckJpQixDQUFwQjtBQXNCRDs7Ozs7O0FBQ0Y7O0FBRUQsSUFBTSxnQkFBZ0I7QUFDcEIsZ0JBQWMsc0JBQUMsS0FBRCxFQUFXO0FBQ3ZCLGlEQUEyQyxNQUFNLENBQWpELHlHQUVpRCxNQUFNLFNBQU4sQ0FBZ0IsR0FGakUsbVBBTzZDLE1BQU0sT0FQbkQsOEdBU3VELE1BQU0sWUFUN0Q7QUFlRCxHQWpCbUI7O0FBbUJwQixjQUFZLHNCQUFNO0FBQ2hCO0FBS0QsR0F6Qm1COztBQTJCcEIsY0FBWSxzQkFBTTtBQUNoQjtBQUtELEdBakNtQjs7QUFtQ3BCLFVBQVEsZ0JBQUMsSUFBRCxFQUFVO0FBQ2hCLGtFQUE0RCxLQUFLLEVBQUwsQ0FBUSxPQUFwRTtBQUNELEdBckNtQjs7QUF1Q3BCLGNBQVksb0JBQUMsSUFBRCxFQUFVO0FBQ3BCLHdTQUtjLEtBQUssT0FBTCxDQUFhLEtBTDNCLGlGQVFVLGNBQWMsVUFBZCxFQVJWLHNCQVNVLGNBQWMsTUFBZCxDQUFxQixJQUFyQixDQVRWLHNCQVVVLGNBQWMsVUFBZCxFQVZWLDRFQVlZLE9BQU8sSUFBUCxDQUFZLFVBQVosQ0FBdUIsbUJBQXZCLENBWlo7QUFrQkQ7QUExRG1CLENBQXRCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNocm9tZS5leHRlbnNpb24uc2VuZE1lc3NhZ2Uoe30sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gIHZhciByZWFkeVN0YXRlQ2hlY2tJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwocmVhZHlTdGF0ZUNoZWNrSW50ZXJ2YWwpO1xuXG4gICAgICBsZXQgbWV0YWRhdGEgPSBKU09OLnBhcnNlKCQoJy5saWdodGJveC1tYXAnKVswXS5kYXRhc2V0Lm1hcFN0YXRlKSxcbiAgICAgICAgbG9jYXRpb24gPSBtZXRhZGF0YS5tYXJrZXJzLnN0YXJyZWRfYnVzaW5lc3MubG9jYXRpb247XG5cbiAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICBuZXcgVnllbHAobG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgMTApO1xufSk7IFxuXG5jb25zdCBZT1VUVUJFX0tFWSA9ICdBSXphU3lDYUtKQnlCLTdqSllfMkUzYm95Sjc4cDBKdjhvZXVyaUknO1xuY29uc3QgWU9VVFVCRV9BUEkgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20veW91dHViZS92Myc7XG5cbmNsYXNzIFZ5ZWxwIHtcbiAgY29uc3RydWN0b3IobG9jYXRpb24pIHtcbiAgICB0aGlzLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgdGhpcy5mZXRjaFZpZGVvcygpO1xuICB9XG5cbiAgZmV0Y2hWaWRlb3MoKSB7XG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogYCR7WU9VVFVCRV9BUEl9L3NlYXJjaD9wYXJ0PXNuaXBwZXQmdHlwZT12aWRlbyZsb2NhdGlvbj0ke3RoaXMubG9jYXRpb24ubGF0aXR1ZGV9LCR7dGhpcy5sb2NhdGlvbi5sb25naXR1ZGV9JmxvY2F0aW9uUmFkaXVzPTEwa20ma2V5PSR7WU9VVFVCRV9LRVl9YCxcbiAgICAgIHN1Y2Nlc3M6ICQucHJveHkodGhpcy5idWlsZFN0cnVjdHVyZSwgdGhpcyksXG4gICAgICBlcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGZldGNoaW5nIHZpZGVvcycsIHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYnVpbGRTdHJ1Y3R1cmUocmVzcG9uc2UpIHtcbiAgICBjb25zdCAkcGxhY2Vob2xkZXIgPSAkKCcjc3VwZXItY29udGFpbmVyJyk7XG5cbiAgICB0aGlzLiRjb250YWluZXIgPSAkKCc8ZGl2IC8+JykuYWRkQ2xhc3MoJ3Nob3djYXNlLXBob3RvcyB2eWVscCcpO1xuICAgIHRoaXMudmlkZW9zID0gcmVzcG9uc2UuaXRlbXM7XG4gICAgXG4gICAgaWYgKHRoaXMudmlkZW9zLmxlbmd0aCkge1xuICAgICAgdGhpcy52aWRlb3MuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICB2YXIgJGl0ZW0gPSAkKGh0bWxUZW1wbGF0ZXMudGh1Ym5haWxJdGVtKHtcbiAgICAgICAgICAgIGk6IGkgKyAxLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWQudmlkZW9JZCxcbiAgICAgICAgICAgIHRpdGxlOiBpdGVtLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICB0aHVtYm5haWw6IGl0ZW0uc25pcHBldC50aHVtYm5haWxzLm1lZGl1bSxcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogaXRlbS5zbmlwcGV0LmNoYW5uZWxUaXRsZSxcbiAgICAgICAgICAgIGV4Y2VycHQ6IGl0ZW0uc25pcHBldC50aXRsZS5sZW5ndGggPiA1MCA/IGAke2l0ZW0uc25pcHBldC50aXRsZS5zdWJzdHJpbmcoMCwgNTApfSAuLi5gOiBpdGVtLnNuaXBwZXQudGl0bGVcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKGkgPiAyKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuZGF0YSgnbWV0YScsIGl0ZW0pXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vcGVuVmlkZW8sIHRoaXMpKVxuXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hcHBlbmQoJGl0ZW0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuJGl0ZW1zID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJz4gLmpzLXBob3RvJyk7XG4gICAgICB0aGlzLiRjb250YWluZXIucHJlcGVuZFRvKCRwbGFjZWhvbGRlcik7XG5cbiAgICAgIC8vIGp1c3QgYWRkIHBhZ2luYXRpb24gYnV0dG9ucyBpZiBuZWVkZWRcbiAgICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGggPiAzKSB7XG4gICAgICAgIC8vIGFkZCBwcmV2aW91cyBidXR0b24gXG4gICAgICAgIHRoaXMuJHByZXZCdXR0b24gPSAkKGh0bWxUZW1wbGF0ZXMucHJldkJ1dHRvbigpKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdpbmF0aW9uQ2xpY2tlZCwgdGhpcykpXG4gICAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIpO1xuICAgICAgICAvLyBhZGQgbmV4dCBidXR0b25cbiAgICAgICAgdGhpcy4kbmV4dEJ1dHRvbiA9ICQoaHRtbFRlbXBsYXRlcy5uZXh0QnV0dG9uKCkpXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2luYXRpb25DbGlja2VkLCB0aGlzKSlcbiAgICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lcik7ICAgICAgIFxuXG4gICAgICAgIHRoaXMucHJlbG9hZFRodW1ibmFpbCgzKTtcbiAgICAgIH1cblxuICAgICAgLy8gZGlzY2xhaW1lciBtZXNzYWdlXG4gICAgICBjb25zdCAkZGlzY2xhaW1lciA9ICQoJzxkaXYgY2xhc3M9XCJhcnJhbmdlX3VuaXQgYXJyYW5nZV91bml0LS1maWxsXCIgLz4nKVxuICAgICAgICAudGV4dChjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwibDEwbkRpc2NsYWltZXJcIikpXG5cbiAgICAgICQoJzxoMiAvPicpXG4gICAgICAgIC50ZXh0KGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJsMTBuSGVhZGVyXCIpKVxuICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lci5wYXJlbnQoKSlcbiAgICAgICAgLmFmdGVyKCRkaXNjbGFpbWVyKTtcblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICAvLyBjYXJyb3NlbCdzIHBhZ2luYXRpb24gaGFuZGxlclxuICBvblBhZ2luYXRpb25DbGlja2VkKGUpIHtcbiAgICBsZXQgJGJ1dHRvbiA9ICQoZS50YXJnZXQpLFxuICAgICAgJHZpc2libGUgPSB0aGlzLiRpdGVtcy5maWx0ZXIoJzp2aXNpYmxlJylcblxuICAgIGlmICghJGJ1dHRvbi5pcygnYnV0dG9uJykpIHtcbiAgICAgICRidXR0b24gPSAkYnV0dG9uLmNsb3Nlc3QoJ2J1dHRvbicpO1xuICAgIH1cblxuICAgIC8vIHByZXYgY2FzZVxuICAgIGlmICgkYnV0dG9uLmlzKCcucHJldicpKSB7XG4gICAgICBsZXQgJHByZXYgPSAkdmlzaWJsZS5maXJzdCgpLnByZXYoJy5waG90bycpLFxuICAgICAgICAkZWxlbWVudHMgPSAkcHJldi5sZW5ndGggPyAkcHJldi5hZGQoJHZpc2libGUpIDogJHZpc2libGU7XG5cbiAgICAgIC8vIGRpc2FibGUvZW5hYmxlIHBhZ2luYXRpb24gYnV0dG9uc1xuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsICRwcmV2LnByZXZBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwKTtcbiAgICAgIHRoaXMuJG5leHRCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKChpLCBpdGVtKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSA9ICQoaXRlbSk7XG5cbiAgICAgICAgaWYgKGkgKyAxID09ICRlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAkaXRlbS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGl0ZW1cbiAgICAgICAgICAgIC5zaG93KClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncGhvdG8tJyArIGkpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bob3RvLScgKyAoaSArIDEpKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAvLyBuZXh0IGNhc2VcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0ICRuZXh0ID0gJHZpc2libGUubGFzdCgpLm5leHQoJy5waG90bycpLFxuICAgICAgICBpc1RvRGlzYWJsZSA9ICRuZXh0Lm5leHRBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwO1xuXG4gICAgICAvLyBkaXNhYmxlL2VuYWJsZSBwYWdpbmF0aW9uIGJ1dHRvbnNcbiAgICAgICRidXR0b24uYXR0cignZGlzYWJsZWQnLCBpc1RvRGlzYWJsZSk7XG4gICAgICB0aGlzLiRwcmV2QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXG4gICAgICAvLyBwcmVsb2FkIG5leHQgaW1hZ2UgdG8gYXZvaWQgYSBibGluayBvbiBuZXh0IHBhZ2luYXRpb25cbiAgICAgIGlmICghaXNUb0Rpc2FibGUpIHtcbiAgICAgICAgbGV0ICRuZXh0VG9QcmVsb2FkID0gJG5leHQubmV4dCgnLnBob3RvJyk7XG5cbiAgICAgICAgdGhpcy5wcmVsb2FkVGh1bWJuYWlsKHRoaXMuJGl0ZW1zLmluZGV4KCRuZXh0VG9QcmVsb2FkKSk7XG4gICAgICB9XG5cbiAgICAgICR2aXNpYmxlLmFkZCgkbmV4dCkuZWFjaCgoaSwgaXRlbSkgPT4ge1xuICAgICAgICBsZXQgJGl0ZW0gPSAkKGl0ZW0pO1xuXG4gICAgICAgIGlmICghaSkge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaXRlbVxuICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwaG90by0nICsgKGkgKyAxKSlcbiAgICAgICAgICAgIC5hZGRDbGFzcygncGhvdG8tJyArIGkpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIG9wZW5WaWRlbyhlKSB7XG4gICAgbGV0ICRpdGVtID0gJChlLnRhcmdldCkuY2xvc2VzdCgnLnBob3RvJyksXG4gICAgICBtZXRhID0gJGl0ZW0uZGF0YSgnbWV0YScpLFxuICAgICAgJG1vZGFsID0gJChodG1sVGVtcGxhdGVzLnZpZGVvTW9kYWwobWV0YSkpLFxuICAgICAgJGJ1dHRvbnMgPSAkKCdidXR0b24ucGFnJywgJG1vZGFsKTtcblxuICAgICRtb2RhbFxuICAgICAgLnNob3coKVxuICAgICAgLmFwcGVuZFRvKCdib2R5JylcbiAgICAgIC8vIGNsb3NlIG1vZGFsIHdoZW4gaXRzIG92ZXJsYXkgaXMgY2xpY2tlZFxuICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5jbG9zZVZpZGVvLCB0aGlzKSlcbiAgICAgIC5maW5kKCcuanMtbW9kYWwtY2xvc2UnLCAkLnByb3h5KHRoaXMuY2xvc2VWaWRlbywgdGhpcykpO1xuXG4gICAgLy8gaGlkZSBwcmV2L25leHQgYnV0dG9uc1xuICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGggPT0gMSkge1xuICAgICAgJGJ1dHRvbi5oaWRlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50ID0ge1xuICAgICAgdmlkZW8gICAgICAgOiBtZXRhLFxuICAgICAgJGVsZW1lbnQgICAgOiAkbW9kYWwsXG4gICAgICBpbmRleCAgICAgICA6IHRoaXMudmlkZW9zLmluZGV4T2YobWV0YSksXG4gICAgICAkcHJldkJ1dHRvbiA6ICRidXR0b25zLmZpbHRlcignLnByZXYnKSxcbiAgICAgICRuZXh0QnV0dG9uIDogJGJ1dHRvbnMuZmlsdGVyKCcubmV4dCcpXG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50LiRwcmV2QnV0dG9uID0gJGJ1dHRvbnMuZmlsdGVyKCcucHJldicpO1xuICAgIHRoaXMuY3VycmVudC4kbmV4dEJ1dHRvbiA9ICRidXR0b25zLmZpbHRlcignLm5leHQnKTtcblxuICAgIHRoaXMudmlkZW9QYWdpbmF0aW9uQnV0dG9uc1N0YXRlKCk7XG5cbiAgICAvLyBldmVudCBoYW5kbGVyXG4gICAgJGJ1dHRvbnMub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uVmlkZW9QcmV2TmV4dENsaWNrZWQsIHRoaXMpKTtcbiAgfVxuXG4gIG9uVmlkZW9QcmV2TmV4dENsaWNrZWQoZSkge1xuICAgIGxldCAkYnV0dG9uID0gJChlLnRhcmdldClcblxuICAgIGlmICghJGJ1dHRvbi5pcygnYnV0dG9uJykpIHtcbiAgICAgICRidXR0b24gPSAkYnV0dG9uLmNsb3Nlc3QoJ2J1dHRvbicpO1xuICAgIH1cblxuICAgIHRoaXMucGFnaW5hdGVWaWRlbygkYnV0dG9uLmlzKCcucHJldicpKTtcbiAgfVxuXG4gIHBhZ2luYXRlVmlkZW8odG9QcmV2aW91cykge1xuICAgIGxldCAkaWZyYW1lID0gJCgnaWZyYW1lJywgdGhpcy5jdXJyZW50LiRlbGVtZW50KSxcbiAgICAgIGN1cnJlbnRJbmRleCA9IHRoaXMuY3VycmVudC5pbmRleCxcbiAgICAgIGRhdGE7XG5cbiAgICAvLyBleGl0IGlmIGlzIHRoZSBmaXJzdCBvciB0aGUgbGFzdCB2aWRlb1xuICAgIGlmICgodG9QcmV2aW91cyAmJiAhY3VycmVudEluZGV4KSB8fCAoIXRvUHJldmlvdXMgJiYgY3VycmVudEluZGV4ICsgMSA9PSB0aGlzLnZpZGVvcy5sZW5ndGgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gc2V0IGEgbmV3IGluZGV4XG4gICAgdG9QcmV2aW91cyA/IC0tY3VycmVudEluZGV4IDogKytjdXJyZW50SW5kZXg7XG5cbiAgICAvLyBnZXQgcmlnaHQgdmlkZW8gZGF0YVxuICAgIGRhdGEgPSB0aGlzLnZpZGVvc1tjdXJyZW50SW5kZXhdO1xuXG4gICAgLy8gY2hhbmdlIGlmcmFtZVxuICAgICRpZnJhbWUuYWZ0ZXIoaHRtbFRlbXBsYXRlcy5pZnJhbWUoZGF0YSkpLnJlbW92ZSgpO1xuXG4gICAgLy8gY2hhbmdlIHRpdGxlXG4gICAgdGhpcy5jdXJyZW50LiRlbGVtZW50LmZpbmQoJ2gyJykudGV4dChkYXRhLnNuaXBwZXQudGl0bGUpO1xuXG4gICAgLy8gdXBkYXRlIGN1cnJlbnQgZGF0YVxuICAgIHRoaXMuY3VycmVudC52aWRlbyA9IGRhdGE7XG4gICAgdGhpcy5jdXJyZW50LmluZGV4ID0gY3VycmVudEluZGV4O1xuXG4gICAgLy8gY2hhbmdlIHBhZ2luYXRpb24gYnV0dG9ucyBzdGF0ZVxuICAgIHRoaXMudmlkZW9QYWdpbmF0aW9uQnV0dG9uc1N0YXRlKCk7XG4gIH1cblxuICB2aWRlb1BhZ2luYXRpb25CdXR0b25zU3RhdGUoKSB7XG4gICAgdGhpcy5jdXJyZW50LiRwcmV2QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgIXRoaXMuY3VycmVudC5pbmRleCk7XG4gICAgdGhpcy5jdXJyZW50LiRuZXh0QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgdGhpcy5jdXJyZW50LmluZGV4ICsgMSA9PSB0aGlzLnZpZGVvcy5sZW5ndGgpO1xuICB9XG5cbiAgY2xvc2VWaWRlbyhlKSB7XG4gICAgaWYgKGUpIHtcbiAgICAgIGxldCAkdGFyZ2V0ID0gJChlLnRhcmdldCk7XG4gICAgICAgIFxuICAgICAgaWYgKCEkdGFyZ2V0LmlzKCcuanMtbW9kYWwtY2xvc2UnKSAmJiAhJHRhcmdldC5pcygnLm1vZGFsJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gICAgXG5cbiAgICB0aGlzLmN1cnJlbnQuJGVsZW1lbnQucmVtb3ZlKCk7XG4gICAgdGhpcy5jdXJyZW50ID0gbnVsbDsgIFxuICB9XG5cbiAgLy8gcHJlbG9hZCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIGluIHBhZ2luYXRpb24gdHJhc2l0aW9uXG4gIHByZWxvYWRUaHVtYm5haWwoaW5kZXgpIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudmlkZW9zW2luZGV4XSwgXG4gICAgICB1cmwgPSBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0udXJsLFxuICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBjb25zb2xlLmxvZyhgJHt1cmx9IHByZWxvYWRlZGApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIGFuaW1hdGlvbiB0byBzaG93cyB1cCBtb2RhbCBjb21taW5nIGZyb20gQ1NTIHdpdGggdHJhbnNpdGlvbiBvbiBlbGVtZW50XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3MoJ3Nob3cnKVxuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdvdmVyZmxvdycpOyAgXG4gICAgICB9LCAxMDAwKTtcbiAgICB9LCAxMDAwKTtcblxuICAgIC8vIGNsb3NlIHZpZGVvIG1vZGFsIHdoZW4gZXNjIGlzIHByZXNzZWRcbiAgICAkKGRvY3VtZW50KS5rZXlkb3duKCQucHJveHkoKGUpID0+IHsgXG4gICAgICBpZiAoIXRoaXMuY3VycmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gICAgICAgIC8vIGNsb3NlIG1vZGFsXG4gICAgICAgIGNhc2UgMjc6XG4gICAgICAgICAgdGhpcy5jbG9zZVZpZGVvKCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgIC8vIHByZXZpb3VzIHZpZGVvXG4gICAgICAgIGNhc2UgMzc6XG4gICAgICAgICAgdGhpcy5wYWdpbmF0ZVZpZGVvKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgICAvLyBuZXh0IHZpZGVvXG4gICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgdGhpcy5wYWdpbmF0ZVZpZGVvKGZhbHNlKTtcbiAgICAgICAgYnJlYWs7IFxuICAgICAgfVxuICAgIH0sIHRoaXMpKVxuICB9XG59O1xuXG5jb25zdCBodG1sVGVtcGxhdGVzID0ge1xuICB0aHVibmFpbEl0ZW06ICh2aWRlbykgPT4ge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImpzLXBob3RvIHBob3RvIHBob3RvLSR7dmlkZW8uaX1cIj5cbiAgICAgICA8ZGl2IGNsYXNzPVwic2hvd2Nhc2UtcGhvdG8tYm94XCI+XG4gICAgICAgICAgPGEgaHJlZj1cIiNcIiBzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6dXJsKCcke3ZpZGVvLnRodW1ibmFpbC51cmx9JylcIj48c3BhbiAvPjwvYT5cbiAgICAgICA8L2Rpdj5cbiAgICAgICA8ZGl2IGNsYXNzPVwicGhvdG8tYm94LW92ZXJsYXkganMtb3ZlcmxheVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZWRpYS1ibG9jayBwaG90by1ib3gtb3ZlcmxheV9jYXB0aW9uXCI+XG4gICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLXN0b3J5XCI+XG4gICAgICAgICAgICAgICAgPGEgY2xhc3M9XCJwaG90by1kZXNjXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmV4Y2VycHR9PC9hPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYXV0aG9yXCI+XG4gICAgICAgICAgICAgICAgYnkgPGEgY2xhc3M9XCJ1c2VyLWRpc3BsYXktbmFtZVwiIGhyZWY9XCIjXCI+JHt2aWRlby5jaGFubmVsVGl0bGV9PC9hPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9LFxuXG4gIHByZXZCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJwcmV2IHBhZyB5YnRuIHlidG4tLWJpZ1wiIGRpc2FibGVkPlxuICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tbGVmdCBpY29uLS1zaXplLTQ4XCI+XG4gICAgICAgIDxzdmcgY2xhc3M9XCJpY29uX3N2Z1wiPjx1c2UgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeGxpbms6aHJlZj1cIiM0OHg0OF9jaGV2cm9uX2xlZnRcIj48L3VzZT48L3N2Zz5cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2J1dHRvbj5gO1xuICB9LFxuXG4gIG5leHRCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJuZXh0IHBhZyB5YnRuIHlidG4tLWJpZ1wiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tcmlnaHQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj48dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9yaWdodFwiPjwvdXNlPjwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgaWZyYW1lOiAoZGF0YSkgPT4ge1xuICAgIHJldHVybiBgPGlmcmFtZSBoZWlnaHQ9XCIzNjBcIiBzcmM9XCIvL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8ke2RhdGEuaWQudmlkZW9JZH0/cmVsPTAmYW1wO2F1dG9wbGF5PTFcIiBmcmFtZWJvcmRlcj1cIjBcIiBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+YDtcbiAgfSxcblxuICB2aWRlb01vZGFsOiAoZGF0YSkgPT4ge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIm1vZGFsIG1vZGFsLS1sYXJnZSB2eWVscC1tb2RhbFwiIGRhdGEtY29tcG9uZW50LWJvdW5kPVwidHJ1ZVwiPlxuICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2lubmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9jbG9zZSBqcy1tb2RhbC1jbG9zZVwiPsOXPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9kaWFsb2dcIiByb2xlPVwiZGlhbG9nXCI+PGRpdiBjbGFzcz1cIlwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9oZWFkXCI+XG4gICAgICAgICAgICA8aDI+JHtkYXRhLnNuaXBwZXQudGl0bGV9PC9oMj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfYm9keVwiPlxuICAgICAgICAgICAgJHtodG1sVGVtcGxhdGVzLnByZXZCdXR0b24oKX1cbiAgICAgICAgICAgICR7aHRtbFRlbXBsYXRlcy5pZnJhbWUoZGF0YSl9XG4gICAgICAgICAgICAke2h0bWxUZW1wbGF0ZXMubmV4dEJ1dHRvbigpfVxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX3NlY3Rpb24gdS1iZy1jb2xvclwiPlxuICAgICAgICAgICAgICAke2Nocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJsMTBuRm9vdGVyTWVzc2FnZVwiKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH1cbn07XG4iXX0=
