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
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLDBDQUFwQjs7SUFFTSxLO0FBQ0osaUJBQVksUUFBWixFQUFzQjtBQUFBOztBQUNwQixTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxTQUFLLFNBQUwsR0FBaUIsdUNBQWpCOztBQUVBLFNBQUssV0FBTDtBQUNEOzs7O2tDQUVhO0FBQUE7O0FBQ1osUUFBRSxJQUFGLENBQU87QUFDTCxhQUFRLEtBQUssU0FBYixpREFBa0UsS0FBSyxRQUFMLENBQWMsUUFBaEYsU0FBNEYsS0FBSyxRQUFMLENBQWMsU0FBMUcsaUNBQStJLFdBRDFJO0FBRUwsaUJBQVMsRUFBRSxLQUFGLENBQVEsVUFBQyxRQUFELEVBQWM7QUFDN0IsY0FBSSxNQUFNLFNBQVMsS0FBVCxDQUFlLEdBQWYsQ0FBbUIsVUFBQyxJQUFELEVBQVU7QUFDbkMsbUJBQU8sS0FBSyxFQUFMLENBQVEsT0FBZjtBQUNE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eUIsTUFBekI7O0FBRUEsbUJBQVcsWUFBTTtBQUNmLGlCQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsQ0FBeUIsVUFBekI7QUFDRCxTQUZELEVBRUcsSUFGSDtBQUdELE9BTkQsRUFNRyxJQU5IO0FBT0Q7Ozs7OztBQUNGOztBQUdELElBQU0sT0FBTztBQUNYLGdCQUFjLHNCQUFDLEtBQUQsRUFBVztBQUN2QixpREFBMkMsTUFBTSxDQUFqRCx5R0FFaUQsTUFBTSxTQUFOLENBQWdCLEdBRmpFLDJPQU82QyxNQUFNLE9BUG5ELDhHQVN1RCxNQUFNLFlBVDdEO0FBZUQsR0FqQlU7O0FBbUJYLGNBQVksc0JBQU07QUFDaEI7QUFPRCxHQTNCVTs7QUE2QlgsY0FBWSxzQkFBTTtBQUNoQjtBQU9EO0FBckNVLENBQWIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY2hyb21lLmV4dGVuc2lvbi5zZW5kTWVzc2FnZSh7fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgdmFyIHJlYWR5U3RhdGVDaGVja0ludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgY2xlYXJJbnRlcnZhbChyZWFkeVN0YXRlQ2hlY2tJbnRlcnZhbCk7XG5cbiAgICAgIGxldCBtZXRhZGF0YSA9IEpTT04ucGFyc2UoJCgnLmxpZ2h0Ym94LW1hcCcpWzBdLmRhdGFzZXQubWFwU3RhdGUpLFxuICAgICAgICBsb2NhdGlvbiA9IG1ldGFkYXRhLm1hcmtlcnMuc3RhcnJlZF9idXNpbmVzcy5sb2NhdGlvbjtcblxuICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgIG5ldyBWeWVscChsb2NhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9LCAxMCk7XG59KTsgXG5cbmNvbnN0IFlPVVRVQkVfS0VZID0gJyBBSXphU3lDYUtKQnlCLTdqSllfMkUzYm95Sjc4cDBKdjhvZXVyaUknO1xuXG5jbGFzcyBWeWVscCB7XG4gIGNvbnN0cnVjdG9yKGxvY2F0aW9uKSB7XG4gICAgdGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgIHRoaXMuYmFzZVlUQXBpID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3lvdXR1YmUvdjMnO1xuXG4gICAgdGhpcy5mZXRjaFZpZGVvcygpO1xuICB9XG5cbiAgZmV0Y2hWaWRlb3MoKSB7XG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogYCR7dGhpcy5iYXNlWVRBcGl9L3NlYXJjaD9wYXJ0PXNuaXBwZXQmdHlwZT12aWRlbyZsb2NhdGlvbj0ke3RoaXMubG9jYXRpb24ubGF0aXR1ZGV9LCR7dGhpcy5sb2NhdGlvbi5sb25naXR1ZGV9JmxvY2F0aW9uUmFkaXVzPTEwa20ma2V5PSR7WU9VVFVCRV9LRVl9YCxcbiAgICAgIHN1Y2Nlc3M6ICQucHJveHkoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGxldCBpZHMgPSByZXNwb25zZS5pdGVtcy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmlkLnZpZGVvSWQ7XG4gICAgICAgICAgfSkuam9pbignLCcpO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdXJsOiBgJHt0aGlzLmJhc2VZVEFwaX0vdmlkZW9zP2lkPSR7aWRzfSZwYXJ0PXNuaXBwZXQscGxheWVyJmtleT0ke1lPVVRVQkVfS0VZfWAsXG4gICAgICAgICAgc3VjY2VzczogJC5wcm94eSh0aGlzLmJ1aWxkU3RydWN0dXJlLCB0aGlzKVxuICAgICAgICB9KVxuICAgICAgfSwgdGhpcyksXG4gICAgICBlcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGZldGNoaW5nIHZpZGVvcycsIHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYnVpbGRTdHJ1Y3R1cmUocmVzcG9uc2UpIHtcbiAgICBjb25zdCAkcGxhY2Vob2xkZXIgPSAkKCcjc3VwZXItY29udGFpbmVyJyk7XG5cbiAgICB0aGlzLiRjb250YWluZXIgPSAkKCc8ZGl2IC8+JykuYWRkQ2xhc3MoJ3Nob3djYXNlLXBob3RvcyB2eWVscCcpO1xuICAgIHRoaXMudmlkZW9zID0gcmVzcG9uc2UuaXRlbXM7XG4gICAgXG4gICAgaWYgKHRoaXMudmlkZW9zLmxlbmd0aCkge1xuICAgICAgdGhpcy52aWRlb3MuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICB2YXIgJGl0ZW0gPSAkKGh0bWwudGh1Ym5haWxJdGVtKHtcbiAgICAgICAgICAgIGk6IGkgKyAxLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWQudmlkZW9JZCxcbiAgICAgICAgICAgIHRpdGxlOiBpdGVtLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICB0aHVtYm5haWw6IGl0ZW0uc25pcHBldC50aHVtYm5haWxzLm1lZGl1bSxcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogaXRlbS5zbmlwcGV0LmNoYW5uZWxUaXRsZSxcbiAgICAgICAgICAgIGV4Y2VycHQ6IGl0ZW0uc25pcHBldC50aXRsZS5sZW5ndGggPiA1MCA/IGAke2l0ZW0uc25pcHBldC50aXRsZS5zdWJzdHJpbmcoMCwgNTApfSAuLi5gOiBpdGVtLnNuaXBwZXQudGl0bGVcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKGkgPiAyKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmFwcGVuZCgkaXRlbSk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy4kaXRlbXMgPSB0aGlzLiRjb250YWluZXIuZmluZCgnPiAuanMtcGhvdG8nKTtcbiAgICAgIHRoaXMuJGNvbnRhaW5lci5wcmVwZW5kVG8oJHBsYWNlaG9sZGVyKTtcblxuICAgICAgLy8ganVzdCBhZGQgcGFnaW5hdGlvbiBidXR0b25zIGlmIG5lZWRlZFxuICAgICAgaWYgKHRoaXMudmlkZW9zLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgLy8gYWRkIHByZXZpb3VzIGJ1dHRvbiBcbiAgICAgICAgdGhpcy4kcHJldkJ1dHRvbiA9ICQoaHRtbC5wcmV2QnV0dG9uKCkpXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2luYXRpb25DbGlja2VkLCB0aGlzKSlcbiAgICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lcik7XG4gICAgICAgIC8vIGFkZCBuZXh0IGJ1dHRvblxuICAgICAgICB0aGlzLiRuZXh0QnV0dG9uID0gJChodG1sLm5leHRCdXR0b24oKSlcbiAgICAgICAgICAub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uUGFnaW5hdGlvbkNsaWNrZWQsIHRoaXMpKVxuICAgICAgICAgIC5wcmVwZW5kVG8odGhpcy4kY29udGFpbmVyKTsgICAgICAgXG4gICAgICB9XG5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgb25QYWdpbmF0aW9uQ2xpY2tlZChlKSB7XG4gICAgbGV0ICRidXR0b24gPSAkKGUudGFyZ2V0KSxcbiAgICAgICR2aXNpYmxlID0gdGhpcy4kaXRlbXMuZmlsdGVyKCc6dmlzaWJsZScpXG5cbiAgICBpZiAoISRidXR0b24uaXMoJ2J1dHRvbicpKSB7XG4gICAgICAkYnV0dG9uID0gJGJ1dHRvbi5jbG9zZXN0KCdidXR0b24nKTtcbiAgICB9XG5cbiAgICBpZiAoJGJ1dHRvbi5pcygnLnByZXYnKSkge1xuICAgICAgbGV0ICRwcmV2ID0gJHZpc2libGUuZmlyc3QoKS5wcmV2KCcucGhvdG8nKSxcbiAgICAgICAgJGVsZW1lbnRzID0gJHByZXYubGVuZ3RoID8gJHByZXYuYWRkKCR2aXNpYmxlKSA6ICR2aXNpYmxlO1xuXG4gICAgICAkYnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgJHByZXYucHJldkFsbCgnLnBob3RvJykubGVuZ3RoID09IDApO1xuICAgICAgdGhpcy4kbmV4dEJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goKGksIGl0ZW0pID0+IHtcbiAgICAgICAgbGV0ICRpdGVtID0gJChpdGVtKTtcblxuICAgICAgICBpZiAoaSArIDEgPT0gJGVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaXRlbVxuICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwaG90by0nICsgaSlcbiAgICAgICAgICAgIC5hZGRDbGFzcygncGhvdG8tJyArIChpICsgMSkpO1xuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCAkbmV4dCA9ICR2aXNpYmxlLmxhc3QoKS5uZXh0KCcucGhvdG8nKTtcblxuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsICRuZXh0Lm5leHRBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwKTtcbiAgICAgIHRoaXMuJHByZXZCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgICR2aXNpYmxlLmFkZCgkbmV4dCkuZWFjaCgoaSwgaXRlbSkgPT4ge1xuICAgICAgICBsZXQgJGl0ZW0gPSAkKGl0ZW0pO1xuXG4gICAgICAgIGlmICghaSkge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaXRlbVxuICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwaG90by0nICsgKGkgKyAxKSlcbiAgICAgICAgICAgIC5hZGRDbGFzcygncGhvdG8tJyArIGkpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBhbmltYXRpb24gdG8gYXBwZXIgY29tbWluZyBmcm9tIENTU1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdzaG93JylcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcygnb3ZlcmZsb3cnKTsgIFxuICAgICAgfSwgMTAwMCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cbn07XG5cblxuY29uc3QgaHRtbCA9IHtcbiAgdGh1Ym5haWxJdGVtOiAodmlkZW8pID0+IHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJqcy1waG90byBwaG90byBwaG90by0ke3ZpZGVvLml9XCI+XG4gICAgICAgPGRpdiBjbGFzcz1cInNob3djYXNlLXBob3RvLWJveFwiPlxuICAgICAgICAgIDxhIGhyZWY9XCIjXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOnVybCgnJHt2aWRlby50aHVtYm5haWwudXJsfScpXCI+PC9hPlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJwaG90by1ib3gtb3ZlcmxheSBqcy1vdmVybGF5XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLWJsb2NrIHBob3RvLWJveC1vdmVybGF5X2NhcHRpb25cIj5cbiAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWVkaWEtc3RvcnlcIj5cbiAgICAgICAgICAgICAgICA8YSBjbGFzcz1cInBob3RvLWRlc2NcIiBocmVmPVwiI1wiPiR7dmlkZW8uZXhjZXJwdH08L2E+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJhdXRob3JcIj5cbiAgICAgICAgICAgICAgICBieSA8YSBjbGFzcz1cInVzZXItZGlzcGxheS1uYW1lXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmNoYW5uZWxUaXRsZX08L2E+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH0sXG5cbiAgcHJldkJ1dHRvbjogKCkgPT4ge1xuICAgIHJldHVybiBgPGJ1dHRvbiBjbGFzcz1cInByZXYgeWJ0biB5YnRuLS1iaWdcIiBkaXNhYmxlZD5cbiAgICAgIDxzcGFuIGFyaWEtbGFiZWw9XCJ0ZXN0XCIgc3R5bGU9XCJ3aWR0aDogNDhweDsgaGVpZ2h0OiA0OHB4O1wiIGNsYXNzPVwiaWNvbiBpY29uLS00OC1jaGV2cm9uLWxlZnQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj5cbiAgICAgICAgICA8dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9sZWZ0XCI+PC91c2U+XG4gICAgICAgIDwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgbmV4dEJ1dHRvbjogKCkgPT4ge1xuICAgIHJldHVybiBgPGJ1dHRvbiBjbGFzcz1cIm5leHQgeWJ0biB5YnRuLS1iaWdcIj5cbiAgICAgIDxzcGFuIGFyaWEtbGFiZWw9XCJ0ZXN0XCIgc3R5bGU9XCJ3aWR0aDogNDhweDsgaGVpZ2h0OiA0OHB4O1wiIGNsYXNzPVwiaWNvbiBpY29uLS00OC1jaGV2cm9uLXJpZ2h0IGljb24tLXNpemUtNDhcIj5cbiAgICAgICAgPHN2ZyBjbGFzcz1cImljb25fc3ZnXCI+XG4gICAgICAgICAgPHVzZSB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB4bGluazpocmVmPVwiIzQ4eDQ4X2NoZXZyb25fcmlnaHRcIj48L3VzZT5cbiAgICAgICAgPC9zdmc+XG4gICAgICA8L3NwYW4+XG4gICAgPC9idXR0b24+YDtcbiAgfVxufTtcbiJdfQ==
