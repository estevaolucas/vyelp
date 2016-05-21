(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

chrome.extension.sendMessage({}, function (response) {
  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      debugger;
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
      var _this = this;

      $.ajax({
        url: YOUTUBE_API + '/search?part=snippet&type=video&location=' + this.location.latitude + ',' + this.location.longitude + '&locationRadius=10km&key=' + YOUTUBE_KEY,
        success: $.proxy(function (response) {
          var ids = response.items.map(function (item) {
            return item.id.videoId;
          }).join(',');

          $.ajax({
            url: YOUTUBE_API + '/videos?id=' + ids + '&part=snippet,player&key=' + YOUTUBE_KEY,
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

          this.preloadThumbnail(3);
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

      $modal.show().appendTo('body')
      // close modal when its overlay is clicked
      .on('click', $.proxy(this.closeVideo, this)).find('.js-modal-close', $.proxy(this.closeVideo, this));
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

          // disable/enable pagination buttons
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
      var _this4 = this;

      // animation to appear comming from CSS
      setTimeout(function () {
        _this4.$container.addClass('show');

        setTimeout(function () {
          _this4.$container.addClass('overflow');
        }, 1000);
      }, 1000);

      // close video modal when esc is pressed
      $(document).keypress($.proxy(function (e) {
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
    return '<div class="modal modal--large vyelp-modal" data-component-bound="true">\n      <div class="modal_inner">\n        <div class="modal_close js-modal-close">×</div>\n        <div class="modal_dialog" role="dialog"><div class="">\n          <div class="modal_head">\n            <h2>' + data.snippet.title + '</h2>\n          </div>\n          <div class="modal_body">\n            <iframe height="360" src="//www.youtube.com/embed/' + data.id + '?rel=0&amp;autoplay=1" frameborder="0" allowfullscreen></iframe>\n\n            <div class="modal_section u-bg-color">\n              Video loaded from Vyelp chrome extension!\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>';
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUE7QUFDQSxVQUFJLFdBQVcsS0FBSyxLQUFMLENBQVcsRUFBRSxlQUFGLEVBQW1CLENBQW5CLEVBQXNCLE9BQXRCLENBQThCLFFBQXpDLENBQWY7VUFDRSxXQUFXLFNBQVMsT0FBVCxDQUFpQixnQkFBakIsQ0FBa0MsUUFEL0M7O0FBR0EsVUFBSSxRQUFKLEVBQWM7QUFDWixZQUFJLEtBQUosQ0FBVSxRQUFWO0FBQ0Q7QUFDRjtBQUNGLEdBWjZCLEVBWTNCLEVBWjJCLENBQTlCO0FBYUQsQ0FkRDs7QUFnQkEsSUFBTSxjQUFjLHlDQUFwQjtBQUNBLElBQU0sY0FBYyx1Q0FBcEI7O0lBRU0sSztBQUNKLGlCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxXQUFMO0FBQ0Q7Ozs7a0NBRWE7QUFBQTs7QUFDWixRQUFFLElBQUYsQ0FBTztBQUNMLGFBQVEsV0FBUixpREFBK0QsS0FBSyxRQUFMLENBQWMsUUFBN0UsU0FBeUYsS0FBSyxRQUFMLENBQWMsU0FBdkcsaUNBQTRJLFdBRHZJO0FBRUwsaUJBQVMsRUFBRSxLQUFGLENBQVEsVUFBQyxRQUFELEVBQWM7QUFDN0IsY0FBSSxNQUFNLFNBQVMsS0FBVCxDQUFlLEdBQWYsQ0FBbUIsVUFBQyxJQUFELEVBQVU7QUFDbkMsbUJBQU8sS0FBSyxFQUFMLENBQVEsT0FBZjtBQUNELFdBRk8sRUFFTCxJQUZLLENBRUEsR0FGQSxDQUFWOztBQUlBLFlBQUUsSUFBRixDQUFPO0FBQ0wsaUJBQVEsV0FBUixtQkFBaUMsR0FBakMsaUNBQWdFLFdBRDNEO0FBRUwscUJBQVMsRUFBRSxLQUFGLENBQVEsTUFBSyxjQUFiO0FBRkosV0FBUDtBQUlELFNBVFEsRUFTTixJQVRNLENBRko7QUFZTCxlQUFPLGVBQVMsUUFBVCxFQUFtQjtBQUN4QixrQkFBUSxHQUFSLENBQVksdUJBQVosRUFBcUMsUUFBckM7QUFDRDtBQWRJLE9BQVA7QUFnQkQ7OzttQ0FFYyxRLEVBQVU7QUFBQTs7QUFDdkIsVUFBTSxlQUFlLEVBQUUsa0JBQUYsQ0FBckI7O0FBRUEsV0FBSyxVQUFMLEdBQWtCLEVBQUUsU0FBRixFQUFhLFFBQWIsQ0FBc0IsdUJBQXRCLENBQWxCO0FBQ0EsV0FBSyxNQUFMLEdBQWMsU0FBUyxLQUF2Qjs7QUFFQSxVQUFJLEtBQUssTUFBTCxDQUFZLE1BQWhCLEVBQXdCO0FBQ3RCLGFBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsVUFBQyxJQUFELEVBQU8sQ0FBUCxFQUFhO0FBQy9CLGNBQUksUUFBUSxFQUFFLEtBQUssWUFBTCxDQUFrQjtBQUM1QixlQUFHLElBQUksQ0FEcUI7QUFFNUIsZ0JBQUksS0FBSyxFQUFMLENBQVEsT0FGZ0I7QUFHNUIsbUJBQU8sS0FBSyxPQUFMLENBQWEsS0FIUTtBQUk1Qix1QkFBVyxLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQXdCLE1BSlA7QUFLNUIsMEJBQWMsS0FBSyxPQUFMLENBQWEsWUFMQztBQU01QixxQkFBUyxLQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLE1BQW5CLEdBQTRCLEVBQTVCLEdBQW9DLEtBQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsU0FBbkIsQ0FBNkIsQ0FBN0IsRUFBZ0MsRUFBaEMsQ0FBcEMsWUFBK0UsS0FBSyxPQUFMLENBQWE7QUFOekUsV0FBbEIsQ0FBRixDQUFaOztBQVNBLGNBQUksSUFBSSxDQUFSLEVBQVc7QUFDVCxrQkFBTSxJQUFOO0FBQ0Q7O0FBRUQsZ0JBQ0csSUFESCxDQUNRLE1BRFIsRUFDZ0IsSUFEaEIsRUFFRyxFQUZILENBRU0sT0FGTixFQUVlLEVBQUUsS0FBRixDQUFRLE9BQUssU0FBYixTQUZmOztBQUlBLGlCQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBdUIsS0FBdkI7QUFDRCxTQW5CRDs7QUFxQkEsYUFBSyxNQUFMLEdBQWMsS0FBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLGFBQXJCLENBQWQ7QUFDQSxhQUFLLFVBQUwsQ0FBZ0IsU0FBaEIsQ0FBMEIsWUFBMUI7OztBQUdBLFlBQUksS0FBSyxNQUFMLENBQVksTUFBWixHQUFxQixDQUF6QixFQUE0Qjs7QUFFMUIsZUFBSyxXQUFMLEdBQW1CLEVBQUUsS0FBSyxVQUFMLEVBQUYsRUFDaEIsRUFEZ0IsQ0FDYixPQURhLEVBQ0osRUFBRSxLQUFGLENBQVEsS0FBSyxtQkFBYixFQUFrQyxJQUFsQyxDQURJLEVBRWhCLFNBRmdCLENBRU4sS0FBSyxVQUZDLENBQW5COztBQUlBLGVBQUssV0FBTCxHQUFtQixFQUFFLEtBQUssVUFBTCxFQUFGLEVBQ2hCLEVBRGdCLENBQ2IsT0FEYSxFQUNKLEVBQUUsS0FBRixDQUFRLEtBQUssbUJBQWIsRUFBa0MsSUFBbEMsQ0FESSxFQUVoQixTQUZnQixDQUVOLEtBQUssVUFGQyxDQUFuQjs7QUFJQSxlQUFLLGdCQUFMLENBQXNCLENBQXRCO0FBQ0Q7O0FBRUQsYUFBSyxNQUFMO0FBQ0Q7QUFDRjs7OzhCQUVTLEMsRUFBRztBQUNYLFVBQUksUUFBUSxFQUFFLEVBQUUsTUFBSixFQUFZLE9BQVosQ0FBb0IsUUFBcEIsQ0FBWjtVQUNFLE9BQU8sTUFBTSxJQUFOLENBQVcsTUFBWCxDQURUO1VBRUUsU0FBUyxFQUFFLEtBQUssVUFBTCxDQUFnQixLQUFLLE1BQUwsQ0FBWSxTQUE1QixFQUF1QyxJQUF2QyxDQUFGLENBRlg7O0FBSUEsYUFDRyxJQURILEdBRUcsUUFGSCxDQUVZLE1BRlo7O0FBQUEsT0FJRyxFQUpILENBSU0sT0FKTixFQUllLEVBQUUsS0FBRixDQUFRLEtBQUssVUFBYixFQUF5QixJQUF6QixDQUpmLEVBS0csSUFMSCxDQUtRLGlCQUxSLEVBSzJCLEVBQUUsS0FBRixDQUFRLEtBQUssVUFBYixFQUF5QixJQUF6QixDQUwzQjtBQU1EOzs7K0JBRVUsQyxFQUFHO0FBQ1osVUFBSSxDQUFKLEVBQU87QUFDTCxZQUFJLFVBQVUsRUFBRSxFQUFFLE1BQUosQ0FBZDs7QUFFQSxZQUFJLENBQUMsUUFBUSxFQUFSLENBQVcsaUJBQVgsQ0FBRCxJQUFrQyxDQUFDLFFBQVEsRUFBUixDQUFXLFFBQVgsQ0FBdkMsRUFBNkQ7QUFDM0Q7QUFDRDtBQUNGOztBQUVELFFBQUUsY0FBRixFQUFrQixNQUFsQjtBQUNEOzs7d0NBRW1CLEMsRUFBRztBQUFBOztBQUNyQixVQUFJLFVBQVUsRUFBRSxFQUFFLE1BQUosQ0FBZDtVQUNFLFdBQVcsS0FBSyxNQUFMLENBQVksTUFBWixDQUFtQixVQUFuQixDQURiOztBQUdBLFVBQUksQ0FBQyxRQUFRLEVBQVIsQ0FBVyxRQUFYLENBQUwsRUFBMkI7QUFDekIsa0JBQVUsUUFBUSxPQUFSLENBQWdCLFFBQWhCLENBQVY7QUFDRDs7QUFFRCxVQUFJLFFBQVEsRUFBUixDQUFXLE9BQVgsQ0FBSixFQUF5QjtBQUFBO0FBQ3ZCLGNBQUksUUFBUSxTQUFTLEtBQVQsR0FBaUIsSUFBakIsQ0FBc0IsUUFBdEIsQ0FBWjtjQUNFLFlBQVksTUFBTSxNQUFOLEdBQWUsTUFBTSxHQUFOLENBQVUsUUFBVixDQUFmLEdBQXFDLFFBRG5EOzs7QUFJQSxrQkFBUSxJQUFSLENBQWEsVUFBYixFQUF5QixNQUFNLE9BQU4sQ0FBYyxRQUFkLEVBQXdCLE1BQXhCLElBQWtDLENBQTNEO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixJQUFqQixDQUFzQixVQUF0QixFQUFrQyxLQUFsQzs7QUFFQSxvQkFBVSxJQUFWLENBQWUsVUFBQyxDQUFELEVBQUksSUFBSixFQUFhO0FBQzFCLGdCQUFJLFFBQVEsRUFBRSxJQUFGLENBQVo7O0FBRUEsZ0JBQUksSUFBSSxDQUFKLElBQVMsVUFBVSxNQUF2QixFQUErQjtBQUM3QixvQkFBTSxJQUFOO0FBQ0QsYUFGRCxNQUVPO0FBQ0wsb0JBQ0csSUFESCxHQUVHLFdBRkgsQ0FFZSxXQUFXLENBRjFCLEVBR0csUUFISCxDQUdZLFlBQVksSUFBSSxDQUFoQixDQUhaO0FBSUQ7QUFDRixXQVhEO0FBUnVCO0FBcUJ4QixPQXJCRCxNQXFCTztBQUNMLFlBQUksUUFBUSxTQUFTLElBQVQsR0FBZ0IsSUFBaEIsQ0FBcUIsUUFBckIsQ0FBWjtZQUNFLGNBQWMsTUFBTSxPQUFOLENBQWMsUUFBZCxFQUF3QixNQUF4QixJQUFrQyxDQURsRDs7O0FBSUEsZ0JBQVEsSUFBUixDQUFhLFVBQWIsRUFBeUIsV0FBekI7QUFDQSxhQUFLLFdBQUwsQ0FBaUIsSUFBakIsQ0FBc0IsVUFBdEIsRUFBa0MsS0FBbEM7OztBQUdBLFlBQUksQ0FBQyxXQUFMLEVBQWtCO0FBQ2hCLGNBQUksaUJBQWlCLE1BQU0sSUFBTixDQUFXLFFBQVgsQ0FBckI7O0FBRUEsZUFBSyxnQkFBTCxDQUFzQixLQUFLLE1BQUwsQ0FBWSxLQUFaLENBQWtCLGNBQWxCLENBQXRCO0FBQ0Q7O0FBRUQsaUJBQVMsR0FBVCxDQUFhLEtBQWIsRUFBb0IsSUFBcEIsQ0FBeUIsVUFBQyxDQUFELEVBQUksSUFBSixFQUFhO0FBQ3BDLGNBQUksUUFBUSxFQUFFLElBQUYsQ0FBWjs7QUFFQSxjQUFJLENBQUMsQ0FBTCxFQUFRO0FBQ04sa0JBQU0sSUFBTjtBQUNELFdBRkQsTUFFTztBQUNMLGtCQUNHLElBREgsR0FFRyxXQUZILENBRWUsWUFBWSxJQUFJLENBQWhCLENBRmYsRUFHRyxRQUhILENBR1ksV0FBVyxDQUh2QjtBQUlEO0FBQ0YsU0FYRDtBQVlEO0FBQ0Y7Ozs7OztxQ0FHZ0IsSyxFQUFPO0FBQ3RCLFVBQUksT0FBTyxLQUFLLE1BQUwsQ0FBWSxLQUFaLENBQVg7VUFDRSxNQUFNLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsTUFBeEIsQ0FBK0IsR0FEdkM7VUFFRSxRQUFRLElBQUksS0FBSixFQUZWOztBQUlBLFlBQU0sR0FBTixHQUFZLEdBQVo7QUFDQSxZQUFNLE1BQU4sR0FBZTtBQUFBLGVBQU0sUUFBUSxHQUFSLENBQWUsR0FBZixnQkFBTjtBQUFBLE9BQWY7QUFDRDs7OzZCQUVRO0FBQUE7OztBQUVQLGlCQUFXLFlBQU07QUFDZixlQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsQ0FBeUIsTUFBekI7O0FBRUEsbUJBQVcsWUFBTTtBQUNmLGlCQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsQ0FBeUIsVUFBekI7QUFDRCxTQUZELEVBRUcsSUFGSDtBQUdELE9BTkQsRUFNRyxJQU5IOzs7QUFTQSxRQUFFLFFBQUYsRUFBWSxRQUFaLENBQXFCLEVBQUUsS0FBRixDQUFRLFVBQUMsQ0FBRCxFQUFPO0FBQ2xDLFlBQUksRUFBRSxPQUFGLElBQWEsRUFBakIsRUFBcUI7QUFDbkIsaUJBQUssVUFBTDtBQUNEO0FBQ0YsT0FKb0IsRUFJbEIsSUFKa0IsQ0FBckI7QUFLRDs7Ozs7O0FBQ0Y7O0FBR0QsSUFBTSxPQUFPO0FBQ1gsZ0JBQWMsc0JBQUMsS0FBRCxFQUFXO0FBQ3ZCLGlEQUEyQyxNQUFNLENBQWpELHlHQUVpRCxNQUFNLFNBQU4sQ0FBZ0IsR0FGakUsMk9BTzZDLE1BQU0sT0FQbkQsOEdBU3VELE1BQU0sWUFUN0Q7QUFlRCxHQWpCVTs7QUFtQlgsY0FBWSxzQkFBTTtBQUNoQjtBQU9ELEdBM0JVOztBQTZCWCxjQUFZLHNCQUFNO0FBQ2hCO0FBT0QsR0FyQ1U7O0FBdUNYLGNBQVksb0JBQUMsTUFBRCxFQUFTLElBQVQsRUFBa0I7QUFDNUIsd1NBS2MsS0FBSyxPQUFMLENBQWEsS0FMM0IsbUlBUTRELEtBQUssRUFSakU7QUFpQkQ7QUF6RFUsQ0FBYiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjaHJvbWUuZXh0ZW5zaW9uLnNlbmRNZXNzYWdlKHt9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICB2YXIgcmVhZHlTdGF0ZUNoZWNrSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICBjbGVhckludGVydmFsKHJlYWR5U3RhdGVDaGVja0ludGVydmFsKTtcblxuICAgICAgZGVidWdnZXI7XG4gICAgICBsZXQgbWV0YWRhdGEgPSBKU09OLnBhcnNlKCQoJy5saWdodGJveC1tYXAnKVswXS5kYXRhc2V0Lm1hcFN0YXRlKSxcbiAgICAgICAgbG9jYXRpb24gPSBtZXRhZGF0YS5tYXJrZXJzLnN0YXJyZWRfYnVzaW5lc3MubG9jYXRpb247XG5cbiAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICBuZXcgVnllbHAobG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgMTApO1xufSk7IFxuXG5jb25zdCBZT1VUVUJFX0tFWSA9ICdBSXphU3lDYUtKQnlCLTdqSllfMkUzYm95Sjc4cDBKdjhvZXVyaUknO1xuY29uc3QgWU9VVFVCRV9BUEkgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20veW91dHViZS92Myc7XG5cbmNsYXNzIFZ5ZWxwIHtcbiAgY29uc3RydWN0b3IobG9jYXRpb24pIHtcbiAgICB0aGlzLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgdGhpcy5mZXRjaFZpZGVvcygpO1xuICB9XG5cbiAgZmV0Y2hWaWRlb3MoKSB7XG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogYCR7WU9VVFVCRV9BUEl9L3NlYXJjaD9wYXJ0PXNuaXBwZXQmdHlwZT12aWRlbyZsb2NhdGlvbj0ke3RoaXMubG9jYXRpb24ubGF0aXR1ZGV9LCR7dGhpcy5sb2NhdGlvbi5sb25naXR1ZGV9JmxvY2F0aW9uUmFkaXVzPTEwa20ma2V5PSR7WU9VVFVCRV9LRVl9YCxcbiAgICAgIHN1Y2Nlc3M6ICQucHJveHkoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGxldCBpZHMgPSByZXNwb25zZS5pdGVtcy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmlkLnZpZGVvSWQ7XG4gICAgICAgICAgfSkuam9pbignLCcpO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdXJsOiBgJHtZT1VUVUJFX0FQSX0vdmlkZW9zP2lkPSR7aWRzfSZwYXJ0PXNuaXBwZXQscGxheWVyJmtleT0ke1lPVVRVQkVfS0VZfWAsXG4gICAgICAgICAgc3VjY2VzczogJC5wcm94eSh0aGlzLmJ1aWxkU3RydWN0dXJlLCB0aGlzKVxuICAgICAgICB9KVxuICAgICAgfSwgdGhpcyksXG4gICAgICBlcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGZldGNoaW5nIHZpZGVvcycsIHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYnVpbGRTdHJ1Y3R1cmUocmVzcG9uc2UpIHtcbiAgICBjb25zdCAkcGxhY2Vob2xkZXIgPSAkKCcjc3VwZXItY29udGFpbmVyJyk7XG5cbiAgICB0aGlzLiRjb250YWluZXIgPSAkKCc8ZGl2IC8+JykuYWRkQ2xhc3MoJ3Nob3djYXNlLXBob3RvcyB2eWVscCcpO1xuICAgIHRoaXMudmlkZW9zID0gcmVzcG9uc2UuaXRlbXM7XG4gICAgXG4gICAgaWYgKHRoaXMudmlkZW9zLmxlbmd0aCkge1xuICAgICAgdGhpcy52aWRlb3MuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICB2YXIgJGl0ZW0gPSAkKGh0bWwudGh1Ym5haWxJdGVtKHtcbiAgICAgICAgICAgIGk6IGkgKyAxLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWQudmlkZW9JZCxcbiAgICAgICAgICAgIHRpdGxlOiBpdGVtLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICB0aHVtYm5haWw6IGl0ZW0uc25pcHBldC50aHVtYm5haWxzLm1lZGl1bSxcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogaXRlbS5zbmlwcGV0LmNoYW5uZWxUaXRsZSxcbiAgICAgICAgICAgIGV4Y2VycHQ6IGl0ZW0uc25pcHBldC50aXRsZS5sZW5ndGggPiA1MCA/IGAke2l0ZW0uc25pcHBldC50aXRsZS5zdWJzdHJpbmcoMCwgNTApfSAuLi5gOiBpdGVtLnNuaXBwZXQudGl0bGVcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKGkgPiAyKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuZGF0YSgnbWV0YScsIGl0ZW0pXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vcGVuVmlkZW8sIHRoaXMpKVxuXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hcHBlbmQoJGl0ZW0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuJGl0ZW1zID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJz4gLmpzLXBob3RvJyk7XG4gICAgICB0aGlzLiRjb250YWluZXIucHJlcGVuZFRvKCRwbGFjZWhvbGRlcik7XG5cbiAgICAgIC8vIGp1c3QgYWRkIHBhZ2luYXRpb24gYnV0dG9ucyBpZiBuZWVkZWRcbiAgICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGggPiAzKSB7XG4gICAgICAgIC8vIGFkZCBwcmV2aW91cyBidXR0b24gXG4gICAgICAgIHRoaXMuJHByZXZCdXR0b24gPSAkKGh0bWwucHJldkJ1dHRvbigpKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdpbmF0aW9uQ2xpY2tlZCwgdGhpcykpXG4gICAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIpO1xuICAgICAgICAvLyBhZGQgbmV4dCBidXR0b25cbiAgICAgICAgdGhpcy4kbmV4dEJ1dHRvbiA9ICQoaHRtbC5uZXh0QnV0dG9uKCkpXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2luYXRpb25DbGlja2VkLCB0aGlzKSlcbiAgICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lcik7ICAgICAgIFxuXG4gICAgICAgIHRoaXMucHJlbG9hZFRodW1ibmFpbCgzKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICBvcGVuVmlkZW8oZSkge1xuICAgIGxldCAkaXRlbSA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5waG90bycpLFxuICAgICAgbWV0YSA9ICRpdGVtLmRhdGEoJ21ldGEnKSxcbiAgICAgICRtb2RhbCA9ICQoaHRtbC52aWRlb01vZGFsKG1ldGEucGxheWVyLmVtYmVkSHRtbCwgbWV0YSkpO1xuXG4gICAgJG1vZGFsXG4gICAgICAuc2hvdygpXG4gICAgICAuYXBwZW5kVG8oJ2JvZHknKVxuICAgICAgLy8gY2xvc2UgbW9kYWwgd2hlbiBpdHMgb3ZlcmxheSBpcyBjbGlja2VkXG4gICAgICAub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmNsb3NlVmlkZW8sIHRoaXMpKVxuICAgICAgLmZpbmQoJy5qcy1tb2RhbC1jbG9zZScsICQucHJveHkodGhpcy5jbG9zZVZpZGVvLCB0aGlzKSlcbiAgfVxuXG4gIGNsb3NlVmlkZW8oZSkge1xuICAgIGlmIChlKSB7XG4gICAgICBsZXQgJHRhcmdldCA9ICQoZS50YXJnZXQpO1xuICAgICAgICBcbiAgICAgIGlmICghJHRhcmdldC5pcygnLmpzLW1vZGFsLWNsb3NlJykgJiYgISR0YXJnZXQuaXMoJy5tb2RhbCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9ICAgIFxuXG4gICAgJCgnLnZ5ZWxwLW1vZGFsJykucmVtb3ZlKCk7XG4gIH1cblxuICBvblBhZ2luYXRpb25DbGlja2VkKGUpIHtcbiAgICBsZXQgJGJ1dHRvbiA9ICQoZS50YXJnZXQpLFxuICAgICAgJHZpc2libGUgPSB0aGlzLiRpdGVtcy5maWx0ZXIoJzp2aXNpYmxlJylcblxuICAgIGlmICghJGJ1dHRvbi5pcygnYnV0dG9uJykpIHtcbiAgICAgICRidXR0b24gPSAkYnV0dG9uLmNsb3Nlc3QoJ2J1dHRvbicpO1xuICAgIH1cblxuICAgIGlmICgkYnV0dG9uLmlzKCcucHJldicpKSB7XG4gICAgICBsZXQgJHByZXYgPSAkdmlzaWJsZS5maXJzdCgpLnByZXYoJy5waG90bycpLFxuICAgICAgICAkZWxlbWVudHMgPSAkcHJldi5sZW5ndGggPyAkcHJldi5hZGQoJHZpc2libGUpIDogJHZpc2libGU7XG5cbiAgICAgIC8vIGRpc2FibGUvZW5hYmxlIHBhZ2luYXRpb24gYnV0dG9uc1xuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsICRwcmV2LnByZXZBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwKTtcbiAgICAgIHRoaXMuJG5leHRCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKChpLCBpdGVtKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSA9ICQoaXRlbSk7XG5cbiAgICAgICAgaWYgKGkgKyAxID09ICRlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAkaXRlbS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGl0ZW1cbiAgICAgICAgICAgIC5zaG93KClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncGhvdG8tJyArIGkpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bob3RvLScgKyAoaSArIDEpKTtcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgJG5leHQgPSAkdmlzaWJsZS5sYXN0KCkubmV4dCgnLnBob3RvJyksXG4gICAgICAgIGlzVG9EaXNhYmxlID0gJG5leHQubmV4dEFsbCgnLnBob3RvJykubGVuZ3RoID09IDA7XG5cbiAgICAgIC8vIGRpc2FibGUvZW5hYmxlIHBhZ2luYXRpb24gYnV0dG9uc1xuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGlzVG9EaXNhYmxlKTtcbiAgICAgIHRoaXMuJHByZXZCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgIC8vIHByZWxvYWQgbmV4dCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIG9uIG5leHQgcGFnaW5hdGlvblxuICAgICAgaWYgKCFpc1RvRGlzYWJsZSkge1xuICAgICAgICBsZXQgJG5leHRUb1ByZWxvYWQgPSAkbmV4dC5uZXh0KCcucGhvdG8nKTtcblxuICAgICAgICB0aGlzLnByZWxvYWRUaHVtYm5haWwodGhpcy4kaXRlbXMuaW5kZXgoJG5leHRUb1ByZWxvYWQpKTtcbiAgICAgIH1cblxuICAgICAgJHZpc2libGUuYWRkKCRuZXh0KS5lYWNoKChpLCBpdGVtKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSA9ICQoaXRlbSk7XG5cbiAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRpdGVtXG4gICAgICAgICAgICAuc2hvdygpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3Bob3RvLScgKyAoaSArIDEpKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdwaG90by0nICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8gcHJlbG9hZCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIGluIHBhZ2luYXRpb24gdHJhc2l0aW9uXG4gIHByZWxvYWRUaHVtYm5haWwoaW5kZXgpIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudmlkZW9zW2luZGV4XSwgXG4gICAgICB1cmwgPSBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0udXJsLFxuICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBjb25zb2xlLmxvZyhgJHt1cmx9IHByZWxvYWRlZGApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIGFuaW1hdGlvbiB0byBhcHBlYXIgY29tbWluZyBmcm9tIENTU1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdzaG93JylcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcygnb3ZlcmZsb3cnKTsgIFxuICAgICAgfSwgMTAwMCk7XG4gICAgfSwgMTAwMCk7XG5cbiAgICAvLyBjbG9zZSB2aWRlbyBtb2RhbCB3aGVuIGVzYyBpcyBwcmVzc2VkXG4gICAgJChkb2N1bWVudCkua2V5cHJlc3MoJC5wcm94eSgoZSkgPT4geyBcbiAgICAgIGlmIChlLmtleUNvZGUgPT0gMjcpIHsgXG4gICAgICAgIHRoaXMuY2xvc2VWaWRlbygpO1xuICAgICAgfVxuICAgIH0sIHRoaXMpKVxuICB9XG59O1xuXG5cbmNvbnN0IGh0bWwgPSB7XG4gIHRodWJuYWlsSXRlbTogKHZpZGVvKSA9PiB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwianMtcGhvdG8gcGhvdG8gcGhvdG8tJHt2aWRlby5pfVwiPlxuICAgICAgIDxkaXYgY2xhc3M9XCJzaG93Y2FzZS1waG90by1ib3hcIj5cbiAgICAgICAgICA8YSBocmVmPVwiI1wiIHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTp1cmwoJyR7dmlkZW8udGh1bWJuYWlsLnVybH0nKVwiPjwvYT5cbiAgICAgICA8L2Rpdj5cbiAgICAgICA8ZGl2IGNsYXNzPVwicGhvdG8tYm94LW92ZXJsYXkganMtb3ZlcmxheVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZWRpYS1ibG9jayBwaG90by1ib3gtb3ZlcmxheV9jYXB0aW9uXCI+XG4gICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLXN0b3J5XCI+XG4gICAgICAgICAgICAgICAgPGEgY2xhc3M9XCJwaG90by1kZXNjXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmV4Y2VycHR9PC9hPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYXV0aG9yXCI+XG4gICAgICAgICAgICAgICAgYnkgPGEgY2xhc3M9XCJ1c2VyLWRpc3BsYXktbmFtZVwiIGhyZWY9XCIjXCI+JHt2aWRlby5jaGFubmVsVGl0bGV9PC9hPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9LFxuXG4gIHByZXZCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJwcmV2IHlidG4geWJ0bi0tYmlnXCIgZGlzYWJsZWQ+XG4gICAgICA8c3BhbiBhcmlhLWxhYmVsPVwidGVzdFwiIHN0eWxlPVwid2lkdGg6IDQ4cHg7IGhlaWdodDogNDhweDtcIiBjbGFzcz1cImljb24gaWNvbi0tNDgtY2hldnJvbi1sZWZ0IGljb24tLXNpemUtNDhcIj5cbiAgICAgICAgPHN2ZyBjbGFzcz1cImljb25fc3ZnXCI+XG4gICAgICAgICAgPHVzZSB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB4bGluazpocmVmPVwiIzQ4eDQ4X2NoZXZyb25fbGVmdFwiPjwvdXNlPlxuICAgICAgICA8L3N2Zz5cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2J1dHRvbj5gO1xuICB9LFxuXG4gIG5leHRCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJuZXh0IHlidG4geWJ0bi0tYmlnXCI+XG4gICAgICA8c3BhbiBhcmlhLWxhYmVsPVwidGVzdFwiIHN0eWxlPVwid2lkdGg6IDQ4cHg7IGhlaWdodDogNDhweDtcIiBjbGFzcz1cImljb24gaWNvbi0tNDgtY2hldnJvbi1yaWdodCBpY29uLS1zaXplLTQ4XCI+XG4gICAgICAgIDxzdmcgY2xhc3M9XCJpY29uX3N2Z1wiPlxuICAgICAgICAgIDx1c2UgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeGxpbms6aHJlZj1cIiM0OHg0OF9jaGV2cm9uX3JpZ2h0XCI+PC91c2U+XG4gICAgICAgIDwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgdmlkZW9Nb2RhbDogKGlmcmFtZSwgZGF0YSkgPT4ge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIm1vZGFsIG1vZGFsLS1sYXJnZSB2eWVscC1tb2RhbFwiIGRhdGEtY29tcG9uZW50LWJvdW5kPVwidHJ1ZVwiPlxuICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2lubmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9jbG9zZSBqcy1tb2RhbC1jbG9zZVwiPsOXPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9kaWFsb2dcIiByb2xlPVwiZGlhbG9nXCI+PGRpdiBjbGFzcz1cIlwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9oZWFkXCI+XG4gICAgICAgICAgICA8aDI+JHtkYXRhLnNuaXBwZXQudGl0bGV9PC9oMj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfYm9keVwiPlxuICAgICAgICAgICAgPGlmcmFtZSBoZWlnaHQ9XCIzNjBcIiBzcmM9XCIvL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8ke2RhdGEuaWR9P3JlbD0wJmFtcDthdXRvcGxheT0xXCIgZnJhbWVib3JkZXI9XCIwXCIgYWxsb3dmdWxsc2NyZWVuPjwvaWZyYW1lPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfc2VjdGlvbiB1LWJnLWNvbG9yXCI+XG4gICAgICAgICAgICAgIFZpZGVvIGxvYWRlZCBmcm9tIFZ5ZWxwIGNocm9tZSBleHRlbnNpb24hXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG59O1xuIl19
