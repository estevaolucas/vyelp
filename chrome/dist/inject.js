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
          var $item = $(html.thubnailItem({
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
          this.$prevButton = $(html.prevButton()).on('click', $.proxy(this.onPaginationClicked, this)).prependTo(this.$container);
          // add next button
          this.$nextButton = $(html.nextButton()).on('click', $.proxy(this.onPaginationClicked, this)).prependTo(this.$container);

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
          $modal = $(html.videoModal(meta)),
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
      var $button = $(e.target),
          $iframe = $('iframe', this.current.$element),
          currentIndex = this.current.index,
          data = void 0;

      if (!$button.is('button')) {
        $button = $button.closest('button');
      }

      // set a new index
      $button.is('.prev') ? --currentIndex : ++currentIndex;

      // get right video data
      data = this.videos[currentIndex];

      // change iframe
      $iframe.after(html.iframe(data)).remove();

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
      $(document).keypress($.proxy(function (e) {
        if (e.keyCode == 27) {
          _this3.closeVideo();
        }
      }, this));
    }
  }]);

  return Vyelp;
}();

;

var html = {
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
    return '<div class="modal modal--large vyelp-modal" data-component-bound="true">\n      <div class="modal_inner">\n        <div class="modal_close js-modal-close">×</div>\n        <div class="modal_dialog" role="dialog"><div class="">\n          <div class="modal_head">\n            <h2>' + data.snippet.title + '</h2>\n          </div>\n          <div class="modal_body">\n            ' + html.prevButton() + '\n            ' + html.iframe(data) + '\n            ' + html.nextButton() + '\n            <div class="modal_section u-bg-color">\n              ' + chrome.i18n.getMessage("l10nFooterMessage") + '\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>';
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLHlDQUFwQjtBQUNBLElBQU0sY0FBYyx1Q0FBcEI7O0lBRU0sSztBQUNKLGlCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxXQUFMO0FBQ0Q7Ozs7a0NBRWE7QUFDWixRQUFFLElBQUYsQ0FBTztBQUNMLGFBQVEsV0FBUixpREFBK0QsS0FBSyxRQUFMLENBQWMsUUFBN0UsU0FBeUYsS0FBSyxRQUFMLENBQWMsU0FBdkcsaUNBQTRJLFdBRHZJO0FBRUwsaUJBQVMsRUFBRSxLQUFGLENBQVEsS0FBSyxjQUFiLEVBQTZCLElBQTdCLENBRko7QUFHTCxlQUFPLGVBQVMsUUFBVCxFQUFtQjtBQUN4QixrQkFBUSxHQUFSLENBQVksdUJBQVosRUFBcUMsUUFBckM7QUFDRDtBQUxJLE9BQVA7QUFPRDs7O21DQUVjLFEsRUFB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LENBQWdCLEdBRmpFLG1QQU82QyxNQUFNLE9BUG5ELDhHQVN1RCxNQUFNLFlBVDdEO0FBZUQsR0FqQlU7O0FBbUJYLGNBQVksc0JBQU07QUFDaEI7QUFLRCxHQXpCVTs7QUEyQlgsY0FBWSxzQkFBTTtBQUNoQjtBQUtELEdBakNVOztBQW1DWCxVQUFRLGdCQUFDLElBQUQsRUFBVTtBQUNoQixrRUFBNEQsS0FBSyxFQUFMLENBQVEsT0FBcEU7QUFDRCxHQXJDVTs7QUF1Q1gsY0FBWSxvQkFBQyxJQUFELEVBQVU7QUFDcEIsd1NBS2MsS0FBSyxPQUFMLENBQWEsS0FMM0IsaUZBUVUsS0FBSyxVQUFMLEVBUlYsc0JBU1UsS0FBSyxNQUFMLENBQVksSUFBWixDQVRWLHNCQVVVLEtBQUssVUFBTCxFQVZWLDRFQVlZLE9BQU8sSUFBUCxDQUFZLFVBQVosQ0FBdUIsbUJBQXZCLENBWlo7QUFrQkQ7QUExRFUsQ0FBYiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjaHJvbWUuZXh0ZW5zaW9uLnNlbmRNZXNzYWdlKHt9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICB2YXIgcmVhZHlTdGF0ZUNoZWNrSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICBjbGVhckludGVydmFsKHJlYWR5U3RhdGVDaGVja0ludGVydmFsKTtcblxuICAgICAgbGV0IG1ldGFkYXRhID0gSlNPTi5wYXJzZSgkKCcubGlnaHRib3gtbWFwJylbMF0uZGF0YXNldC5tYXBTdGF0ZSksXG4gICAgICAgIGxvY2F0aW9uID0gbWV0YWRhdGEubWFya2Vycy5zdGFycmVkX2J1c2luZXNzLmxvY2F0aW9uO1xuXG4gICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgbmV3IFZ5ZWxwKGxvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDEwKTtcbn0pOyBcblxuY29uc3QgWU9VVFVCRV9LRVkgPSAnQUl6YVN5Q2FLSkJ5Qi03akpZXzJFM2JveUo3OHAwSnY4b2V1cmlJJztcbmNvbnN0IFlPVVRVQkVfQVBJID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3lvdXR1YmUvdjMnO1xuXG5jbGFzcyBWeWVscCB7XG4gIGNvbnN0cnVjdG9yKGxvY2F0aW9uKSB7XG4gICAgdGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgIHRoaXMuZmV0Y2hWaWRlb3MoKTtcbiAgfVxuXG4gIGZldGNoVmlkZW9zKCkge1xuICAgICQuYWpheCh7XG4gICAgICB1cmw6IGAke1lPVVRVQkVfQVBJfS9zZWFyY2g/cGFydD1zbmlwcGV0JnR5cGU9dmlkZW8mbG9jYXRpb249JHt0aGlzLmxvY2F0aW9uLmxhdGl0dWRlfSwke3RoaXMubG9jYXRpb24ubG9uZ2l0dWRlfSZsb2NhdGlvblJhZGl1cz0xMGttJmtleT0ke1lPVVRVQkVfS0VZfWAsXG4gICAgICBzdWNjZXNzOiAkLnByb3h5KHRoaXMuYnVpbGRTdHJ1Y3R1cmUsIHRoaXMpLFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBmZXRjaGluZyB2aWRlb3MnLCByZXNwb25zZSk7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGJ1aWxkU3RydWN0dXJlKHJlc3BvbnNlKSB7XG4gICAgY29uc3QgJHBsYWNlaG9sZGVyID0gJCgnI3N1cGVyLWNvbnRhaW5lcicpO1xuXG4gICAgdGhpcy4kY29udGFpbmVyID0gJCgnPGRpdiAvPicpLmFkZENsYXNzKCdzaG93Y2FzZS1waG90b3MgdnllbHAnKTtcbiAgICB0aGlzLnZpZGVvcyA9IHJlc3BvbnNlLml0ZW1zO1xuICAgIFxuICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMudmlkZW9zLmZvckVhY2goKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgdmFyICRpdGVtID0gJChodG1sLnRodWJuYWlsSXRlbSh7XG4gICAgICAgICAgICBpOiBpICsgMSxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkLnZpZGVvSWQsXG4gICAgICAgICAgICB0aXRsZTogaXRlbS5zbmlwcGV0LnRpdGxlLFxuICAgICAgICAgICAgdGh1bWJuYWlsOiBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0sXG4gICAgICAgICAgICBjaGFubmVsVGl0bGU6IGl0ZW0uc25pcHBldC5jaGFubmVsVGl0bGUsXG4gICAgICAgICAgICBleGNlcnB0OiBpdGVtLnNuaXBwZXQudGl0bGUubGVuZ3RoID4gNTAgPyBgJHtpdGVtLnNuaXBwZXQudGl0bGUuc3Vic3RyaW5nKDAsIDUwKX0gLi4uYDogaXRlbS5zbmlwcGV0LnRpdGxlXG4gICAgICAgICAgfSkpO1xuXG4gICAgICAgIGlmIChpID4gMikge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgICRpdGVtXG4gICAgICAgICAgLmRhdGEoJ21ldGEnLCBpdGVtKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub3BlblZpZGVvLCB0aGlzKSlcblxuICAgICAgICB0aGlzLiRjb250YWluZXIuYXBwZW5kKCRpdGVtKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLiRpdGVtcyA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCc+IC5qcy1waG90bycpO1xuICAgICAgdGhpcy4kY29udGFpbmVyLnByZXBlbmRUbygkcGxhY2Vob2xkZXIpO1xuXG4gICAgICAvLyBqdXN0IGFkZCBwYWdpbmF0aW9uIGJ1dHRvbnMgaWYgbmVlZGVkXG4gICAgICBpZiAodGhpcy52aWRlb3MubGVuZ3RoID4gMykge1xuICAgICAgICAvLyBhZGQgcHJldmlvdXMgYnV0dG9uIFxuICAgICAgICB0aGlzLiRwcmV2QnV0dG9uID0gJChodG1sLnByZXZCdXR0b24oKSlcbiAgICAgICAgICAub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uUGFnaW5hdGlvbkNsaWNrZWQsIHRoaXMpKVxuICAgICAgICAgIC5wcmVwZW5kVG8odGhpcy4kY29udGFpbmVyKTtcbiAgICAgICAgLy8gYWRkIG5leHQgYnV0dG9uXG4gICAgICAgIHRoaXMuJG5leHRCdXR0b24gPSAkKGh0bWwubmV4dEJ1dHRvbigpKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdpbmF0aW9uQ2xpY2tlZCwgdGhpcykpXG4gICAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIpOyAgICAgICBcblxuICAgICAgICB0aGlzLnByZWxvYWRUaHVtYm5haWwoMyk7XG4gICAgICB9XG5cbiAgICAgIC8vIGRpc2NsYWltZXIgbWVzc2FnZVxuICAgICAgY29uc3QgJGRpc2NsYWltZXIgPSAkKCc8ZGl2IGNsYXNzPVwiYXJyYW5nZV91bml0IGFycmFuZ2VfdW5pdC0tZmlsbFwiIC8+JylcbiAgICAgICAgLnRleHQoY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcImwxMG5EaXNjbGFpbWVyXCIpKVxuXG4gICAgICAkKCc8aDIgLz4nKVxuICAgICAgICAudGV4dChjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwibDEwbkhlYWRlclwiKSlcbiAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIucGFyZW50KCkpXG4gICAgICAgIC5hZnRlcigkZGlzY2xhaW1lcik7XG5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gY2Fycm9zZWwncyBwYWdpbmF0aW9uIGhhbmRsZXJcbiAgb25QYWdpbmF0aW9uQ2xpY2tlZChlKSB7XG4gICAgbGV0ICRidXR0b24gPSAkKGUudGFyZ2V0KSxcbiAgICAgICR2aXNpYmxlID0gdGhpcy4kaXRlbXMuZmlsdGVyKCc6dmlzaWJsZScpXG5cbiAgICBpZiAoISRidXR0b24uaXMoJ2J1dHRvbicpKSB7XG4gICAgICAkYnV0dG9uID0gJGJ1dHRvbi5jbG9zZXN0KCdidXR0b24nKTtcbiAgICB9XG5cbiAgICAvLyBwcmV2IGNhc2VcbiAgICBpZiAoJGJ1dHRvbi5pcygnLnByZXYnKSkge1xuICAgICAgbGV0ICRwcmV2ID0gJHZpc2libGUuZmlyc3QoKS5wcmV2KCcucGhvdG8nKSxcbiAgICAgICAgJGVsZW1lbnRzID0gJHByZXYubGVuZ3RoID8gJHByZXYuYWRkKCR2aXNpYmxlKSA6ICR2aXNpYmxlO1xuXG4gICAgICAvLyBkaXNhYmxlL2VuYWJsZSBwYWdpbmF0aW9uIGJ1dHRvbnNcbiAgICAgICRidXR0b24uYXR0cignZGlzYWJsZWQnLCAkcHJldi5wcmV2QWxsKCcucGhvdG8nKS5sZW5ndGggPT0gMCk7XG4gICAgICB0aGlzLiRuZXh0QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXG4gICAgICAkZWxlbWVudHMuZWFjaCgoaSwgaXRlbSkgPT4ge1xuICAgICAgICBsZXQgJGl0ZW0gPSAkKGl0ZW0pO1xuXG4gICAgICAgIGlmIChpICsgMSA9PSAkZWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRpdGVtXG4gICAgICAgICAgICAuc2hvdygpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3Bob3RvLScgKyBpKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdwaG90by0nICsgKGkgKyAxKSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgLy8gbmV4dCBjYXNlXG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCAkbmV4dCA9ICR2aXNpYmxlLmxhc3QoKS5uZXh0KCcucGhvdG8nKSxcbiAgICAgICAgaXNUb0Rpc2FibGUgPSAkbmV4dC5uZXh0QWxsKCcucGhvdG8nKS5sZW5ndGggPT0gMDtcblxuICAgICAgLy8gZGlzYWJsZS9lbmFibGUgcGFnaW5hdGlvbiBidXR0b25zXG4gICAgICAkYnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgaXNUb0Rpc2FibGUpO1xuICAgICAgdGhpcy4kcHJldkJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcblxuICAgICAgLy8gcHJlbG9hZCBuZXh0IGltYWdlIHRvIGF2b2lkIGEgYmxpbmsgb24gbmV4dCBwYWdpbmF0aW9uXG4gICAgICBpZiAoIWlzVG9EaXNhYmxlKSB7XG4gICAgICAgIGxldCAkbmV4dFRvUHJlbG9hZCA9ICRuZXh0Lm5leHQoJy5waG90bycpO1xuXG4gICAgICAgIHRoaXMucHJlbG9hZFRodW1ibmFpbCh0aGlzLiRpdGVtcy5pbmRleCgkbmV4dFRvUHJlbG9hZCkpO1xuICAgICAgfVxuXG4gICAgICAkdmlzaWJsZS5hZGQoJG5leHQpLmVhY2goKGksIGl0ZW0pID0+IHtcbiAgICAgICAgbGV0ICRpdGVtID0gJChpdGVtKTtcblxuICAgICAgICBpZiAoIWkpIHtcbiAgICAgICAgICAkaXRlbS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGl0ZW1cbiAgICAgICAgICAgIC5zaG93KClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncGhvdG8tJyArIChpICsgMSkpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bob3RvLScgKyBpKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBvcGVuVmlkZW8oZSkge1xuICAgIGxldCAkaXRlbSA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5waG90bycpLFxuICAgICAgbWV0YSA9ICRpdGVtLmRhdGEoJ21ldGEnKSxcbiAgICAgICRtb2RhbCA9ICQoaHRtbC52aWRlb01vZGFsKG1ldGEpKSxcbiAgICAgICRidXR0b25zID0gJCgnYnV0dG9uLnBhZycsICRtb2RhbCk7XG5cbiAgICAkbW9kYWxcbiAgICAgIC5zaG93KClcbiAgICAgIC5hcHBlbmRUbygnYm9keScpXG4gICAgICAvLyBjbG9zZSBtb2RhbCB3aGVuIGl0cyBvdmVybGF5IGlzIGNsaWNrZWRcbiAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuY2xvc2VWaWRlbywgdGhpcykpXG4gICAgICAuZmluZCgnLmpzLW1vZGFsLWNsb3NlJywgJC5wcm94eSh0aGlzLmNsb3NlVmlkZW8sIHRoaXMpKTtcblxuICAgIC8vIGhpZGUgcHJldi9uZXh0IGJ1dHRvbnNcbiAgICBpZiAodGhpcy52aWRlb3MubGVuZ3RoID09IDEpIHtcbiAgICAgICRidXR0b24uaGlkZSgpO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHtcbiAgICAgIHZpZGVvICAgICAgIDogbWV0YSxcbiAgICAgICRlbGVtZW50ICAgIDogJG1vZGFsLFxuICAgICAgaW5kZXggICAgICAgOiB0aGlzLnZpZGVvcy5pbmRleE9mKG1ldGEpLFxuICAgICAgJHByZXZCdXR0b24gOiAkYnV0dG9ucy5maWx0ZXIoJy5wcmV2JyksXG4gICAgICAkbmV4dEJ1dHRvbiA6ICRidXR0b25zLmZpbHRlcignLm5leHQnKVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudC4kcHJldkJ1dHRvbiA9ICRidXR0b25zLmZpbHRlcignLnByZXYnKTtcbiAgICB0aGlzLmN1cnJlbnQuJG5leHRCdXR0b24gPSAkYnV0dG9ucy5maWx0ZXIoJy5uZXh0Jyk7XG5cbiAgICB0aGlzLnZpZGVvUGFnaW5hdGlvbkJ1dHRvbnNTdGF0ZSgpO1xuXG4gICAgLy8gZXZlbnQgaGFuZGxlclxuICAgICRidXR0b25zLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblZpZGVvUHJldk5leHRDbGlja2VkLCB0aGlzKSk7XG4gIH1cblxuICBvblZpZGVvUHJldk5leHRDbGlja2VkKGUpIHtcbiAgICBsZXQgJGJ1dHRvbiA9ICQoZS50YXJnZXQpLFxuICAgICAgJGlmcmFtZSA9ICQoJ2lmcmFtZScsIHRoaXMuY3VycmVudC4kZWxlbWVudCksXG4gICAgICBjdXJyZW50SW5kZXggPSB0aGlzLmN1cnJlbnQuaW5kZXgsXG4gICAgICBkYXRhO1xuXG4gICAgaWYgKCEkYnV0dG9uLmlzKCdidXR0b24nKSkge1xuICAgICAgJGJ1dHRvbiA9ICRidXR0b24uY2xvc2VzdCgnYnV0dG9uJyk7XG4gICAgfVxuXG4gICAgLy8gc2V0IGEgbmV3IGluZGV4XG4gICAgJGJ1dHRvbi5pcygnLnByZXYnKSA/IC0tY3VycmVudEluZGV4IDogKytjdXJyZW50SW5kZXg7XG5cbiAgICAvLyBnZXQgcmlnaHQgdmlkZW8gZGF0YVxuICAgIGRhdGEgPSB0aGlzLnZpZGVvc1tjdXJyZW50SW5kZXhdO1xuXG4gICAgLy8gY2hhbmdlIGlmcmFtZVxuICAgICRpZnJhbWUuYWZ0ZXIoaHRtbC5pZnJhbWUoZGF0YSkpLnJlbW92ZSgpO1xuXG4gICAgLy8gY2hhbmdlIHRpdGxlXG4gICAgdGhpcy5jdXJyZW50LiRlbGVtZW50LmZpbmQoJ2gyJykudGV4dChkYXRhLnNuaXBwZXQudGl0bGUpO1xuXG4gICAgLy8gdXBkYXRlIGN1cnJlbnQgZGF0YVxuICAgIHRoaXMuY3VycmVudC52aWRlbyA9IGRhdGE7XG4gICAgdGhpcy5jdXJyZW50LmluZGV4ID0gY3VycmVudEluZGV4O1xuXG4gICAgLy8gY2hhbmdlIHBhZ2luYXRpb24gYnV0dG9ucyBzdGF0ZVxuICAgIHRoaXMudmlkZW9QYWdpbmF0aW9uQnV0dG9uc1N0YXRlKCk7XG4gIH1cblxuICB2aWRlb1BhZ2luYXRpb25CdXR0b25zU3RhdGUoKSB7XG4gICAgdGhpcy5jdXJyZW50LiRwcmV2QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgIXRoaXMuY3VycmVudC5pbmRleCk7XG4gICAgdGhpcy5jdXJyZW50LiRuZXh0QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgdGhpcy5jdXJyZW50LmluZGV4ICsgMSA9PSB0aGlzLnZpZGVvcy5sZW5ndGgpO1xuICB9XG5cbiAgY2xvc2VWaWRlbyhlKSB7XG4gICAgaWYgKGUpIHtcbiAgICAgIGxldCAkdGFyZ2V0ID0gJChlLnRhcmdldCk7XG4gICAgICAgIFxuICAgICAgaWYgKCEkdGFyZ2V0LmlzKCcuanMtbW9kYWwtY2xvc2UnKSAmJiAhJHRhcmdldC5pcygnLm1vZGFsJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gICAgXG5cbiAgICB0aGlzLmN1cnJlbnQuJGVsZW1lbnQucmVtb3ZlKCk7XG4gICAgdGhpcy5jdXJyZW50ID0gbnVsbDsgIFxuICB9XG5cbiAgLy8gcHJlbG9hZCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIGluIHBhZ2luYXRpb24gdHJhc2l0aW9uXG4gIHByZWxvYWRUaHVtYm5haWwoaW5kZXgpIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudmlkZW9zW2luZGV4XSwgXG4gICAgICB1cmwgPSBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0udXJsLFxuICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBjb25zb2xlLmxvZyhgJHt1cmx9IHByZWxvYWRlZGApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIGFuaW1hdGlvbiB0byBzaG93cyB1cCBtb2RhbCBjb21taW5nIGZyb20gQ1NTIHdpdGggdHJhbnNpdGlvbiBvbiBlbGVtZW50XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3MoJ3Nob3cnKVxuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdvdmVyZmxvdycpOyAgXG4gICAgICB9LCAxMDAwKTtcbiAgICB9LCAxMDAwKTtcblxuICAgIC8vIGNsb3NlIHZpZGVvIG1vZGFsIHdoZW4gZXNjIGlzIHByZXNzZWRcbiAgICAkKGRvY3VtZW50KS5rZXlwcmVzcygkLnByb3h5KChlKSA9PiB7IFxuICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNykgeyBcbiAgICAgICAgdGhpcy5jbG9zZVZpZGVvKCk7XG4gICAgICB9XG4gICAgfSwgdGhpcykpXG4gIH1cbn07XG5cbmNvbnN0IGh0bWwgPSB7XG4gIHRodWJuYWlsSXRlbTogKHZpZGVvKSA9PiB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwianMtcGhvdG8gcGhvdG8gcGhvdG8tJHt2aWRlby5pfVwiPlxuICAgICAgIDxkaXYgY2xhc3M9XCJzaG93Y2FzZS1waG90by1ib3hcIj5cbiAgICAgICAgICA8YSBocmVmPVwiI1wiIHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTp1cmwoJyR7dmlkZW8udGh1bWJuYWlsLnVybH0nKVwiPjxzcGFuIC8+PC9hPlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJwaG90by1ib3gtb3ZlcmxheSBqcy1vdmVybGF5XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLWJsb2NrIHBob3RvLWJveC1vdmVybGF5X2NhcHRpb25cIj5cbiAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWVkaWEtc3RvcnlcIj5cbiAgICAgICAgICAgICAgICA8YSBjbGFzcz1cInBob3RvLWRlc2NcIiBocmVmPVwiI1wiPiR7dmlkZW8uZXhjZXJwdH08L2E+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJhdXRob3JcIj5cbiAgICAgICAgICAgICAgICBieSA8YSBjbGFzcz1cInVzZXItZGlzcGxheS1uYW1lXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmNoYW5uZWxUaXRsZX08L2E+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH0sXG5cbiAgcHJldkJ1dHRvbjogKCkgPT4ge1xuICAgIHJldHVybiBgPGJ1dHRvbiBjbGFzcz1cInByZXYgcGFnIHlidG4geWJ0bi0tYmlnXCIgZGlzYWJsZWQ+XG4gICAgICA8c3BhbiBjbGFzcz1cImljb24gaWNvbi0tNDgtY2hldnJvbi1sZWZ0IGljb24tLXNpemUtNDhcIj5cbiAgICAgICAgPHN2ZyBjbGFzcz1cImljb25fc3ZnXCI+PHVzZSB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB4bGluazpocmVmPVwiIzQ4eDQ4X2NoZXZyb25fbGVmdFwiPjwvdXNlPjwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgbmV4dEJ1dHRvbjogKCkgPT4ge1xuICAgIHJldHVybiBgPGJ1dHRvbiBjbGFzcz1cIm5leHQgcGFnIHlidG4geWJ0bi0tYmlnXCI+XG4gICAgICA8c3BhbiBjbGFzcz1cImljb24gaWNvbi0tNDgtY2hldnJvbi1yaWdodCBpY29uLS1zaXplLTQ4XCI+XG4gICAgICAgIDxzdmcgY2xhc3M9XCJpY29uX3N2Z1wiPjx1c2UgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeGxpbms6aHJlZj1cIiM0OHg0OF9jaGV2cm9uX3JpZ2h0XCI+PC91c2U+PC9zdmc+XG4gICAgICA8L3NwYW4+XG4gICAgPC9idXR0b24+YDtcbiAgfSxcblxuICBpZnJhbWU6IChkYXRhKSA9PiB7XG4gICAgcmV0dXJuIGA8aWZyYW1lIGhlaWdodD1cIjM2MFwiIHNyYz1cIi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLyR7ZGF0YS5pZC52aWRlb0lkfT9yZWw9MCZhbXA7YXV0b3BsYXk9MVwiIGZyYW1lYm9yZGVyPVwiMFwiIGFsbG93ZnVsbHNjcmVlbj48L2lmcmFtZT5gO1xuICB9LFxuXG4gIHZpZGVvTW9kYWw6IChkYXRhKSA9PiB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwibW9kYWwgbW9kYWwtLWxhcmdlIHZ5ZWxwLW1vZGFsXCIgZGF0YS1jb21wb25lbnQtYm91bmQ9XCJ0cnVlXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfaW5uZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2Nsb3NlIGpzLW1vZGFsLWNsb3NlXCI+w5c8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2RpYWxvZ1wiIHJvbGU9XCJkaWFsb2dcIj48ZGl2IGNsYXNzPVwiXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2hlYWRcIj5cbiAgICAgICAgICAgIDxoMj4ke2RhdGEuc25pcHBldC50aXRsZX08L2gyPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9ib2R5XCI+XG4gICAgICAgICAgICAke2h0bWwucHJldkJ1dHRvbigpfVxuICAgICAgICAgICAgJHtodG1sLmlmcmFtZShkYXRhKX1cbiAgICAgICAgICAgICR7aHRtbC5uZXh0QnV0dG9uKCl9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfc2VjdGlvbiB1LWJnLWNvbG9yXCI+XG4gICAgICAgICAgICAgICR7Y2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcImwxMG5Gb290ZXJNZXNzYWdlXCIpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgfVxufTtcbiJdfQ==
