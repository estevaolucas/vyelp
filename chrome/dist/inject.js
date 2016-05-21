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

var YOUTUBE_KEY = ' AIzaSyCaKJByB-7jJY_2E3boyJ78p0Jv8oeuriI';

var Vyelp = function () {
  function Vyelp(location) {
    _classCallCheck(this, Vyelp);

    this.location = location;
    this.baseYTApi = 'https://www.googleapis.com/youtube/v3';

    this.fetchVideos();
  }

  _createClass(Vyelp, [{
    key: 'fetchVideos',
    value: function fetchVideos() {
      var _this = this;

      $.ajax({
        url: this.baseYTApi + '/search?part=snippet&type=video&location=' + this.location.latitude + ',' + this.location.longitude + '&locationRadius=10km&key=' + YOUTUBE_KEY,
        success: $.proxy(function (response) {
          var ids = response.items.map(function (item) {
            return item.id.videoId;
          }).join(',');

          $.ajax({
            url: _this.baseYTApi + '/videos?id=' + ids + '&part=snippet,player&key=' + YOUTUBE_KEY,
            success: $.proxy(_this.buildStructure, _this)
          });
        }, this),
        error: function error(response) {
          console.log('Error fetching videos', response);
        }
      });
    }
  }, {
    key: 'buildStructure',
    value: function buildStructure(response) {
      var _this2 = this;

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

          $item.data('meta', item).on('click', $.proxy(_this2.openVideo, _this2));

          _this2.$container.append($item);
        });

        this.$items = this.$container.find('> .js-photo');
        this.$container.prependTo($placeholder);

        // just add pagination buttons if needed
        if (this.videos.length > 3) {
          // add previous button
          this.$prevButton = $(html.prevButton()).on('click', $.proxy(this.onPaginationClicked, this)).prependTo(this.$container);
          // add next button
          this.$nextButton = $(html.nextButton()).on('click', $.proxy(this.onPaginationClicked, this)).prependTo(this.$container);
        }

        this.render();
      }
    }
  }, {
    key: 'openVideo',
    value: function openVideo(e) {
      var $item = $(e.target).closest('.photo'),
          meta = $item.data('meta'),
          $modal = $(html.videoModal(meta.player.embedHtml, meta));

      $modal.show().appendTo('body').on('click', $.proxy(this.closeVideo, this)).find('.js-modal-close', $.proxy(this.closeVideo, this));
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

      $('.vyelp-modal').remove();
    }
  }, {
    key: 'onPaginationClicked',
    value: function onPaginationClicked(e) {
      var _this3 = this;

      var $button = $(e.target),
          $visible = this.$items.filter(':visible');

      if (!$button.is('button')) {
        $button = $button.closest('button');
      }

      if ($button.is('.prev')) {
        (function () {
          var $prev = $visible.first().prev('.photo'),
              $elements = $prev.length ? $prev.add($visible) : $visible;

          $button.attr('disabled', $prev.prevAll('.photo').length == 0);
          _this3.$nextButton.attr('disabled', false);

          $elements.each(function (i, item) {
            var $item = $(item);

            if (i + 1 == $elements.length) {
              $item.hide();
            } else {
              $item.show().removeClass('photo-' + i).addClass('photo-' + (i + 1));
            }
          });
        })();
      } else {
        var $next = $visible.last().next('.photo');

        $button.attr('disabled', $next.nextAll('.photo').length == 0);
        this.$prevButton.attr('disabled', false);

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
    key: 'render',
    value: function render() {
      var _this4 = this;

      // animation to apper comming from CSS
      setTimeout(function () {
        _this4.$container.addClass('show');

        setTimeout(function () {
          _this4.$container.addClass('overflow');
        }, 1000);
      }, 1000);

      // close video modal when esc is pressed
      $(document).keypress($.proxy(function (e) {
        debugger;
        if (e.keyCode == 27) {
          _this4.closeVideo();
        }
      }, this));
    }
  }]);

  return Vyelp;
}();

;

var html = {
  thubnailItem: function thubnailItem(video) {
    return '<div class="js-photo photo photo-' + video.i + '">\n       <div class="showcase-photo-box">\n          <a href="#" style="background-image:url(\'' + video.thumbnail.url + '\')"></a>\n       </div>\n       <div class="photo-box-overlay js-overlay">\n          <div class="media-block photo-box-overlay_caption">\n             <div class="media-story">\n                <a class="photo-desc" href="#">' + video.excerpt + '</a>\n                <span class="author">\n                by <a class="user-display-name" href="#">' + video.channelTitle + '</a>\n                </span>\n             </div>\n          </div>\n       </div>\n    </div>';
  },

  prevButton: function prevButton() {
    return '<button class="prev ybtn ybtn--big" disabled>\n      <span aria-label="test" style="width: 48px; height: 48px;" class="icon icon--48-chevron-left icon--size-48">\n        <svg class="icon_svg">\n          <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_left"></use>\n        </svg>\n      </span>\n    </button>';
  },

  nextButton: function nextButton() {
    return '<button class="next ybtn ybtn--big">\n      <span aria-label="test" style="width: 48px; height: 48px;" class="icon icon--48-chevron-right icon--size-48">\n        <svg class="icon_svg">\n          <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_right"></use>\n        </svg>\n      </span>\n    </button>';
  },

  videoModal: function videoModal(iframe, data) {
    return '<div class="modal modal--large vyelp-modal" data-component-bound="true">\n      <div class="modal_inner">\n        <div class="modal_close js-modal-close">×</div>\n        <div class="modal_dialog" role="dialog"><div class="">\n          <div class="modal_head">\n            <h2>' + data.snippet.title + '</h2>\n          </div>\n          <div class="modal_body">\n            ' + iframe + '\n            <div class="modal_section u-bg-color">\n              Video loaded from Vyelp chrome extension!\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>';
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLDBDQUFwQjs7SUFFTSxLO0FBQ0osaUJBQVksUUFBWixFQUFzQjtBQUFBOztBQUNwQixTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxTQUFLLFNBQUwsR0FBaUIsdUNBQWpCOztBQUVBLFNBQUssV0FBTDtBQUNEOzs7O2tDQUVhO0FBQUE7O0FBQ1osUUFBRSxJQUFGLENBQU87QUFDTCxhQUFRLEtBQUssU0FBYixpREFBa0UsS0FBSyxRQUFMLENBQWMsUUFBaEYsU0FBNEYsS0FBSyxRQUFMLENBQWMsU0FBMUcsaUNBQStJLFdBRDFJO0FBRUwsaUJBQVMsRUFBRSxLQUFGLENBQVEsVUFBQyxRQUFELEVBQWM7QUFDN0IsY0FBSSxNQUFNLFNBQVMsS0FBVCxDQUFlLEdBQWYsQ0FBbUIsVUFBQyxJQUFELEVBQVU7QUFDbkMsbUJBQU8sS0FBSyxFQUFMLENBQVEsT0FBZjtBQUNE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b0IsRUFLbEIsSUFMa0IsQ0FBckI7QUFNRDs7Ozs7O0FBQ0Y7O0FBR0QsSUFBTSxPQUFPO0FBQ1gsZ0JBQWMsc0JBQUMsS0FBRCxFQUFXO0FBQ3ZCLGlEQUEyQyxNQUFNLENBQWpELHlHQUVpRCxNQUFNLFNBQU4sQ0FBZ0IsR0FGakUsMk9BTzZDLE1BQU0sT0FQbkQsOEdBU3VELE1BQU0sWUFUN0Q7QUFlRCxHQWpCVTs7QUFtQlgsY0FBWSxzQkFBTTtBQUNoQjtBQU9ELEdBM0JVOztBQTZCWCxjQUFZLHNCQUFNO0FBQ2hCO0FBT0QsR0FyQ1U7O0FBdUNYLGNBQVksb0JBQUMsTUFBRCxFQUFTLElBQVQsRUFBa0I7QUFDNUIsd1NBS2MsS0FBSyxPQUFMLENBQWEsS0FMM0IsaUZBUVUsTUFSVjtBQWdCRDtBQXhEVSxDQUFiIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNocm9tZS5leHRlbnNpb24uc2VuZE1lc3NhZ2Uoe30sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gIHZhciByZWFkeVN0YXRlQ2hlY2tJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwocmVhZHlTdGF0ZUNoZWNrSW50ZXJ2YWwpO1xuXG4gICAgICBsZXQgbWV0YWRhdGEgPSBKU09OLnBhcnNlKCQoJy5saWdodGJveC1tYXAnKVswXS5kYXRhc2V0Lm1hcFN0YXRlKSxcbiAgICAgICAgbG9jYXRpb24gPSBtZXRhZGF0YS5tYXJrZXJzLnN0YXJyZWRfYnVzaW5lc3MubG9jYXRpb247XG5cbiAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICBuZXcgVnllbHAobG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgMTApO1xufSk7IFxuXG5jb25zdCBZT1VUVUJFX0tFWSA9ICcgQUl6YVN5Q2FLSkJ5Qi03akpZXzJFM2JveUo3OHAwSnY4b2V1cmlJJztcblxuY2xhc3MgVnllbHAge1xuICBjb25zdHJ1Y3Rvcihsb2NhdGlvbikge1xuICAgIHRoaXMubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICB0aGlzLmJhc2VZVEFwaSA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS95b3V0dWJlL3YzJztcblxuICAgIHRoaXMuZmV0Y2hWaWRlb3MoKTtcbiAgfVxuXG4gIGZldGNoVmlkZW9zKCkge1xuICAgICQuYWpheCh7XG4gICAgICB1cmw6IGAke3RoaXMuYmFzZVlUQXBpfS9zZWFyY2g/cGFydD1zbmlwcGV0JnR5cGU9dmlkZW8mbG9jYXRpb249JHt0aGlzLmxvY2F0aW9uLmxhdGl0dWRlfSwke3RoaXMubG9jYXRpb24ubG9uZ2l0dWRlfSZsb2NhdGlvblJhZGl1cz0xMGttJmtleT0ke1lPVVRVQkVfS0VZfWAsXG4gICAgICBzdWNjZXNzOiAkLnByb3h5KChyZXNwb25zZSkgPT4ge1xuICAgICAgICBsZXQgaWRzID0gcmVzcG9uc2UuaXRlbXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5pZC52aWRlb0lkO1xuICAgICAgICAgIH0pLmpvaW4oJywnKTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHVybDogYCR7dGhpcy5iYXNlWVRBcGl9L3ZpZGVvcz9pZD0ke2lkc30mcGFydD1zbmlwcGV0LHBsYXllciZrZXk9JHtZT1VUVUJFX0tFWX1gLFxuICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkodGhpcy5idWlsZFN0cnVjdHVyZSwgdGhpcylcbiAgICAgICAgfSlcbiAgICAgIH0sIHRoaXMpLFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBmZXRjaGluZyB2aWRlb3MnLCByZXNwb25zZSk7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGJ1aWxkU3RydWN0dXJlKHJlc3BvbnNlKSB7XG4gICAgY29uc3QgJHBsYWNlaG9sZGVyID0gJCgnI3N1cGVyLWNvbnRhaW5lcicpO1xuXG4gICAgdGhpcy4kY29udGFpbmVyID0gJCgnPGRpdiAvPicpLmFkZENsYXNzKCdzaG93Y2FzZS1waG90b3MgdnllbHAnKTtcbiAgICB0aGlzLnZpZGVvcyA9IHJlc3BvbnNlLml0ZW1zO1xuICAgIFxuICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMudmlkZW9zLmZvckVhY2goKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgdmFyICRpdGVtID0gJChodG1sLnRodWJuYWlsSXRlbSh7XG4gICAgICAgICAgICBpOiBpICsgMSxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkLnZpZGVvSWQsXG4gICAgICAgICAgICB0aXRsZTogaXRlbS5zbmlwcGV0LnRpdGxlLFxuICAgICAgICAgICAgdGh1bWJuYWlsOiBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0sXG4gICAgICAgICAgICBjaGFubmVsVGl0bGU6IGl0ZW0uc25pcHBldC5jaGFubmVsVGl0bGUsXG4gICAgICAgICAgICBleGNlcnB0OiBpdGVtLnNuaXBwZXQudGl0bGUubGVuZ3RoID4gNTAgPyBgJHtpdGVtLnNuaXBwZXQudGl0bGUuc3Vic3RyaW5nKDAsIDUwKX0gLi4uYDogaXRlbS5zbmlwcGV0LnRpdGxlXG4gICAgICAgICAgfSkpO1xuXG4gICAgICAgIGlmIChpID4gMikge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgICRpdGVtXG4gICAgICAgICAgLmRhdGEoJ21ldGEnLCBpdGVtKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub3BlblZpZGVvLCB0aGlzKSlcblxuICAgICAgICB0aGlzLiRjb250YWluZXIuYXBwZW5kKCRpdGVtKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLiRpdGVtcyA9IHRoaXMuJGNvbnRhaW5lci5maW5kKCc+IC5qcy1waG90bycpO1xuICAgICAgdGhpcy4kY29udGFpbmVyLnByZXBlbmRUbygkcGxhY2Vob2xkZXIpO1xuXG4gICAgICAvLyBqdXN0IGFkZCBwYWdpbmF0aW9uIGJ1dHRvbnMgaWYgbmVlZGVkXG4gICAgICBpZiAodGhpcy52aWRlb3MubGVuZ3RoID4gMykge1xuICAgICAgICAvLyBhZGQgcHJldmlvdXMgYnV0dG9uIFxuICAgICAgICB0aGlzLiRwcmV2QnV0dG9uID0gJChodG1sLnByZXZCdXR0b24oKSlcbiAgICAgICAgICAub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uUGFnaW5hdGlvbkNsaWNrZWQsIHRoaXMpKVxuICAgICAgICAgIC5wcmVwZW5kVG8odGhpcy4kY29udGFpbmVyKTtcbiAgICAgICAgLy8gYWRkIG5leHQgYnV0dG9uXG4gICAgICAgIHRoaXMuJG5leHRCdXR0b24gPSAkKGh0bWwubmV4dEJ1dHRvbigpKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdpbmF0aW9uQ2xpY2tlZCwgdGhpcykpXG4gICAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIpOyAgICAgICBcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICBvcGVuVmlkZW8oZSkge1xuICAgIGxldCAkaXRlbSA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5waG90bycpLFxuICAgICAgbWV0YSA9ICRpdGVtLmRhdGEoJ21ldGEnKSxcbiAgICAgICRtb2RhbCA9ICQoaHRtbC52aWRlb01vZGFsKG1ldGEucGxheWVyLmVtYmVkSHRtbCwgbWV0YSkpO1xuXG4gICAgJG1vZGFsXG4gICAgICAuc2hvdygpXG4gICAgICAuYXBwZW5kVG8oJ2JvZHknKVxuICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5jbG9zZVZpZGVvLCB0aGlzKSlcbiAgICAgIC5maW5kKCcuanMtbW9kYWwtY2xvc2UnLCAkLnByb3h5KHRoaXMuY2xvc2VWaWRlbywgdGhpcykpXG4gIH1cblxuICBjbG9zZVZpZGVvKGUpIHtcbiAgICBpZiAoZSkge1xuICAgICAgbGV0ICR0YXJnZXQgPSAkKGUudGFyZ2V0KTtcbiAgICAgICAgXG4gICAgICBpZiAoISR0YXJnZXQuaXMoJy5qcy1tb2RhbC1jbG9zZScpICYmICEkdGFyZ2V0LmlzKCcubW9kYWwnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSAgICBcblxuICAgICQoJy52eWVscC1tb2RhbCcpLnJlbW92ZSgpO1xuICB9XG5cbiAgb25QYWdpbmF0aW9uQ2xpY2tlZChlKSB7XG4gICAgbGV0ICRidXR0b24gPSAkKGUudGFyZ2V0KSxcbiAgICAgICR2aXNpYmxlID0gdGhpcy4kaXRlbXMuZmlsdGVyKCc6dmlzaWJsZScpXG5cbiAgICBpZiAoISRidXR0b24uaXMoJ2J1dHRvbicpKSB7XG4gICAgICAkYnV0dG9uID0gJGJ1dHRvbi5jbG9zZXN0KCdidXR0b24nKTtcbiAgICB9XG5cbiAgICBpZiAoJGJ1dHRvbi5pcygnLnByZXYnKSkge1xuICAgICAgbGV0ICRwcmV2ID0gJHZpc2libGUuZmlyc3QoKS5wcmV2KCcucGhvdG8nKSxcbiAgICAgICAgJGVsZW1lbnRzID0gJHByZXYubGVuZ3RoID8gJHByZXYuYWRkKCR2aXNpYmxlKSA6ICR2aXNpYmxlO1xuXG4gICAgICAkYnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgJHByZXYucHJldkFsbCgnLnBob3RvJykubGVuZ3RoID09IDApO1xuICAgICAgdGhpcy4kbmV4dEJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goKGksIGl0ZW0pID0+IHtcbiAgICAgICAgbGV0ICRpdGVtID0gJChpdGVtKTtcblxuICAgICAgICBpZiAoaSArIDEgPT0gJGVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaXRlbVxuICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwaG90by0nICsgaSlcbiAgICAgICAgICAgIC5hZGRDbGFzcygncGhvdG8tJyArIChpICsgMSkpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCAkbmV4dCA9ICR2aXNpYmxlLmxhc3QoKS5uZXh0KCcucGhvdG8nKTtcblxuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsICRuZXh0Lm5leHRBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwKTtcbiAgICAgIHRoaXMuJHByZXZCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgICR2aXNpYmxlLmFkZCgkbmV4dCkuZWFjaCgoaSwgaXRlbSkgPT4ge1xuICAgICAgICBsZXQgJGl0ZW0gPSAkKGl0ZW0pO1xuXG4gICAgICAgIGlmICghaSkge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaXRlbVxuICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwaG90by0nICsgKGkgKyAxKSlcbiAgICAgICAgICAgIC5hZGRDbGFzcygncGhvdG8tJyArIGkpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBhbmltYXRpb24gdG8gYXBwZXIgY29tbWluZyBmcm9tIENTU1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdzaG93JylcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcygnb3ZlcmZsb3cnKTsgIFxuICAgICAgfSwgMTAwMCk7XG4gICAgfSwgMTAwMCk7XG5cbiAgICAvLyBjbG9zZSB2aWRlbyBtb2RhbCB3aGVuIGVzYyBpcyBwcmVzc2VkXG4gICAgJChkb2N1bWVudCkua2V5cHJlc3MoJC5wcm94eSgoZSkgPT4geyBcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNykgeyBcbiAgICAgICAgdGhpcy5jbG9zZVZpZGVvKCk7XG4gICAgICB9XG4gICAgfSwgdGhpcykpXG4gIH1cbn07XG5cblxuY29uc3QgaHRtbCA9IHtcbiAgdGh1Ym5haWxJdGVtOiAodmlkZW8pID0+IHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJqcy1waG90byBwaG90byBwaG90by0ke3ZpZGVvLml9XCI+XG4gICAgICAgPGRpdiBjbGFzcz1cInNob3djYXNlLXBob3RvLWJveFwiPlxuICAgICAgICAgIDxhIGhyZWY9XCIjXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOnVybCgnJHt2aWRlby50aHVtYm5haWwudXJsfScpXCI+PC9hPlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJwaG90by1ib3gtb3ZlcmxheSBqcy1vdmVybGF5XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLWJsb2NrIHBob3RvLWJveC1vdmVybGF5X2NhcHRpb25cIj5cbiAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWVkaWEtc3RvcnlcIj5cbiAgICAgICAgICAgICAgICA8YSBjbGFzcz1cInBob3RvLWRlc2NcIiBocmVmPVwiI1wiPiR7dmlkZW8uZXhjZXJwdH08L2E+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJhdXRob3JcIj5cbiAgICAgICAgICAgICAgICBieSA8YSBjbGFzcz1cInVzZXItZGlzcGxheS1uYW1lXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmNoYW5uZWxUaXRsZX08L2E+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH0sXG5cbiAgcHJldkJ1dHRvbjogKCkgPT4ge1xuICAgIHJldHVybiBgPGJ1dHRvbiBjbGFzcz1cInByZXYgeWJ0biB5YnRuLS1iaWdcIiBkaXNhYmxlZD5cbiAgICAgIDxzcGFuIGFyaWEtbGFiZWw9XCJ0ZXN0XCIgc3R5bGU9XCJ3aWR0aDogNDhweDsgaGVpZ2h0OiA0OHB4O1wiIGNsYXNzPVwiaWNvbiBpY29uLS00OC1jaGV2cm9uLWxlZnQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj5cbiAgICAgICAgICA8dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9sZWZ0XCI+PC91c2U+XG4gICAgICAgIDwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgbmV4dEJ1dHRvbjogKCkgPT4ge1xuICAgIHJldHVybiBgPGJ1dHRvbiBjbGFzcz1cIm5leHQgeWJ0biB5YnRuLS1iaWdcIj5cbiAgICAgIDxzcGFuIGFyaWEtbGFiZWw9XCJ0ZXN0XCIgc3R5bGU9XCJ3aWR0aDogNDhweDsgaGVpZ2h0OiA0OHB4O1wiIGNsYXNzPVwiaWNvbiBpY29uLS00OC1jaGV2cm9uLXJpZ2h0IGljb24tLXNpemUtNDhcIj5cbiAgICAgICAgPHN2ZyBjbGFzcz1cImljb25fc3ZnXCI+XG4gICAgICAgICAgPHVzZSB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB4bGluazpocmVmPVwiIzQ4eDQ4X2NoZXZyb25fcmlnaHRcIj48L3VzZT5cbiAgICAgICAgPC9zdmc+XG4gICAgICA8L3NwYW4+XG4gICAgPC9idXR0b24+YDtcbiAgfSxcblxuICB2aWRlb01vZGFsOiAoaWZyYW1lLCBkYXRhKSA9PiB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwibW9kYWwgbW9kYWwtLWxhcmdlIHZ5ZWxwLW1vZGFsXCIgZGF0YS1jb21wb25lbnQtYm91bmQ9XCJ0cnVlXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfaW5uZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2Nsb3NlIGpzLW1vZGFsLWNsb3NlXCI+w5c8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2RpYWxvZ1wiIHJvbGU9XCJkaWFsb2dcIj48ZGl2IGNsYXNzPVwiXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2hlYWRcIj5cbiAgICAgICAgICAgIDxoMj4ke2RhdGEuc25pcHBldC50aXRsZX08L2gyPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9ib2R5XCI+XG4gICAgICAgICAgICAke2lmcmFtZX1cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9zZWN0aW9uIHUtYmctY29sb3JcIj5cbiAgICAgICAgICAgICAgVmlkZW8gbG9hZGVkIGZyb20gVnllbHAgY2hyb21lIGV4dGVuc2lvbiFcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH1cbn07XG4iXX0=
