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
  }, {
    key: 'openVideo',
    value: function openVideo(e) {
      var $item = $(e.target).closest('.photo'),
          meta = $item.data('meta'),
          $modal = $(html.videoModal(meta));

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
      var _this2 = this;

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
          _this2.$nextButton.attr('disabled', false);

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
      var _this3 = this;

      // animation to appear comming from CSS
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
    return '<button class="prev ybtn ybtn--big" disabled>\n      <span class="icon icon--48-chevron-left icon--size-48">\n        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_left"></use></svg>\n      </span>\n    </button>';
  },

  nextButton: function nextButton() {
    return '<button class="next ybtn ybtn--big">\n      <span class="icon icon--48-chevron-right icon--size-48">\n        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_right"></use></svg>\n      </span>\n    </button>';
  },

  videoModal: function videoModal(data) {
    return '<div class="modal modal--large vyelp-modal" data-component-bound="true">\n      <div class="modal_inner">\n        <div class="modal_close js-modal-close">×</div>\n        <div class="modal_dialog" role="dialog"><div class="">\n          <div class="modal_head">\n            <h2>' + data.snippet.title + '</h2>\n          </div>\n          <div class="modal_body">\n            ' + html.prevButton() + '\n\n            <iframe height="360" src="//www.youtube.com/embed/' + data.id.videoId + '?rel=0&amp;autoplay=1" frameborder="0" allowfullscreen></iframe>\n\n            ' + html.nextButton() + '\n\n            <div class="modal_section u-bg-color">\n              Video loaded from Vyelp chrome extension!\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>';
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLHlDQUFwQjtBQUNBLElBQU0sY0FBYyx1Q0FBcEI7O0lBRU0sSztBQUNKLGlCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxXQUFMO0FBQ0Q7Ozs7a0NBRWE7QUFDWixRQUFFLElBQUYsQ0FBTztBQUNMLGFBQVEsV0FBUixpREFBK0QsS0FBSyxRQUFMLENBQWMsUUFBN0UsU0FBeUYsS0FBSyxRQUFMLENBQWMsU0FBdkcsaUNBQTRJLFdBRHZJO0FBRUwsaUJBQVMsRUFBRSxLQUFGLENBQVEsS0FBSyxjQUFiLEVBQTZCLElBQTdCLENBRko7QUFHTCxlQUFPLGVBQVMsUUFBVCxFQUFtQjtBQUN4QixrQkFBUSxHQUFSLENBQVksdUJBQVosRUFBcUMsUUFBckM7QUFDRDtBQUxJLE9BQVA7QUFPRDs7O21DQUVjLFEsRUFB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ZUFBTSxRQUFRLEdBQVIsQ0FBZSxHQUFmLGdCQUFOO0FBQUEsT0FBZjtBQUNEOzs7NkJBRVE7QUFBQTs7O0FBRVAsaUJBQVcsWUFBTTtBQUNmLGVBQUssVUFBTCxDQUFnQixRQUFoQixDQUF5QixNQUF6Qjs7QUFFQSxtQkFBVyxZQUFNO0FBQ2YsaUJBQUssVUFBTCxDQUFnQixRQUFoQixDQUF5QixVQUF6QjtBQUNELFNBRkQsRUFFRyxJQUZIO0FBR0QsT0FORCxFQU1HLElBTkg7OztBQVNBLFFBQUUsUUFBRixFQUFZLFFBQVosQ0FBcUIsRUFBRSxLQUFGLENBQVEsVUFBQyxDQUFELEVBQU87QUFDbEMsWUFBSSxFQUFFLE9BQUYsSUFBYSxFQUFqQixFQUFxQjtBQUNuQixpQkFBSyxVQUFMO0FBQ0Q7QUFDRixPQUpvQixFQUlsQixJQUprQixDQUFyQjtBQUtEOzs7Ozs7QUFDRjs7QUFHRCxJQUFNLE9BQU87QUFDWCxnQkFBYyxzQkFBQyxLQUFELEVBQVc7QUFDdkIsaURBQTJDLE1BQU0sQ0FBakQseUdBRWlELE1BQU0sU0FBTixDQUFnQixHQUZqRSxtUEFPNkMsTUFBTSxPQVBuRCw4R0FTdUQsTUFBTSxZQVQ3RDtBQWVELEdBakJVOztBQW1CWCxjQUFZLHNCQUFNO0FBQ2hCO0FBS0QsR0F6QlU7O0FBMkJYLGNBQVksc0JBQU07QUFDaEI7QUFLRCxHQWpDVTs7QUFtQ1gsY0FBWSxvQkFBQyxJQUFELEVBQVU7QUFDcEIsd1NBS2MsS0FBSyxPQUFMLENBQWEsS0FMM0IsaUZBUVUsS0FBSyxVQUFMLEVBUlYsMEVBVTRELEtBQUssRUFBTCxDQUFRLE9BVnBFLHdGQVlVLEtBQUssVUFBTCxFQVpWO0FBcUJEO0FBekRVLENBQWIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY2hyb21lLmV4dGVuc2lvbi5zZW5kTWVzc2FnZSh7fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgdmFyIHJlYWR5U3RhdGVDaGVja0ludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgY2xlYXJJbnRlcnZhbChyZWFkeVN0YXRlQ2hlY2tJbnRlcnZhbCk7XG5cbiAgICAgIGxldCBtZXRhZGF0YSA9IEpTT04ucGFyc2UoJCgnLmxpZ2h0Ym94LW1hcCcpWzBdLmRhdGFzZXQubWFwU3RhdGUpLFxuICAgICAgICBsb2NhdGlvbiA9IG1ldGFkYXRhLm1hcmtlcnMuc3RhcnJlZF9idXNpbmVzcy5sb2NhdGlvbjtcblxuICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgIG5ldyBWeWVscChsb2NhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9LCAxMCk7XG59KTsgXG5cbmNvbnN0IFlPVVRVQkVfS0VZID0gJ0FJemFTeUNhS0pCeUItN2pKWV8yRTNib3lKNzhwMEp2OG9ldXJpSSc7XG5jb25zdCBZT1VUVUJFX0FQSSA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS95b3V0dWJlL3YzJztcblxuY2xhc3MgVnllbHAge1xuICBjb25zdHJ1Y3Rvcihsb2NhdGlvbikge1xuICAgIHRoaXMubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICB0aGlzLmZldGNoVmlkZW9zKCk7XG4gIH1cblxuICBmZXRjaFZpZGVvcygpIHtcbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBgJHtZT1VUVUJFX0FQSX0vc2VhcmNoP3BhcnQ9c25pcHBldCZ0eXBlPXZpZGVvJmxvY2F0aW9uPSR7dGhpcy5sb2NhdGlvbi5sYXRpdHVkZX0sJHt0aGlzLmxvY2F0aW9uLmxvbmdpdHVkZX0mbG9jYXRpb25SYWRpdXM9MTBrbSZrZXk9JHtZT1VUVUJFX0tFWX1gLFxuICAgICAgc3VjY2VzczogJC5wcm94eSh0aGlzLmJ1aWxkU3RydWN0dXJlLCB0aGlzKSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgZmV0Y2hpbmcgdmlkZW9zJywgcmVzcG9uc2UpO1xuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBidWlsZFN0cnVjdHVyZShyZXNwb25zZSkge1xuICAgIGNvbnN0ICRwbGFjZWhvbGRlciA9ICQoJyNzdXBlci1jb250YWluZXInKTtcblxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICQoJzxkaXYgLz4nKS5hZGRDbGFzcygnc2hvd2Nhc2UtcGhvdG9zIHZ5ZWxwJyk7XG4gICAgdGhpcy52aWRlb3MgPSByZXNwb25zZS5pdGVtcztcbiAgICBcbiAgICBpZiAodGhpcy52aWRlb3MubGVuZ3RoKSB7XG4gICAgICB0aGlzLnZpZGVvcy5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XG4gICAgICAgIHZhciAkaXRlbSA9ICQoaHRtbC50aHVibmFpbEl0ZW0oe1xuICAgICAgICAgICAgaTogaSArIDEsXG4gICAgICAgICAgICBpZDogaXRlbS5pZC52aWRlb0lkLFxuICAgICAgICAgICAgdGl0bGU6IGl0ZW0uc25pcHBldC50aXRsZSxcbiAgICAgICAgICAgIHRodW1ibmFpbDogaXRlbS5zbmlwcGV0LnRodW1ibmFpbHMubWVkaXVtLFxuICAgICAgICAgICAgY2hhbm5lbFRpdGxlOiBpdGVtLnNuaXBwZXQuY2hhbm5lbFRpdGxlLFxuICAgICAgICAgICAgZXhjZXJwdDogaXRlbS5zbmlwcGV0LnRpdGxlLmxlbmd0aCA+IDUwID8gYCR7aXRlbS5zbmlwcGV0LnRpdGxlLnN1YnN0cmluZygwLCA1MCl9IC4uLmA6IGl0ZW0uc25pcHBldC50aXRsZVxuICAgICAgICAgIH0pKTtcblxuICAgICAgICBpZiAoaSA+IDIpIHtcbiAgICAgICAgICAkaXRlbS5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAkaXRlbVxuICAgICAgICAgIC5kYXRhKCdtZXRhJywgaXRlbSlcbiAgICAgICAgICAub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9wZW5WaWRlbywgdGhpcykpXG5cbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmFwcGVuZCgkaXRlbSk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy4kaXRlbXMgPSB0aGlzLiRjb250YWluZXIuZmluZCgnPiAuanMtcGhvdG8nKTtcbiAgICAgIHRoaXMuJGNvbnRhaW5lci5wcmVwZW5kVG8oJHBsYWNlaG9sZGVyKTtcblxuICAgICAgLy8ganVzdCBhZGQgcGFnaW5hdGlvbiBidXR0b25zIGlmIG5lZWRlZFxuICAgICAgaWYgKHRoaXMudmlkZW9zLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgLy8gYWRkIHByZXZpb3VzIGJ1dHRvbiBcbiAgICAgICAgdGhpcy4kcHJldkJ1dHRvbiA9ICQoaHRtbC5wcmV2QnV0dG9uKCkpXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2luYXRpb25DbGlja2VkLCB0aGlzKSlcbiAgICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lcik7XG4gICAgICAgIC8vIGFkZCBuZXh0IGJ1dHRvblxuICAgICAgICB0aGlzLiRuZXh0QnV0dG9uID0gJChodG1sLm5leHRCdXR0b24oKSlcbiAgICAgICAgICAub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uUGFnaW5hdGlvbkNsaWNrZWQsIHRoaXMpKVxuICAgICAgICAgIC5wcmVwZW5kVG8odGhpcy4kY29udGFpbmVyKTsgICAgICAgXG5cbiAgICAgICAgdGhpcy5wcmVsb2FkVGh1bWJuYWlsKDMpO1xuICAgICAgfVxuXG4gICAgICAvLyBkaXNjbGFpbWVyIG1lc3NhZ2VcbiAgICAgIGNvbnN0ICRkaXNjbGFpbWVyID0gJCgnPGRpdiBjbGFzcz1cImFycmFuZ2VfdW5pdCBhcnJhbmdlX3VuaXQtLWZpbGxcIiAvPicpXG4gICAgICAgIC50ZXh0KGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJsMTBuRGlzY2xhaW1lclwiKSlcblxuICAgICAgJCgnPGgyIC8+JylcbiAgICAgICAgLnRleHQoY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcImwxMG5IZWFkZXJcIikpXG4gICAgICAgIC5wcmVwZW5kVG8odGhpcy4kY29udGFpbmVyLnBhcmVudCgpKVxuICAgICAgICAuYWZ0ZXIoJGRpc2NsYWltZXIpO1xuXG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cbiAgfVxuXG4gIG9wZW5WaWRlbyhlKSB7XG4gICAgbGV0ICRpdGVtID0gJChlLnRhcmdldCkuY2xvc2VzdCgnLnBob3RvJyksXG4gICAgICBtZXRhID0gJGl0ZW0uZGF0YSgnbWV0YScpLFxuICAgICAgJG1vZGFsID0gJChodG1sLnZpZGVvTW9kYWwobWV0YSkpO1xuXG4gICAgJG1vZGFsXG4gICAgICAuc2hvdygpXG4gICAgICAuYXBwZW5kVG8oJ2JvZHknKVxuICAgICAgLy8gY2xvc2UgbW9kYWwgd2hlbiBpdHMgb3ZlcmxheSBpcyBjbGlja2VkXG4gICAgICAub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmNsb3NlVmlkZW8sIHRoaXMpKVxuICAgICAgLmZpbmQoJy5qcy1tb2RhbC1jbG9zZScsICQucHJveHkodGhpcy5jbG9zZVZpZGVvLCB0aGlzKSlcbiAgfVxuXG4gIGNsb3NlVmlkZW8oZSkge1xuICAgIGlmIChlKSB7XG4gICAgICBsZXQgJHRhcmdldCA9ICQoZS50YXJnZXQpO1xuICAgICAgICBcbiAgICAgIGlmICghJHRhcmdldC5pcygnLmpzLW1vZGFsLWNsb3NlJykgJiYgISR0YXJnZXQuaXMoJy5tb2RhbCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9ICAgIFxuXG4gICAgJCgnLnZ5ZWxwLW1vZGFsJykucmVtb3ZlKCk7XG4gIH1cblxuICBvblBhZ2luYXRpb25DbGlja2VkKGUpIHtcbiAgICBsZXQgJGJ1dHRvbiA9ICQoZS50YXJnZXQpLFxuICAgICAgJHZpc2libGUgPSB0aGlzLiRpdGVtcy5maWx0ZXIoJzp2aXNpYmxlJylcblxuICAgIGlmICghJGJ1dHRvbi5pcygnYnV0dG9uJykpIHtcbiAgICAgICRidXR0b24gPSAkYnV0dG9uLmNsb3Nlc3QoJ2J1dHRvbicpO1xuICAgIH1cblxuICAgIGlmICgkYnV0dG9uLmlzKCcucHJldicpKSB7XG4gICAgICBsZXQgJHByZXYgPSAkdmlzaWJsZS5maXJzdCgpLnByZXYoJy5waG90bycpLFxuICAgICAgICAkZWxlbWVudHMgPSAkcHJldi5sZW5ndGggPyAkcHJldi5hZGQoJHZpc2libGUpIDogJHZpc2libGU7XG5cbiAgICAgIC8vIGRpc2FibGUvZW5hYmxlIHBhZ2luYXRpb24gYnV0dG9uc1xuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsICRwcmV2LnByZXZBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwKTtcbiAgICAgIHRoaXMuJG5leHRCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKChpLCBpdGVtKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSA9ICQoaXRlbSk7XG5cbiAgICAgICAgaWYgKGkgKyAxID09ICRlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAkaXRlbS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGl0ZW1cbiAgICAgICAgICAgIC5zaG93KClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncGhvdG8tJyArIGkpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bob3RvLScgKyAoaSArIDEpKTtcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgJG5leHQgPSAkdmlzaWJsZS5sYXN0KCkubmV4dCgnLnBob3RvJyksXG4gICAgICAgIGlzVG9EaXNhYmxlID0gJG5leHQubmV4dEFsbCgnLnBob3RvJykubGVuZ3RoID09IDA7XG5cbiAgICAgIC8vIGRpc2FibGUvZW5hYmxlIHBhZ2luYXRpb24gYnV0dG9uc1xuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsIGlzVG9EaXNhYmxlKTtcbiAgICAgIHRoaXMuJHByZXZCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgIC8vIHByZWxvYWQgbmV4dCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIG9uIG5leHQgcGFnaW5hdGlvblxuICAgICAgaWYgKCFpc1RvRGlzYWJsZSkge1xuICAgICAgICBsZXQgJG5leHRUb1ByZWxvYWQgPSAkbmV4dC5uZXh0KCcucGhvdG8nKTtcblxuICAgICAgICB0aGlzLnByZWxvYWRUaHVtYm5haWwodGhpcy4kaXRlbXMuaW5kZXgoJG5leHRUb1ByZWxvYWQpKTtcbiAgICAgIH1cblxuICAgICAgJHZpc2libGUuYWRkKCRuZXh0KS5lYWNoKChpLCBpdGVtKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSA9ICQoaXRlbSk7XG5cbiAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRpdGVtXG4gICAgICAgICAgICAuc2hvdygpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3Bob3RvLScgKyAoaSArIDEpKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdwaG90by0nICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8gcHJlbG9hZCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIGluIHBhZ2luYXRpb24gdHJhc2l0aW9uXG4gIHByZWxvYWRUaHVtYm5haWwoaW5kZXgpIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudmlkZW9zW2luZGV4XSwgXG4gICAgICB1cmwgPSBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0udXJsLFxuICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBjb25zb2xlLmxvZyhgJHt1cmx9IHByZWxvYWRlZGApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIGFuaW1hdGlvbiB0byBhcHBlYXIgY29tbWluZyBmcm9tIENTU1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdzaG93JylcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcygnb3ZlcmZsb3cnKTsgIFxuICAgICAgfSwgMTAwMCk7XG4gICAgfSwgMTAwMCk7XG5cbiAgICAvLyBjbG9zZSB2aWRlbyBtb2RhbCB3aGVuIGVzYyBpcyBwcmVzc2VkXG4gICAgJChkb2N1bWVudCkua2V5cHJlc3MoJC5wcm94eSgoZSkgPT4geyBcbiAgICAgIGlmIChlLmtleUNvZGUgPT0gMjcpIHsgXG4gICAgICAgIHRoaXMuY2xvc2VWaWRlbygpO1xuICAgICAgfVxuICAgIH0sIHRoaXMpKVxuICB9XG59O1xuXG5cbmNvbnN0IGh0bWwgPSB7XG4gIHRodWJuYWlsSXRlbTogKHZpZGVvKSA9PiB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwianMtcGhvdG8gcGhvdG8gcGhvdG8tJHt2aWRlby5pfVwiPlxuICAgICAgIDxkaXYgY2xhc3M9XCJzaG93Y2FzZS1waG90by1ib3hcIj5cbiAgICAgICAgICA8YSBocmVmPVwiI1wiIHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTp1cmwoJyR7dmlkZW8udGh1bWJuYWlsLnVybH0nKVwiPjxzcGFuIC8+PC9hPlxuICAgICAgIDwvZGl2PlxuICAgICAgIDxkaXYgY2xhc3M9XCJwaG90by1ib3gtb3ZlcmxheSBqcy1vdmVybGF5XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLWJsb2NrIHBob3RvLWJveC1vdmVybGF5X2NhcHRpb25cIj5cbiAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWVkaWEtc3RvcnlcIj5cbiAgICAgICAgICAgICAgICA8YSBjbGFzcz1cInBob3RvLWRlc2NcIiBocmVmPVwiI1wiPiR7dmlkZW8uZXhjZXJwdH08L2E+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJhdXRob3JcIj5cbiAgICAgICAgICAgICAgICBieSA8YSBjbGFzcz1cInVzZXItZGlzcGxheS1uYW1lXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmNoYW5uZWxUaXRsZX08L2E+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH0sXG5cbiAgcHJldkJ1dHRvbjogKCkgPT4ge1xuICAgIHJldHVybiBgPGJ1dHRvbiBjbGFzcz1cInByZXYgeWJ0biB5YnRuLS1iaWdcIiBkaXNhYmxlZD5cbiAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLS00OC1jaGV2cm9uLWxlZnQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj48dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9sZWZ0XCI+PC91c2U+PC9zdmc+XG4gICAgICA8L3NwYW4+XG4gICAgPC9idXR0b24+YDtcbiAgfSxcblxuICBuZXh0QnV0dG9uOiAoKSA9PiB7XG4gICAgcmV0dXJuIGA8YnV0dG9uIGNsYXNzPVwibmV4dCB5YnRuIHlidG4tLWJpZ1wiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tcmlnaHQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj48dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9yaWdodFwiPjwvdXNlPjwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgdmlkZW9Nb2RhbDogKGRhdGEpID0+IHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJtb2RhbCBtb2RhbC0tbGFyZ2UgdnllbHAtbW9kYWxcIiBkYXRhLWNvbXBvbmVudC1ib3VuZD1cInRydWVcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9pbm5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfY2xvc2UganMtbW9kYWwtY2xvc2VcIj7DlzwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfZGlhbG9nXCIgcm9sZT1cImRpYWxvZ1wiPjxkaXYgY2xhc3M9XCJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfaGVhZFwiPlxuICAgICAgICAgICAgPGgyPiR7ZGF0YS5zbmlwcGV0LnRpdGxlfTwvaDI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2JvZHlcIj5cbiAgICAgICAgICAgICR7aHRtbC5wcmV2QnV0dG9uKCl9XG5cbiAgICAgICAgICAgIDxpZnJhbWUgaGVpZ2h0PVwiMzYwXCIgc3JjPVwiLy93d3cueW91dHViZS5jb20vZW1iZWQvJHtkYXRhLmlkLnZpZGVvSWR9P3JlbD0wJmFtcDthdXRvcGxheT0xXCIgZnJhbWVib3JkZXI9XCIwXCIgYWxsb3dmdWxsc2NyZWVuPjwvaWZyYW1lPlxuXG4gICAgICAgICAgICAke2h0bWwubmV4dEJ1dHRvbigpfVxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfc2VjdGlvbiB1LWJnLWNvbG9yXCI+XG4gICAgICAgICAgICAgIFZpZGVvIGxvYWRlZCBmcm9tIFZ5ZWxwIGNocm9tZSBleHRlbnNpb24hXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG59O1xuIl19
