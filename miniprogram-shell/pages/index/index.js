var CHAT_URL = "http://127.0.0.1:3000/chat.html";
var MINI_PROGRAM_LOGIN_PATH = "/acp/auth/mini-program/login";
var LOGIN_REFRESH_WINDOW_MS = 5 * 60 * 1000;

function withCacheBuster(url) {
  var hasQuery = url.indexOf("?") !== -1;
  var joiner = hasQuery ? "&" : "?";
  return url + joiner + "_v=" + Date.now();
}

function getApiBaseUrl() {
  var protocolIndex = CHAT_URL.indexOf("://");
  if (protocolIndex === -1) {
    return "";
  }

  var pathIndex = CHAT_URL.indexOf("/", protocolIndex + 3);
  return pathIndex === -1 ? CHAT_URL : CHAT_URL.slice(0, pathIndex);
}

function buildLoginUrl() {
  return getApiBaseUrl() + MINI_PROGRAM_LOGIN_PATH;
}

function buildWebViewUrl(token) {
  return withCacheBuster(CHAT_URL) + "#mp_token=" + encodeURIComponent(token);
}

function requestLoginCode() {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (result) {
        if (!result || !result.code) {
          reject(new Error("wx.login 未返回 code"));
          return;
        }

        resolve(result.code);
      },
      fail: function (error) {
        reject(error || new Error("wx.login 调用失败"));
      }
    });
  });
}

function exchangeToken(code) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: buildLoginUrl(),
      method: "POST",
      header: {
        "Content-Type": "application/json"
      },
      data: {
        code: code
      },
      success: function (response) {
        var responseData = response && response.data ? response.data : null;
        var payload = responseData && responseData.data ? responseData.data : null;
        if (response.statusCode !== 200 || !responseData || responseData.code !== 0 || !payload || !payload.token) {
          reject(new Error((responseData && responseData.message) || "小程序登录失败"));
          return;
        }

        resolve({
          token: payload.token,
          expiresInSeconds: payload.expiresInSeconds || 0
        });
      },
      fail: function (error) {
        reject(error || new Error("请求登录接口失败"));
      }
    });
  });
}

Page({
  data: {
    url: "",
    loading: true,
    error: ""
  },

  tokenExpiresAt: 0,
  loginPromise: null,

  onLoad: function () {
    this.ensureAuthenticatedWebView(true).catch(function () {});
  },

  onShow: function () {
    this.ensureAuthenticatedWebView(false).catch(function () {});
  },

  shouldRefreshLogin: function (force) {
    if (force) {
      return true;
    }

    if (!this.data.url || !this.tokenExpiresAt) {
      return true;
    }

    return (this.tokenExpiresAt - Date.now()) <= LOGIN_REFRESH_WINDOW_MS;
  },

  ensureAuthenticatedWebView: function (force) {
    var self = this;
    if (!self.shouldRefreshLogin(force)) {
      return Promise.resolve(self.data.url);
    }

    if (self.loginPromise) {
      return self.loginPromise;
    }

    self.setData({
      loading: true,
      error: ""
    });

    self.loginPromise = requestLoginCode()
      .then(function (code) {
        return exchangeToken(code);
      })
      .then(function (result) {
        self.tokenExpiresAt = Date.now() + Math.max(result.expiresInSeconds, 0) * 1000;
        var url = buildWebViewUrl(result.token);
        self.setData({
          url: url,
          loading: false,
          error: ""
        });
        return url;
      })
      .catch(function (error) {
        console.error("小程序自动登录失败：", error);
        self.tokenExpiresAt = 0;
        self.setData({
          loading: false,
          error: "自动登录失败，请检查小程序 AppID、后端域名和微信登录配置。"
        });
        throw error;
      })
      .finally(function () {
        self.loginPromise = null;
      });

    return self.loginPromise;
  }
});
