var CHAT_URL = "http://127.0.0.1:3000/chat.html";

function withCacheBuster(url) {
  var hasQuery = url.indexOf("?") !== -1;
  var joiner = hasQuery ? "&" : "?";
  return url + joiner + "_v=" + Date.now();
}

Page({
  data: {
    url: withCacheBuster(CHAT_URL)
  },

  onShow: function () {
    this.setData({
      url: withCacheBuster(CHAT_URL)
    });
  }
});
