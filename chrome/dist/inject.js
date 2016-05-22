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
        url: YOUTUBE_API + '/search',
        data: {
          part: 'snippet',
          type: 'video',
          location: this.location.latitude + ',' + this.location.longitude,
          locationRadius: '250m',
          order: 'viewCount',
          maxResults: '50',
          videoEmbeddable: true,
          key: YOUTUBE_KEY
        },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5qZWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsT0FBTyxTQUFQLENBQWlCLFdBQWpCLENBQTZCLEVBQTdCLEVBQWlDLFVBQVMsUUFBVCxFQUFtQjtBQUNsRCxNQUFJLDBCQUEwQixZQUFZLFlBQVc7QUFDbkQsUUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsb0JBQWMsdUJBQWQ7O0FBRUEsVUFBSSxXQUFXLEtBQUssS0FBTCxDQUFXLEVBQUUsZUFBRixFQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixRQUF6QyxDQUFmO1VBQ0UsV0FBVyxTQUFTLE9BQVQsQ0FBaUIsZ0JBQWpCLENBQWtDLFFBRC9DOztBQUdBLFVBQUksUUFBSixFQUFjO0FBQ1osWUFBSSxLQUFKLENBQVUsUUFBVjtBQUNEO0FBQ0Y7QUFDRixHQVg2QixFQVczQixFQVgyQixDQUE5QjtBQVlELENBYkQ7O0FBZUEsSUFBTSxjQUFjLHlDQUFwQjtBQUNBLElBQU0sY0FBYyx1Q0FBcEI7O0lBRU0sSztBQUNKLGlCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxXQUFMO0FBQ0Q7Ozs7a0NBRWE7QUFDWixRQUFFLElBQUYsQ0FBTztBQUNMLGFBQVEsV0FBUixZQURLO0FBRUwsY0FBTTtBQUNKLGdCQUFNLFNBREY7QUFFSixnQkFBTSxPQUZGO0FBR0osb0JBQWEsS0FBSyxRQUFMLENBQWMsUUFBM0IsU0FBdUMsS0FBSyxRQUFMLENBQWMsU0FIakQ7QUFJSiwwQkFBZ0IsTUFKWjtBQUtKLGlCQUFPLFdBTEg7QUFNSixzQkFBWSxJQU5SO0FBT0osMkJBQWlCLElBUGI7QUFRSixlQUFLO0FBUkQsU0FGRDtBQVlMLGlCQUFTLEVBQUUsS0FBRixDQUFRLEtB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ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY2hyb21lLmV4dGVuc2lvbi5zZW5kTWVzc2FnZSh7fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgdmFyIHJlYWR5U3RhdGVDaGVja0ludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgY2xlYXJJbnRlcnZhbChyZWFkeVN0YXRlQ2hlY2tJbnRlcnZhbCk7XG5cbiAgICAgIGxldCBtZXRhZGF0YSA9IEpTT04ucGFyc2UoJCgnLmxpZ2h0Ym94LW1hcCcpWzBdLmRhdGFzZXQubWFwU3RhdGUpLFxuICAgICAgICBsb2NhdGlvbiA9IG1ldGFkYXRhLm1hcmtlcnMuc3RhcnJlZF9idXNpbmVzcy5sb2NhdGlvbjtcblxuICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgIG5ldyBWeWVscChsb2NhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9LCAxMCk7XG59KTsgXG5cbmNvbnN0IFlPVVRVQkVfS0VZID0gJ0FJemFTeUNhS0pCeUItN2pKWV8yRTNib3lKNzhwMEp2OG9ldXJpSSc7XG5jb25zdCBZT1VUVUJFX0FQSSA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS95b3V0dWJlL3YzJztcblxuY2xhc3MgVnllbHAge1xuICBjb25zdHJ1Y3Rvcihsb2NhdGlvbikge1xuICAgIHRoaXMubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICB0aGlzLmZldGNoVmlkZW9zKCk7XG4gIH1cblxuICBmZXRjaFZpZGVvcygpIHtcbiAgICAkLmFqYXgoe1xuICAgICAgdXJsOiBgJHtZT1VUVUJFX0FQSX0vc2VhcmNoYCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcGFydDogJ3NuaXBwZXQnLFxuICAgICAgICB0eXBlOiAndmlkZW8nLFxuICAgICAgICBsb2NhdGlvbjogYCR7dGhpcy5sb2NhdGlvbi5sYXRpdHVkZX0sJHt0aGlzLmxvY2F0aW9uLmxvbmdpdHVkZX1gLFxuICAgICAgICBsb2NhdGlvblJhZGl1czogJzI1MG0nLFxuICAgICAgICBvcmRlcjogJ3ZpZXdDb3VudCcsXG4gICAgICAgIG1heFJlc3VsdHM6ICc1MCcsXG4gICAgICAgIHZpZGVvRW1iZWRkYWJsZTogdHJ1ZSxcbiAgICAgICAga2V5OiBZT1VUVUJFX0tFWVxuICAgICAgfSxcbiAgICAgIHN1Y2Nlc3M6ICQucHJveHkodGhpcy5idWlsZFN0cnVjdHVyZSwgdGhpcyksXG4gICAgICBlcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGZldGNoaW5nIHZpZGVvcycsIHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYnVpbGRTdHJ1Y3R1cmUocmVzcG9uc2UpIHtcbiAgICBjb25zdCAkcGxhY2Vob2xkZXIgPSAkKCcjc3VwZXItY29udGFpbmVyJyk7XG5cbiAgICB0aGlzLiRjb250YWluZXIgPSAkKCc8ZGl2IC8+JykuYWRkQ2xhc3MoJ3Nob3djYXNlLXBob3RvcyB2eWVscCcpO1xuICAgIHRoaXMudmlkZW9zID0gcmVzcG9uc2UuaXRlbXM7XG4gICAgXG4gICAgaWYgKHRoaXMudmlkZW9zLmxlbmd0aCkge1xuICAgICAgdGhpcy52aWRlb3MuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICB2YXIgJGl0ZW0gPSAkKGh0bWxUZW1wbGF0ZXMudGh1Ym5haWxJdGVtKHtcbiAgICAgICAgICAgIGk6IGkgKyAxLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWQudmlkZW9JZCxcbiAgICAgICAgICAgIHRpdGxlOiBpdGVtLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICB0aHVtYm5haWw6IGl0ZW0uc25pcHBldC50aHVtYm5haWxzLm1lZGl1bSxcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogaXRlbS5zbmlwcGV0LmNoYW5uZWxUaXRsZSxcbiAgICAgICAgICAgIGV4Y2VycHQ6IGl0ZW0uc25pcHBldC50aXRsZS5sZW5ndGggPiA1MCA/IGAke2l0ZW0uc25pcHBldC50aXRsZS5zdWJzdHJpbmcoMCwgNTApfSAuLi5gOiBpdGVtLnNuaXBwZXQudGl0bGVcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKGkgPiAyKSB7XG4gICAgICAgICAgJGl0ZW0uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuZGF0YSgnbWV0YScsIGl0ZW0pXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vcGVuVmlkZW8sIHRoaXMpKVxuXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lci5hcHBlbmQoJGl0ZW0pO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuJGl0ZW1zID0gdGhpcy4kY29udGFpbmVyLmZpbmQoJz4gLmpzLXBob3RvJyk7XG4gICAgICB0aGlzLiRjb250YWluZXIucHJlcGVuZFRvKCRwbGFjZWhvbGRlcik7XG5cbiAgICAgIC8vIGp1c3QgYWRkIHBhZ2luYXRpb24gYnV0dG9ucyBpZiBuZWVkZWRcbiAgICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGggPiAzKSB7XG4gICAgICAgIC8vIGFkZCBwcmV2aW91cyBidXR0b24gXG4gICAgICAgIHRoaXMuJHByZXZCdXR0b24gPSAkKGh0bWxUZW1wbGF0ZXMucHJldkJ1dHRvbigpKVxuICAgICAgICAgIC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMub25QYWdpbmF0aW9uQ2xpY2tlZCwgdGhpcykpXG4gICAgICAgICAgLnByZXBlbmRUbyh0aGlzLiRjb250YWluZXIpO1xuICAgICAgICAvLyBhZGQgbmV4dCBidXR0b25cbiAgICAgICAgdGhpcy4kbmV4dEJ1dHRvbiA9ICQoaHRtbFRlbXBsYXRlcy5uZXh0QnV0dG9uKCkpXG4gICAgICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5vblBhZ2luYXRpb25DbGlja2VkLCB0aGlzKSlcbiAgICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lcik7ICAgICAgIFxuXG4gICAgICAgIHRoaXMucHJlbG9hZFRodW1ibmFpbCgzKTtcbiAgICAgIH1cblxuICAgICAgLy8gZGlzY2xhaW1lciBtZXNzYWdlXG4gICAgICBjb25zdCAkZGlzY2xhaW1lciA9ICQoJzxkaXYgY2xhc3M9XCJhcnJhbmdlX3VuaXQgYXJyYW5nZV91bml0LS1maWxsXCIgLz4nKVxuICAgICAgICAudGV4dChjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwibDEwbkRpc2NsYWltZXJcIikpXG5cbiAgICAgICQoJzxoMiAvPicpXG4gICAgICAgIC50ZXh0KGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJsMTBuSGVhZGVyXCIpKVxuICAgICAgICAucHJlcGVuZFRvKHRoaXMuJGNvbnRhaW5lci5wYXJlbnQoKSlcbiAgICAgICAgLmFmdGVyKCRkaXNjbGFpbWVyKTtcblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICAvLyBjYXJyb3NlbCdzIHBhZ2luYXRpb24gaGFuZGxlclxuICBvblBhZ2luYXRpb25DbGlja2VkKGUpIHtcbiAgICBsZXQgJGJ1dHRvbiA9ICQoZS50YXJnZXQpLFxuICAgICAgJHZpc2libGUgPSB0aGlzLiRpdGVtcy5maWx0ZXIoJzp2aXNpYmxlJylcblxuICAgIGlmICghJGJ1dHRvbi5pcygnYnV0dG9uJykpIHtcbiAgICAgICRidXR0b24gPSAkYnV0dG9uLmNsb3Nlc3QoJ2J1dHRvbicpO1xuICAgIH1cblxuICAgIC8vIHByZXYgY2FzZVxuICAgIGlmICgkYnV0dG9uLmlzKCcucHJldicpKSB7XG4gICAgICBsZXQgJHByZXYgPSAkdmlzaWJsZS5maXJzdCgpLnByZXYoJy5waG90bycpLFxuICAgICAgICAkZWxlbWVudHMgPSAkcHJldi5sZW5ndGggPyAkcHJldi5hZGQoJHZpc2libGUpIDogJHZpc2libGU7XG5cbiAgICAgIC8vIGRpc2FibGUvZW5hYmxlIHBhZ2luYXRpb24gYnV0dG9uc1xuICAgICAgJGJ1dHRvbi5hdHRyKCdkaXNhYmxlZCcsICRwcmV2LnByZXZBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwKTtcbiAgICAgIHRoaXMuJG5leHRCdXR0b24uYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKChpLCBpdGVtKSA9PiB7XG4gICAgICAgIGxldCAkaXRlbSA9ICQoaXRlbSk7XG5cbiAgICAgICAgaWYgKGkgKyAxID09ICRlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAkaXRlbS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGl0ZW1cbiAgICAgICAgICAgIC5zaG93KClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncGhvdG8tJyArIGkpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bob3RvLScgKyAoaSArIDEpKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAvLyBuZXh0IGNhc2VcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0ICRuZXh0ID0gJHZpc2libGUubGFzdCgpLm5leHQoJy5waG90bycpLFxuICAgICAgICBpc1RvRGlzYWJsZSA9ICRuZXh0Lm5leHRBbGwoJy5waG90bycpLmxlbmd0aCA9PSAwO1xuXG4gICAgICAvLyBkaXNhYmxlL2VuYWJsZSBwYWdpbmF0aW9uIGJ1dHRvbnNcbiAgICAgICRidXR0b24uYXR0cignZGlzYWJsZWQnLCBpc1RvRGlzYWJsZSk7XG4gICAgICB0aGlzLiRwcmV2QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXG4gICAgICAvLyBwcmVsb2FkIG5leHQgaW1hZ2UgdG8gYXZvaWQgYSBibGluayBvbiBuZXh0IHBhZ2luYXRpb25cbiAgICAgIGlmICghaXNUb0Rpc2FibGUpIHtcbiAgICAgICAgbGV0ICRuZXh0VG9QcmVsb2FkID0gJG5leHQubmV4dCgnLnBob3RvJyk7XG5cbiAgICAgICAgdGhpcy5wcmVsb2FkVGh1bWJuYWlsKHRoaXMuJGl0ZW1zLmluZGV4KCRuZXh0VG9QcmVsb2FkKSk7XG4gICAgICB9XG5cbiAgICAgICR2aXNpYmxlLmFkZCgkbmV4dCkuZWFjaCgoaSwgaXRlbSkgPT4ge1xuICAgICAgICBsZXQgJGl0ZW0gPSAkKGl0ZW0pO1xuXG4gICAgICAgIGlmICghaSkge1xuICAgICAgICAgICRpdGVtLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkaXRlbVxuICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwaG90by0nICsgKGkgKyAxKSlcbiAgICAgICAgICAgIC5hZGRDbGFzcygncGhvdG8tJyArIGkpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIG9wZW5WaWRlbyhlKSB7XG4gICAgbGV0ICRpdGVtID0gJChlLnRhcmdldCkuY2xvc2VzdCgnLnBob3RvJyksXG4gICAgICBtZXRhID0gJGl0ZW0uZGF0YSgnbWV0YScpLFxuICAgICAgJG1vZGFsID0gJChodG1sVGVtcGxhdGVzLnZpZGVvTW9kYWwobWV0YSkpLFxuICAgICAgJGJ1dHRvbnMgPSAkKCdidXR0b24ucGFnJywgJG1vZGFsKTtcblxuICAgICRtb2RhbFxuICAgICAgLnNob3coKVxuICAgICAgLmFwcGVuZFRvKCdib2R5JylcbiAgICAgIC8vIGNsb3NlIG1vZGFsIHdoZW4gaXRzIG92ZXJsYXkgaXMgY2xpY2tlZFxuICAgICAgLm9uKCdjbGljaycsICQucHJveHkodGhpcy5jbG9zZVZpZGVvLCB0aGlzKSlcbiAgICAgIC5maW5kKCcuanMtbW9kYWwtY2xvc2UnLCAkLnByb3h5KHRoaXMuY2xvc2VWaWRlbywgdGhpcykpO1xuXG4gICAgLy8gaGlkZSBwcmV2L25leHQgYnV0dG9uc1xuICAgIGlmICh0aGlzLnZpZGVvcy5sZW5ndGggPT0gMSkge1xuICAgICAgJGJ1dHRvbi5oaWRlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50ID0ge1xuICAgICAgdmlkZW8gICAgICAgOiBtZXRhLFxuICAgICAgJGVsZW1lbnQgICAgOiAkbW9kYWwsXG4gICAgICBpbmRleCAgICAgICA6IHRoaXMudmlkZW9zLmluZGV4T2YobWV0YSksXG4gICAgICAkcHJldkJ1dHRvbiA6ICRidXR0b25zLmZpbHRlcignLnByZXYnKSxcbiAgICAgICRuZXh0QnV0dG9uIDogJGJ1dHRvbnMuZmlsdGVyKCcubmV4dCcpXG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50LiRwcmV2QnV0dG9uID0gJGJ1dHRvbnMuZmlsdGVyKCcucHJldicpO1xuICAgIHRoaXMuY3VycmVudC4kbmV4dEJ1dHRvbiA9ICRidXR0b25zLmZpbHRlcignLm5leHQnKTtcblxuICAgIHRoaXMudmlkZW9QYWdpbmF0aW9uQnV0dG9uc1N0YXRlKCk7XG5cbiAgICAvLyBldmVudCBoYW5kbGVyXG4gICAgJGJ1dHRvbnMub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLm9uVmlkZW9QcmV2TmV4dENsaWNrZWQsIHRoaXMpKTtcbiAgfVxuXG4gIG9uVmlkZW9QcmV2TmV4dENsaWNrZWQoZSkge1xuICAgIGxldCAkYnV0dG9uID0gJChlLnRhcmdldClcblxuICAgIGlmICghJGJ1dHRvbi5pcygnYnV0dG9uJykpIHtcbiAgICAgICRidXR0b24gPSAkYnV0dG9uLmNsb3Nlc3QoJ2J1dHRvbicpO1xuICAgIH1cblxuICAgIHRoaXMucGFnaW5hdGVWaWRlbygkYnV0dG9uLmlzKCcucHJldicpKTtcbiAgfVxuXG4gIHBhZ2luYXRlVmlkZW8odG9QcmV2aW91cykge1xuICAgIGxldCAkaWZyYW1lID0gJCgnaWZyYW1lJywgdGhpcy5jdXJyZW50LiRlbGVtZW50KSxcbiAgICAgIGN1cnJlbnRJbmRleCA9IHRoaXMuY3VycmVudC5pbmRleCxcbiAgICAgIGRhdGE7XG5cbiAgICAvLyBleGl0IGlmIGlzIHRoZSBmaXJzdCBvciB0aGUgbGFzdCB2aWRlb1xuICAgIGlmICgodG9QcmV2aW91cyAmJiAhY3VycmVudEluZGV4KSB8fCAoIXRvUHJldmlvdXMgJiYgY3VycmVudEluZGV4ICsgMSA9PSB0aGlzLnZpZGVvcy5sZW5ndGgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gc2V0IGEgbmV3IGluZGV4XG4gICAgdG9QcmV2aW91cyA/IC0tY3VycmVudEluZGV4IDogKytjdXJyZW50SW5kZXg7XG5cbiAgICAvLyBnZXQgcmlnaHQgdmlkZW8gZGF0YVxuICAgIGRhdGEgPSB0aGlzLnZpZGVvc1tjdXJyZW50SW5kZXhdO1xuXG4gICAgLy8gY2hhbmdlIGlmcmFtZVxuICAgICRpZnJhbWUuYWZ0ZXIoaHRtbFRlbXBsYXRlcy5pZnJhbWUoZGF0YSkpLnJlbW92ZSgpO1xuXG4gICAgLy8gY2hhbmdlIHRpdGxlXG4gICAgdGhpcy5jdXJyZW50LiRlbGVtZW50LmZpbmQoJ2gyJykudGV4dChkYXRhLnNuaXBwZXQudGl0bGUpO1xuXG4gICAgLy8gdXBkYXRlIGN1cnJlbnQgZGF0YVxuICAgIHRoaXMuY3VycmVudC52aWRlbyA9IGRhdGE7XG4gICAgdGhpcy5jdXJyZW50LmluZGV4ID0gY3VycmVudEluZGV4O1xuXG4gICAgLy8gY2hhbmdlIHBhZ2luYXRpb24gYnV0dG9ucyBzdGF0ZVxuICAgIHRoaXMudmlkZW9QYWdpbmF0aW9uQnV0dG9uc1N0YXRlKCk7XG4gIH1cblxuICB2aWRlb1BhZ2luYXRpb25CdXR0b25zU3RhdGUoKSB7XG4gICAgdGhpcy5jdXJyZW50LiRwcmV2QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgIXRoaXMuY3VycmVudC5pbmRleCk7XG4gICAgdGhpcy5jdXJyZW50LiRuZXh0QnV0dG9uLmF0dHIoJ2Rpc2FibGVkJywgdGhpcy5jdXJyZW50LmluZGV4ICsgMSA9PSB0aGlzLnZpZGVvcy5sZW5ndGgpO1xuICB9XG5cbiAgY2xvc2VWaWRlbyhlKSB7XG4gICAgaWYgKGUpIHtcbiAgICAgIGxldCAkdGFyZ2V0ID0gJChlLnRhcmdldCk7XG4gICAgICAgIFxuICAgICAgaWYgKCEkdGFyZ2V0LmlzKCcuanMtbW9kYWwtY2xvc2UnKSAmJiAhJHRhcmdldC5pcygnLm1vZGFsJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gICAgXG5cbiAgICB0aGlzLmN1cnJlbnQuJGVsZW1lbnQucmVtb3ZlKCk7XG4gICAgdGhpcy5jdXJyZW50ID0gbnVsbDsgIFxuICB9XG5cbiAgLy8gcHJlbG9hZCBpbWFnZSB0byBhdm9pZCBhIGJsaW5rIGluIHBhZ2luYXRpb24gdHJhc2l0aW9uXG4gIHByZWxvYWRUaHVtYm5haWwoaW5kZXgpIHtcbiAgICBsZXQgaXRlbSA9IHRoaXMudmlkZW9zW2luZGV4XSwgXG4gICAgICB1cmwgPSBpdGVtLnNuaXBwZXQudGh1bWJuYWlscy5tZWRpdW0udXJsLFxuICAgICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBjb25zb2xlLmxvZyhgJHt1cmx9IHByZWxvYWRlZGApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIGFuaW1hdGlvbiB0byBzaG93cyB1cCBtb2RhbCBjb21taW5nIGZyb20gQ1NTIHdpdGggdHJhbnNpdGlvbiBvbiBlbGVtZW50XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3MoJ3Nob3cnKVxuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKCdvdmVyZmxvdycpOyAgXG4gICAgICB9LCAxMDAwKTtcbiAgICB9LCAxMDAwKTtcblxuICAgIC8vIGNsb3NlIHZpZGVvIG1vZGFsIHdoZW4gZXNjIGlzIHByZXNzZWRcbiAgICAkKGRvY3VtZW50KS5rZXlkb3duKCQucHJveHkoKGUpID0+IHsgXG4gICAgICBpZiAoIXRoaXMuY3VycmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gICAgICAgIC8vIGNsb3NlIG1vZGFsXG4gICAgICAgIGNhc2UgMjc6XG4gICAgICAgICAgdGhpcy5jbG9zZVZpZGVvKCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgIC8vIHByZXZpb3VzIHZpZGVvXG4gICAgICAgIGNhc2UgMzc6XG4gICAgICAgICAgdGhpcy5wYWdpbmF0ZVZpZGVvKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgICAvLyBuZXh0IHZpZGVvXG4gICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgdGhpcy5wYWdpbmF0ZVZpZGVvKGZhbHNlKTtcbiAgICAgICAgYnJlYWs7IFxuICAgICAgfVxuICAgIH0sIHRoaXMpKVxuICB9XG59O1xuXG5jb25zdCBodG1sVGVtcGxhdGVzID0ge1xuICB0aHVibmFpbEl0ZW06ICh2aWRlbykgPT4ge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImpzLXBob3RvIHBob3RvIHBob3RvLSR7dmlkZW8uaX1cIj5cbiAgICAgICA8ZGl2IGNsYXNzPVwic2hvd2Nhc2UtcGhvdG8tYm94XCI+XG4gICAgICAgICAgPGEgaHJlZj1cIiNcIiBzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6dXJsKCcke3ZpZGVvLnRodW1ibmFpbC51cmx9JylcIj48c3BhbiAvPjwvYT5cbiAgICAgICA8L2Rpdj5cbiAgICAgICA8ZGl2IGNsYXNzPVwicGhvdG8tYm94LW92ZXJsYXkganMtb3ZlcmxheVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZWRpYS1ibG9jayBwaG90by1ib3gtb3ZlcmxheV9jYXB0aW9uXCI+XG4gICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1lZGlhLXN0b3J5XCI+XG4gICAgICAgICAgICAgICAgPGEgY2xhc3M9XCJwaG90by1kZXNjXCIgaHJlZj1cIiNcIj4ke3ZpZGVvLmV4Y2VycHR9PC9hPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYXV0aG9yXCI+XG4gICAgICAgICAgICAgICAgYnkgPGEgY2xhc3M9XCJ1c2VyLWRpc3BsYXktbmFtZVwiIGhyZWY9XCIjXCI+JHt2aWRlby5jaGFubmVsVGl0bGV9PC9hPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9LFxuXG4gIHByZXZCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJwcmV2IHBhZyB5YnRuIHlidG4tLWJpZ1wiIGRpc2FibGVkPlxuICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tbGVmdCBpY29uLS1zaXplLTQ4XCI+XG4gICAgICAgIDxzdmcgY2xhc3M9XCJpY29uX3N2Z1wiPjx1c2UgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeGxpbms6aHJlZj1cIiM0OHg0OF9jaGV2cm9uX2xlZnRcIj48L3VzZT48L3N2Zz5cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2J1dHRvbj5gO1xuICB9LFxuXG4gIG5leHRCdXR0b246ICgpID0+IHtcbiAgICByZXR1cm4gYDxidXR0b24gY2xhc3M9XCJuZXh0IHBhZyB5YnRuIHlidG4tLWJpZ1wiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tLTQ4LWNoZXZyb24tcmlnaHQgaWNvbi0tc2l6ZS00OFwiPlxuICAgICAgICA8c3ZnIGNsYXNzPVwiaWNvbl9zdmdcIj48dXNlIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHhsaW5rOmhyZWY9XCIjNDh4NDhfY2hldnJvbl9yaWdodFwiPjwvdXNlPjwvc3ZnPlxuICAgICAgPC9zcGFuPlxuICAgIDwvYnV0dG9uPmA7XG4gIH0sXG5cbiAgaWZyYW1lOiAoZGF0YSkgPT4ge1xuICAgIHJldHVybiBgPGlmcmFtZSBoZWlnaHQ9XCIzNjBcIiBzcmM9XCIvL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8ke2RhdGEuaWQudmlkZW9JZH0/cmVsPTAmYW1wO2F1dG9wbGF5PTFcIiBmcmFtZWJvcmRlcj1cIjBcIiBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+YDtcbiAgfSxcblxuICB2aWRlb01vZGFsOiAoZGF0YSkgPT4ge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIm1vZGFsIG1vZGFsLS1sYXJnZSB2eWVscC1tb2RhbFwiIGRhdGEtY29tcG9uZW50LWJvdW5kPVwidHJ1ZVwiPlxuICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX2lubmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9jbG9zZSBqcy1tb2RhbC1jbG9zZVwiPsOXPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9kaWFsb2dcIiByb2xlPVwiZGlhbG9nXCI+PGRpdiBjbGFzcz1cIlwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbF9oZWFkXCI+XG4gICAgICAgICAgICA8aDI+JHtkYXRhLnNuaXBwZXQudGl0bGV9PC9oMj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxfYm9keVwiPlxuICAgICAgICAgICAgJHtodG1sVGVtcGxhdGVzLnByZXZCdXR0b24oKX1cbiAgICAgICAgICAgICR7aHRtbFRlbXBsYXRlcy5pZnJhbWUoZGF0YSl9XG4gICAgICAgICAgICAke2h0bWxUZW1wbGF0ZXMubmV4dEJ1dHRvbigpfVxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsX3NlY3Rpb24gdS1iZy1jb2xvclwiPlxuICAgICAgICAgICAgICAke2Nocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJsMTBuRm9vdGVyTWVzc2FnZVwiKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH1cbn07XG4iXX0=
