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

const YOUTUBE_KEY = 'AIzaSyCaKJByB-7jJY_2E3boyJ78p0Jv8oeuriI';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

class Vyelp {
  constructor(location) {
    this.location = location;
    this.fetchVideos();
  }

  fetchVideos() {
    $.ajax({
      url: `${YOUTUBE_API}/search?part=snippet&type=video&location=${this.location.latitude},${this.location.longitude}&locationRadius=10km&key=${YOUTUBE_KEY}`,
      success: $.proxy(this.buildStructure, this),
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

        $item
          .data('meta', item)
          .on('click', $.proxy(this.openVideo, this))

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

        this.preloadThumbnail(3);
      }

      // disclaimer message
      const $disclaimer = $('<div class="arrange_unit arrange_unit--fill" />')
        .text(chrome.i18n.getMessage("l10nDisclaimer"))

      $('<h2 />')
        .text(chrome.i18n.getMessage("l10nHeader"))
        .prependTo(this.$container.parent())
        .after($disclaimer);

      this.render();
    }
  }

  openVideo(e) {
    let $item = $(e.target).closest('.photo'),
      meta = $item.data('meta'),
      $modal = $(html.videoModal(meta));

    $modal
      .show()
      .appendTo('body')
      // close modal when its overlay is clicked
      .on('click', $.proxy(this.closeVideo, this))
      .find('.js-modal-close', $.proxy(this.closeVideo, this))
  }

  closeVideo(e) {
    if (e) {
      let $target = $(e.target);
        
      if (!$target.is('.js-modal-close') && !$target.is('.modal')) {
        return;
      }
    }    

    $('.vyelp-modal').remove();
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

      // disable/enable pagination buttons
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
      let $next = $visible.last().next('.photo'),
        isToDisable = $next.nextAll('.photo').length == 0;

      // disable/enable pagination buttons
      $button.attr('disabled', isToDisable);
      this.$prevButton.attr('disabled', false);

      // preload next image to avoid a blink on next pagination
      if (!isToDisable) {
        let $nextToPreload = $next.next('.photo');

        this.preloadThumbnail(this.$items.index($nextToPreload));
      }

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

  // preload image to avoid a blink in pagination trasition
  preloadThumbnail(index) {
    let item = this.videos[index], 
      url = item.snippet.thumbnails.medium.url,
      image = new Image();

    image.src = url;
    image.onload = () => console.log(`${url} preloaded`);
  }

  render() {
    // animation to appear comming from CSS
    setTimeout(() => {
      this.$container.addClass('show')

      setTimeout(() => {
        this.$container.addClass('overflow');  
      }, 1000);
    }, 1000);

    // close video modal when esc is pressed
    $(document).keypress($.proxy((e) => { 
      if (e.keyCode == 27) { 
        this.closeVideo();
      }
    }, this))
  }
};


const html = {
  thubnailItem: (video) => {
    return `<div class="js-photo photo photo-${video.i}">
       <div class="showcase-photo-box">
          <a href="#" style="background-image:url('${video.thumbnail.url}')"><span /></a>
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
      <span class="icon icon--48-chevron-left icon--size-48">
        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_left"></use></svg>
      </span>
    </button>`;
  },

  nextButton: () => {
    return `<button class="next ybtn ybtn--big">
      <span class="icon icon--48-chevron-right icon--size-48">
        <svg class="icon_svg"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#48x48_chevron_right"></use></svg>
      </span>
    </button>`;
  },

  videoModal: (data) => {
    return `<div class="modal modal--large vyelp-modal" data-component-bound="true">
      <div class="modal_inner">
        <div class="modal_close js-modal-close">×</div>
        <div class="modal_dialog" role="dialog"><div class="">
          <div class="modal_head">
            <h2>${data.snippet.title}</h2>
          </div>
          <div class="modal_body">
            <iframe height="360" src="//www.youtube.com/embed/${data.id.videoId}?rel=0&amp;autoplay=1" frameborder="0" allowfullscreen></iframe>
            <div class="modal_section u-bg-color">
              Video loaded from Vyelp chrome extension!
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
};
