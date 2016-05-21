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
        var $next = $visible.last().next('.photo'),
            isToDisable = $next.nextAll('.photo').length == 0;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLDBDQUFwQjs7SUFFTSxLO0FBQ0osaUJBQVksUUFBWixFQUFzQjtBQUFBOztBQUNwQixTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxTQUFLLFNBQUwsR0FBaUIsdUNBQWpCOztBQUVBLFNBQUssV0FBTDtBQUNEOzs7O2tDQUVhO0FBQUE7O0FBQ1osUUFBRSxJQUFGLENBQU87QUFDTCxhQUFRLEtBQUssU0FBYixpREFBa0UsS0FBSyxRQUFMLENBQWMsUUFBaEYsU0FBNEYsS0FBSyxRQUFMLENBQWMsU0FBMUcsaUNBQStJLFdBRDFJO0FBRUwsaUJBQVMsRUFBRSxLQUFGLENBQVEsVUFBQyxRQUFELEVBQWM7QUFDN0IsY0FBSSxNQUFNLFNBQVMsS0FBVCxDQUFlLEdBQWYsQ0FBbUIsVUFBQyxJQUFELEVBQVU7QUFDbkMsbUJBQU8sS0FBSyxFQUFMLENBQVEsT0FBZjtBQUNE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QUFRLElBQUksS0FBSixFQUZWOztBQUlBLFlBQU0sR0FBTixHQUFZLEdBQVo7QUFDQSxZQUFNLE1BQU4sR0FBZTtBQUFBLGVBQU0sUUFBUSxHQUFSLENBQWUsR0FBZixnQkFBTjtBQUFBLE9BQWY7QUFDRDs7OzZCQUVRO0FBQUE7OztBQUVQLGlCQUFXLFlBQU07QUFDZixlQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsQ0FBeUIsTUFBekI7O0FBRUEsbUJBQVcsWUFBTTtBQUNmLGlCQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsQ0FBeUIsVUFBekI7QUFDRCxTQUZELEVBRUcsSUFGSDtBQUdELE9BTkQsRUFNRyxJQU5IOzs7QUFTQSxRQUFFLFFBQUYsRUFBWSxRQUFaLENBQXFCLEVBQUUsS0FBRixDQUFRLFVBQUMsQ0FBRCxFQUFPO0FBQ2xDO0FBQ0EsWUFBSSxFQUFFLE9BQUYsSUFBYSxFQUFqQixFQUFxQjtBQUNuQixpQkFBSyxVQUFMO0FBQ0Q7QUFDRixPQUxvQixFQUtsQixJQUxrQixDQUFyQjtBQU1EOzs7Ozs7QUFDRjs7QUFHRCxJQUFNLE9BQU87QUFDWCxnQkFBYyxzQkFBQyxLQUFELEVBQVc7QUFDdkIsaURBQTJDLE1BQU0sQ0FBakQseUdBRWlELE1BQU0sU0FBTixDQUFnQixHQUZqRSwyT0FPNkMsTUFBTSxPQVBuRCw4R0FTdUQsTUFBTSxZQVQ3RDtBQWVELEdBakJVOztBQW1CWCxjQUFZLHNCQUFNO0FBQ2hCO0FBT0QsR0EzQlU7O0FBNkJYLGNBQVksc0JBQU07QUFDaEI7QUFPRCxHQXJDVTs7QUF1Q1gsY0FBWSxvQkFBQyxNQUFELEVBQVMsSUFBVCxFQUFrQjtBQUM1Qix3U0FLYyxLQUFLLE9BQUwsQ0FBYSxLQUwzQixpRkFRVSxNQVJWO0FBZ0JEO0FBeERVLENBQWIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY2hyb21lLmV4dGVuc2lvbi5zZW5kTWVzc2FnZSh7fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgdmFyIHJlYWR5U3RhdGVDaGVja0ludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgY2xlYXJJbnRlcnZhbChyZWFkeVN0YXRlQ2hlY2tJbnRlcnZhbCk7XG5cbiAgICAgIGxldCBtZXRhZGF0YSA9IEpTT04ucGFyc2UoJCgnLmxpZ2h0Ym94LW1hcCcpWzBdLmRhdGFzZXQubWFwU3RhdGUpLFxuICAgICAgICBsb2NhdGlvbiA9IG1ldGFkYXRhLm1hcmtlcnMuc3RhcnJlZF9idXNpbmVzcy5sb2NhdGlvbjtcblxuICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgIG5ldyBWeWVscChsb2NhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9LCAxMCk7XG59KTsgXG5cbmNvbnN0IFlPVVRVQkVfS0VZID0gJyBBSXphU3lDYUtKQnlCLTdqSllfMkUzYm95Sjc4cDBKdjhvZXVyaUknO1xuXG5jbGFzcyBWeWVscCB7XG4gIGNvbnN0cnVjdG9yKGxvY2F0aW9uKSB7XG4gICAgdGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgIHRoaXMuYmFzZVlUQXBpID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3lvdXR1YmUvdjMnO1xuXG4gICAgdGhpcy5mZXRjaFZpZGVvcygpO1xuICB9XG5cbiAgZmV0Y2hWaWRlb3MoKSB7XG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogYCR7dGhpcy5iYXNlWVRBcGl9L3NlYXJjaD9wYXJ0PXNuaXBwZXQmdHlwZT12aWRlbyZsb2NhdGlvbj0ke3RoaXMubG9jYXRpb24ubGF0aXR1ZGV9LCR7dGhpcy5sb2NhdGlvbi5sb25naXR1ZGV9JmxvY2F0aW9uUmFkaXVzPTEwa20ma2V5PSR7WU9VVFVCRV9LRVl9YCxcbiAgICAgIHN1Y2Nlc3M6ICQucHJveHkoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGxldCBpZHMgPSByZXNwb25zZS5pdGVtcy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmlkLnZpZGVvSWQ7XG4gICAgICAgICAgfSkuam9pbignLCcpO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdXJsOiBgJHt0aGlzLmJhc2VZVEFwaX0vdmlkZW9zP2lkPSR7aWRzfSZwYXJ0PXNuaXBwZXQscGxheWVyJmtleT0ke1lPVVRVQkVfS0VZfWAsXG4gICAgICAgICAgc3VjY2VzczogJC5wcm94eSh0aGlzLmJ1aWxkU3RydWN0dXJlLCB0aGlzKVxuICAgICAgICB9KVxuICAgICAgfSwgdGhpcyksXG4gICAgICBlcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGZldGNoaW5nIHZpZGVvcycsIHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYnVpbGRTdHJ1Y3R1cmUocmVzcG9uc2UpIHtcbiAgICBjb25zdCAkcGxhY2Vob2xkZXIgPSAkKCcjc3VwZXItY29udGFpbmVyJyk7XG5cbiAgICB0aGlzLiRjb250YWluZXIgPSAkKCc8ZGl2IC8+JykuYWRkQ2xhc3MoJ3Nob3djYXNlLXBob3RvcyB2eWVscCcpO1xuICAgIHRoaXMudmlkZW9zID0gcmVzcG9uc2UuaXRlbXM7XG4gICAgXG4gICAgaWYgKHRoaXMudmlkZW9zLmxlbmd0aCkge1xuICAgICAgdGhpcy52aWRlb3MuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICB2YXIgJGl0ZW0gPSAkKGh0bWwudGh1Ym5haWxJdGVtKHtcbiAgICAgICAgICAgIGk6IGkgKyAxLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWQudmlkZW9JZCxcbiAgICAgICAgICAgIHRpdGxlOiBpdGVtLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICB0aHVtYm5haWw6IGl0ZW0uc25pcHBldC50aHVtYm5haWxzLm1lZGl1bSxcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogaXRlbS5zbmlwcGV0LmNoYW5uZWxUaXRsZSxcbiAgICAgICAgICAgIGV4Y2VycHQ6IGl0ZW0uc25pcHBldC50aXRsZS5sZW5ndGggPiA1MCA/IGAke2l0ZW0uc25pcHBldC50aXRsZS5zdWJzdHJpbmcoMCwgNTApfSAuLi5gOiBpdGVtLnNuaXBwZXQudGl0bGVcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKGkgPiAyKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuZGF0YSgnbWV0YScsIGl0ZW0pXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vcGVuVmlkZW8sIHRoaXMpKVxuXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hcHBlbmQoJGl0ZW0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuJGl0ZW1zID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJz4gLmpzLXBob3RvJyk7XG4gICAgICB0aGlzLiRjb250YWluZXIucHJlcGVuZFRvKCRwbGFjZWhvbGRlcik7XG5cbiAgICAgIC8vIGp1c3QgYWRkIHBhZ2luYXRpb24gYnV0dG9ucyBpZiBuZWVkZWRcbiAgICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGggPiAzKSB7XG4gICAgICAgIC8vIGFkZCBwcmV2aW91cyBidXR0b24gXG4gICAgICAgIHRoaXMuJHByZXZCdXR0b24gPSAkKGh0bWwucHJldkJ1dHRvbigpKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdpbmF0aW9uQ2xpY2tlZCwgdGhpcykpXG4gICAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIpO1xuICAgICAgICAvLyBhZGQgbmV4dCBidXR0b25cbiAgICAgICAgdGhpcy4kbmV4dEJ1dHRvbiA9ICQoaHRtbC5uZXh0QnV0dG9uKCkpXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2luYXRpb25DbGlja2VkLCB0aGlzKSlcbiAgICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lcik7ICAgICAgIFxuXG4gICAgICAgIHRoaXMucHJlbG9hZFRodW1ibmFpbCgzKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICBvcGVuVmlkZW8oZSkge1xuICAgIGxldCAkaXRlbSA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5waG90bycpLFxuICAgICAgbWV0YSA9ICRpdGVtLmRhdGEoJ21ldGEnKSxcbiAgICAgICRtb2RhbCA9ICQoaHRtbC52aWRlb01vZGFsKG1ldGEucGxheWVyLmVtYmVkSHRtbCwgbWV0YSkpO1xuXG4gICAgJG1vZGFsXG4gICAgICAuc2hvdygpXG4gICAgICAuYXBwZW5kVG8oJ2JvZHknKVxuICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5jbG9zZVZpZGVvLCB0aGlzKSlcbiAgICAgIC5maW5kKCcuanMtbW9kYWwtY2xvc2UnLCAkLnByb3h5KHRoaXMuY2xvc2VWaWRlbywgdGhpcykpXG4gIH1cblxuICBjbG9zZVZpZGVvKGUpIHtcbiAgICBpZiAoZSkge1xuICAgICAgbGV0ICR0YXJnZXQgPSAkKGUudGFyZ2V0KTtcbiAgICAgICAgXG4gICAgICBpZiAoISR0YXJnZXQuaXMoJy5qcy1tb2RhbC1jbG9zZScpICYmICEkdGFyZ2V0LmlzKCcubW9kYWwnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSAgICBcblxuICAgICQoJy52eWVscC1tb2RhbCcpLnJlbW92ZSgpO1xuICB9XG5cbiAgb25QYWdpbmF0aW9uQ2xpY2tlZChlKSB7XG4gICAgbGV0ICRidXR0b24gPSAkKGUudGFyZ2V0KSxcbiAgICAgICR2aXNpYmxlID0gdGhpcy4kaXRlbXMuZmlsdGVyKCc6dmlzaWJsZScpXG5cbiAgICBpZiAoISRidXR0b24uaXMoJ2J1dHRvbicpKSB7XG4gICAgICAkYnV0dG9uID0gJGJ1dHRvbi5jbG9zZXN0KCdidXR0b24nKTtcbiAgICB9XG5cbiAgICBpZiAoJGJ1dHRvbi5pcygnLnByZXYnKSkge1xuICAgICAgbGV0ICRwcmV2ID0gJHZpc2libGUuZmlyc3QoKS5wcmV2KCcucGhvdG8nKSxcbiAgICAgICAgJGVsZW1lbnRzID0gJHByZXYubGVuZ3RoID8gJHByZXYuYWRkKCR2aXNpYmxlKSA6ICR2aXNpYmxlO1xuXG4gICAgICAkYnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgJHByZXYucHJldkFsbCgnLnBob3RvJykubGVuZ3RoID09IDApO1xuICAgICAgdGhpcy4kbmV4dEJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goKGksIGl0ZW0pID0+IHtcbiAgICAgICAgbGV0ICRpdGVtID0gJChpdGVtKTtcblxuICAgICAgICBpZiAoaSArIDEgPT0gJGVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaXRlbVxuICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwaG90by0nICsgaSlcbiAgICAgICAgICAgIC5hZGRDbGFzcygncGhvdG8tJyArIChpICsgMSkpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCAkbmV4dCA9ICR2aXNpYmxlLmxhc3QoKS5uZXh0KCcucGhvdG8nKSxcbiAgICAgICAgaXNUb0Rpc2FibGUgPSAkbmV4dC5uZXh0QWxsKCcucGhvdG8nKS5sZW5ndGggPT0gMDtcblxuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGlzVG9EaXNhYmxlKTtcbiAgICAgIHRoaXMuJHByZXZCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgIC8vIHByZWxvYWQgbmV4dCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIG9uIG5leHQgcGFnaW5hdGlvblxuICAgICAgaWYgKCFpc1RvRGlzYWJsZSkge1xuICAgICAgICBsZXQgJG5leHRUb1ByZWxvYWQgPSAkbmV4dC5uZXh0KCcucGhvdG8nKTtcblxuICAgICAgICB0aGlzLnByZWxvYWRUaHVtYm5haWwodGhpcy4kaXRlbXMuaW5kZXgoJG5leHRUb1ByZWxvYWQpKTtcbiAgICAgIH1cblxuICAgICAgJHZpc2libGUuYWRkKCRuZXh0KS5lYWNoKChpLCBpdGVtKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSA9ICQoaXRlbSk7XG5cbiAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRpdGVtXG4gICAgICAgICAgICAuc2hvdygpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3Bob3RvLScgKyAoaSArIDEpKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdwaG90by0nICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8gcHJlbG9hZCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIGluIHBhZ2luYXRpb24gdHJhc2l0aW9uXG4gIHByZWxvYWRUaHVtYm5haWwoaW5kZXgpIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudmlkZW9zW2luZGV4XSwgXG4gICAgICB1cmwgPSBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0udXJsLFxuICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBjb25zb2xlLmxvZyhgJHt1cmx9IHByZWxvYWRlZGApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIGFuaW1hdGlvbiB0byBhcHBlciBjb21taW5nIGZyb20gQ1NTXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3MoJ3Nob3cnKVxuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdvdmVyZmxvdycpOyAgXG4gICAgICB9LCAxMDAwKTtcbiAgICB9LCAxMDAwKTtcblxuICAgIC8vIGNsb3NlIHZpZGVvIG1vZGFsIHdoZW4gZXNjIGlzIHByZXNzZWRcbiAgICAkKGRvY3VtZW50KS5rZXlwcmVzcygkLnByb3h5KChlKSA9PiB7IFxuICAgICAgZGVidWdnZXI7XG4gICAgICBpZiAoZS5rZXlDb2RlID09IDI3KSB7IFxuICAgICAgICB0aGlzLmNsb3NlVmlkZW8oKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKSlcbiAgfVxufTtcblxuXG5jb25zdCBodG1sID0ge1xuICB0aHVibmFpbEl0ZW06ICh2aWRlbykgPT4ge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImpzLXBob3RvIHBob3RvIHBob3RvLSR7dmlkZW8uaX1cIj5cbiAgICAgICA8ZGl2IGNsYXNzPVwic2hvd2Nhc2UtcGhvdG8tYm94XCI+XG4gICAgICAgICAgPGEgaHJlZj1cIiNcIiBzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6dXJsKCcke3ZpZGVvLnRodW1ibmFpbC51cmx9JylcIj48L2E+XG4gICAgICAgPC9kaXY+XG4gICAgICAgPGRpdiBjbGFzcz1cInBob3RvLWJveC1vdmVybGF5IGpzLW92ZXJsYXlcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibWVkaWEtYmxvY2sgcGhvdG8tYm94LW92ZXJsYXlfY2FwdGlvblwiPlxuICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZWRpYS1zdG9yeVwiPlxuICAgICAgICAgICAgICAgIDxhIGNsYXNzPVwicGhvdG8tZGVzY1wiIGhyZWY9XCIjXCI+JHt2aWRlby5leGNlcnB0fTwvYT5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImF1dGhvclwiPlxuICAgICAgICAgICAgICAgIGJ5IDxhIGNsYXNzPVwidXNlci1kaXNwbGF5LW5hbWVcIiBocmVmPVwiI1wiPiR7dmlkZW8uY2hhbm5lbFRpdGxlfTwvYT5cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgfSxcblxuICBwcmV2QnV0dG9uOiAoKSA9PiB7XG4gICAgcmV0dXJuIGA8YnV0dG9uIGNsYXNzPVwicHJldiB5YnRuIHlidG4tLWJpZ1wiIGRpc2FibGVkPlxuICAgICAgPHNwYW4gYXJpYS1sYWJlbD1cInRlc3RcIiBzdHlsZT1cIndpZHRoOiA0OHB4OyBoZWlnaHQ6IDQ4cHg7XCIgY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tbGVmdCBpY29uLS1zaXplLTQ4XCI+XG4gICAgICAgIDxzdmcgY2xhc3M9XCJpY29uX3N2Z1wiPlxuICAgICAgICAgIDx1c2UgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeGxpbms6aHJlZj1cIiM0OHg0OF9jaGV2cm9uX2xlZnRcIj48L3VzZT5cbiAgICAgICAgPC9zdmc+XG4gICAgICA8L3NwYW4+XG4gICAgPC9idXR0b24+YDtcbiAgfSxcblxuICBuZXh0QnV0dG9uOiAoKSA9PiB7XG4gICAgcmV0dXJuIGA8YnV0dG9uIGNsYXNzPVwibmV4dCB5YnRuIHlidG4tLWJpZ1wiPlxuICAgICAgPHNwYW4gYXJpYS1sYWJlbD1cInRlc3RcIiBzdHlsZT1cIndpZHRoOiA0OHB4OyBoZWlnaHQ6IDQ4cHg7XCIgY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tcmlnaHQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj5cbiAgICAgICAgICA8dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9yaWdodFwiPjwvdXNlPlxuICAgICAgICA8L3N2Zz5cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2J1dHRvbj5gO1xuICB9LFxuXG4gIHZpZGVvTW9kYWw6IChpZnJhbWUsIGRhdGEpID0+IHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJtb2RhbCBtb2RhbC0tbGFyZ2UgdnllbHAtbW9kYWxcIiBkYXRhLWNvbXBvbmVudC1ib3VuZD1cInRydWVcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9pbm5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfY2xvc2UganMtbW9kYWwtY2xvc2VcIj7DlzwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfZGlhbG9nXCIgcm9sZT1cImRpYWxvZ1wiPjxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfaGVhZFwiPlxuICAgICAgICAgICAgPGgyPiR7ZGF0YS5zbmlwcGV0LnRpdGxlfTwvaDI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2JvZHlcIj5cbiAgICAgICAgICAgICR7aWZyYW1lfVxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX3NlY3Rpb24gdS1iZy1jb2xvclwiPlxuICAgICAgICAgICAgICBWaWRlbyBsb2FkZWQgZnJvbSBWeWVscCBjaHJvbWUgZXh0ZW5zaW9uIVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgfVxufTtcbiJdfQ==
