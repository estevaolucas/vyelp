chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      let metadata = JSON.parse($('.lightbox-map')[0].dataset.mapState),
        location = metadata.markers.starred_business.location;

      if (location) {
        new Vyelp(location);
      }
    }
  }, 10);
}); 

const YOUTUBE_KEY = ' AIzaSyCaKJByB-7jJY_2E3boyJ78p0Jv8oeuriI';

class Vyelp {
  constructor(location) {
    this.location = location;
    this.baseYTApi = 'https://www.googleapis.com/youtube/v3';

    this.fetchVideos();
  }

  fetchVideos() {
    $.ajax({
      url: `${this.baseYTApi}/search?part=snippet&type=video&location=${this.location.latitude},${this.location.longitude}&locationRadius=10km&key=${YOUTUBE_KEY}`,
      success: $.proxy((response) => {
        let ids = response.items.map((item) => {
            return item.id.videoId;
          }).join(',');

        $.ajax({
          url: `${this.baseYTApi}/videos?id=${ids}&part=snippet,player&key=${YOUTUBE_KEY}`,
          success: $.proxy(this.buildStructure, this)
        })
      }, this),
      error: function(response) {
        console.log('Error fetching videos', response);
      }
    })
  }

  buildStructure(response) {
    const $placeholder = $('#super-container');

    this.$container = $('<div />').addClass('showcase-photos vyelp');
    this.videos = response.items;
    
    if (this.videos.length) {
      this.videos.forEach((item, i) => {
        var $item = $(html.thubnailItem({
            i: i + 1,
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium,
            channelTitle: item.snippet.channelTitle,
            excerpt: item.snippet.title.length > 50 ? `${item.snippet.title.substring(0, 50)} ...`: item.snippet.title
          }));

        if (i > 2) {
          $item.hide();
        }

        this.$container.append($item);
      });

      this.$items = this.$container.find('> .js-photo');
      this.$container.prependTo($placeholder);

      // just add pagination buttons if needed
      if (this.videos.length > 3) {
        // add previous button 
        this.$prevButton = $(html.prevButton())
          .on('click', $.proxy(this.onPaginationClicked, this))
          .prependTo(this.$container);
        // add next button
        this.$nextButton = $(html.nextButton())
          .on('click', $.proxy(this.onPaginationClicked, this))
          .prependTo(this.$container);       
      }

      this.render();
    }
  }

  onPaginationClicked(e) {
    let $button = $(e.target),
      $visible = this.$items.filter(':visible')

    if (!$button.is('button')) {
      $button = $button.closest('button');
    }

    if ($button.is('.prev')) {
      let $prev = $visible.first().prev('.photo'),
        $elements = $prev.length ? $prev.add($visible) : $visible;

      $button.attr('disabled', $prev.prevAll('.photo').length == 0);
      this.$nextButton.attr('disabled', false);

      $elements.each((i, item) => {
        let $item = $(item);

        if (i + 1 == $elements.length) {
          $item.hide();
        } else {
          $item
            .show()
            .removeClass('photo-' + i)
            .addClass('photo-' + (i + 1));
        }
      })

    } else {
      let $next = $visible.last().next('.photo');

      $button.attr('disabled', $next.nextAll('.photo').length == 0);
      this.$prevButton.attr('disabled', false);

      $visible.add($next).each((i, item) => {
        let $item = $(item);

        if (!i) {
          $item.hide();
        } else {
          $item
            .show()
            .removeClass('photo-' + (i + 1))
            .addClass('photo-' + i);
        }
      })
    }
  }

  render() {
    // animation to apper comming from CSS
    setTimeout(() => {
      this.$container.addClass('show')

      setTimeout(() => {
        this.$container.addClass('overflow');  
      }, 1000);
    }, 1000);
  }
};


const html = {
  thubnailItem: (video) => {
    return `<div class="js-photo photo photo-${video.i}">
       <div class="showcase-photo-box">
          <a href="#" style="background-image:url('${video.thumbnail.url}')"></a>
       </div>
       <div class="photo-box-overlay js-overlay">
          <div class="media-block photo-box-overlay_caption">
             <div class="media-story">
                <a class="photo-desc" href="#">${video.excerpt}</a>
                <span class="author">
                by <a class="user-display-name" href="#">${video.channelTitle}</a>
                </span>
             </div>
          </div>
       </div>
    </div>`;
  },

  prevButton: () => {
    return `<button class="prev ybtn ybtn--big" disabled>
      <span aria-label="test" style="width: 48px; height: 48px;" class="icon icon--48-chevron-left icon--size-48">
        <svg class="icon_svg">
          <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_left"></use>
        </svg>
      </span>
    </button>`;
  },

  nextButton: () => {
    return `<button class="next ybtn ybtn--big">
      <span aria-label="test" style="width: 48px; height: 48px;" class="icon icon--48-chevron-right icon--size-48">
        <svg class="icon_svg">
          <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_right"></use>
        </svg>
      </span>
    </button>`;
  }
};
