### How it works

We extract business' geolocation getting a Yelp page's metadata inserted into HTML and with this information we fetch (up to 50) YouTube videos geotagged nearby (250 meters). Very simple and useful.

All new elements added into the page via extension are following the [Yelp's style guide](https://www.yelp.com.br/styleguide) and [icons](https://www.yelp.com/styleguide/icons).

You can use arrow keys to navigate between videos. Use esc key to close the video.

To see the extension running, just install it through [the extension page](https://chrome.google.com/webstore/detail/vyelp/lleibkhjpnlieccdncckoedbfodklndm?hl=en-US&gl=BR)

PS: YouTube isn't used so much to rate or share experiences in a place! The best choice would be Intagram, but we don't have an approved applications so far.

### Requirements

[**NPM**](https://www.npmjs.com/) is needed to install all dependencies. 

`$ npm install` to install everything.


### How to run
Open the **Extension page** via [Window -> Extension](chrome://extensions/), check the **Develop Mode** checkbox. Click on **Load unpacked extension...** button and search for `/chrome` folder on in this project root. Just it. Now access any [bussines page](https://www.yelp.com/biz/la-boutique-padaria-francesa-bras%C3%ADlia-2) on Yelp and violá. If was found some video near the business address, will appear a box below the map and images thubnail block.

Inside the `/src/inject.js` file we have the all the JS (with ES6 via Babel) code to run the plugin.

Run `$ gulp watch` or `$ gulp build` to compile the file.

PS: Everytime you update anything on this project you need to update/reload the package extension too. To do that, you just need to click on **Realod** button in Vyelp item on Extension page".

### TODO
* Add support to Instagram videos. We're waiting our instagram's application be approved.
* Show list of comments direct on video modal.