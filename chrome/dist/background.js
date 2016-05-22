var getFacebookAccessToken = function() {
  chrome.storage.local.get('access_token', function(keys) {
    if ('access_token' in keys) {
      return;
    }

    chrome.tabs.getAllInWindow(null, function(tabs) {
      tabs.forEach(function(tab) {
        if (tab.url.indexOf('#access_token') != -1 && tab.url.indexOf('www.yelp.com') != -1) {
          var params = tab.url.split('#')[1],
            access_token = params.split('&')[0];

          chrome.storage.local.set({'access_token': access_token.split('=')[1]});
          chrome.tabs.onUpdated.removeListener(getFacebookAccessToken);

          alert("Thank you. You're loggedin");
          
          return;
        }
      });
    });
  })
}

chrome.tabs.onUpdated.addListener(getFacebookAccessToken);
