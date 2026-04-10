(function () {
  var TOKEN_KEY = 'acp_auth_token';
  var DEV_OPEN_ID_KEY = 'acp_dev_open_id';
  var CHAT_STATE_KEYS = ['trt-chat-state-v2', 'trt-chat-history-v1', 'trt-chat-state-v1'];
  var CHAT_SESSION_KEYS = ['trt-chat-view-state-v1'];
  var PHONE_PATTERN = /^1\d{10}$/;

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage write errors in private mode or restricted environments.
    }
  }

  function safeStorageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      // Ignore storage remove errors.
    }
  }

  function decodeBase64Url(value) {
    if (!value || typeof value !== 'string') {
      return '';
    }

    var normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    var padding = normalized.length % 4 === 0 ? '' : new Array(5 - (normalized.length % 4)).join('=');

    try {
      var decoded = window.atob(normalized + padding);
      return decodeURIComponent(
        decoded
          .split('')
          .map(function (char) {
            return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch (error) {
      return '';
    }
  }

  function parseTokenPayload(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }

    var segments = token.split('.');
    if (segments.length !== 3) {
      return null;
    }

    var payloadText = decodeBase64Url(segments[1]);
    if (!payloadText) {
      return null;
    }

    try {
      return JSON.parse(payloadText);
    } catch (error) {
      return null;
    }
  }

  function getToken() {
    return safeStorageGet(TOKEN_KEY);
  }

  function setToken(token) {
    if (!token) {
      return;
    }
    safeStorageSet(TOKEN_KEY, token);
  }

  function clearToken() {
    safeStorageRemove(TOKEN_KEY);
  }

  function safeSessionStorageRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      // Ignore sessionStorage remove errors.
    }
  }

  function clearChatCache() {
    CHAT_STATE_KEYS.forEach(function (key) {
      safeStorageRemove(key);
    });
    CHAT_SESSION_KEYS.forEach(function (key) {
      safeSessionStorageRemove(key);
    });
  }

  function logout(options) {
    var opts = options || {};
    clearToken();

    if (opts.keepDevOpenId !== true) {
      safeStorageRemove(DEV_OPEN_ID_KEY);
    }

    if (opts.keepChatCache !== true) {
      clearChatCache();
    }

    if (opts.redirectTo) {
      window.location.href = opts.redirectTo;
    }
  }

  function isTokenValid(token) {
    var payload = parseTokenPayload(token);
    if (!payload || !payload.exp) {
      return false;
    }

    var now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  function getUserId() {
    var token = getToken();
    var payload = parseTokenPayload(token);
    return payload && payload.userId ? payload.userId : null;
  }

  function getLoginType() {
    var userId = getUserId();
    if (!userId) {
      return null;
    }

    if (userId.indexOf('phone_') === 0) {
      return 'phone';
    }

    if (userId.indexOf('wx_') === 0) {
      return 'wechat';
    }

    return 'other';
  }

  function getPhone() {
    var userId = getUserId();
    if (!userId || userId.indexOf('phone_') !== 0) {
      return null;
    }
    return userId.slice('phone_'.length);
  }

  function normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '');
  }

  function validatePhone(phone) {
    return PHONE_PATTERN.test(phone);
  }

  function validatePassword(password) {
    return typeof password === 'string' && password.trim().length >= 6;
  }

  function loginWithPhoneEndpoint(path, phoneInput, passwordInput) {
    var phone = normalizePhone(phoneInput);
    var password = typeof passwordInput === 'string' ? passwordInput.trim() : '';

    if (!validatePhone(phone)) {
      return Promise.reject(new Error('请输入正确的 11 位手机号'));
    }

    if (!validatePassword(password)) {
      return Promise.reject(new Error('密码至少 6 位'));
    }

    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, password: password }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || data.code !== 0 || !data.data || !data.data.token) {
          throw new Error(data.message || '登录失败');
        }

        setToken(data.data.token);
        return {
          token: data.data.token,
          payload: parseTokenPayload(data.data.token),
          user: data.data.user || null,
          expiresInSeconds: data.data.expiresInSeconds || null,
        };
      });
    });
  }

  function loginWithPhonePassword(phone, password) {
    return loginWithPhoneEndpoint('/acp/auth/phone/login', phone, password);
  }

  function registerWithPhonePassword(phone, password) {
    return loginWithPhoneEndpoint('/acp/auth/phone/register', phone, password);
  }

  function getOrCreateDevOpenId() {
    var openId = safeStorageGet(DEV_OPEN_ID_KEY);
    if (openId) {
      return openId;
    }

    openId = 'web_debug_' + Math.random().toString(36).slice(2, 10);
    safeStorageSet(DEV_OPEN_ID_KEY, openId);
    return openId;
  }

  function loginWithMiniProgramCode(code) {
    return fetch('/acp/auth/mini-program/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || data.code !== 0 || !data.data || !data.data.token) {
          throw new Error(data.message || '小程序登录失败');
        }
        return data.data.token;
      });
    });
  }

  function loginWithDevEndpoint() {
    var openId = getOrCreateDevOpenId();
    return fetch('/acp/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openId: openId }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || data.code !== 0 || !data.data || !data.data.token) {
          throw new Error(data.message || '开发态登录失败');
        }
        return data.data.token;
      });
    });
  }

  function wxLogin() {
    return new Promise(function (resolve, reject) {
      if (!window.wx || typeof window.wx.login !== 'function') {
        reject(new Error('当前环境不支持 wx.login'));
        return;
      }

      window.wx.login({
        success: function (result) {
          if (!result || !result.code) {
            reject(new Error('未获取到 code'));
            return;
          }
          resolve(result.code);
        },
        fail: function (error) {
          reject(error || new Error('wx.login 失败'));
        },
      });
    });
  }

  function ensureLogin(options) {
    var opts = options || {};
    var existingToken = getToken();
    if (!opts.force && existingToken && isTokenValid(existingToken)) {
      return Promise.resolve(parseTokenPayload(existingToken));
    }

    clearToken();

    var runDevFallback = opts.devFallback !== false;
    return wxLogin()
      .then(function (code) {
        return loginWithMiniProgramCode(code);
      })
      .catch(function () {
        if (!runDevFallback) {
          throw new Error('当前环境无法完成小程序登录');
        }
        return loginWithDevEndpoint();
      })
      .then(function (token) {
        setToken(token);
        return parseTokenPayload(token);
      });
  }

  function ensurePhoneLogin(options) {
    var opts = options || {};
    var token = getToken();
    if (token && isTokenValid(token)) {
      var payload = parseTokenPayload(token);
      if (payload && payload.userId && payload.userId.indexOf('phone_') === 0) {
        return Promise.resolve(payload);
      }
    }

    if (opts.redirect === false) {
      return Promise.reject(new Error('请先手机号登录'));
    }

    var currentPath = window.location.pathname + window.location.search + window.location.hash;
    var target = '/pages/login/index.html?redirect=' + encodeURIComponent(currentPath);
    window.location.href = target;
    return Promise.reject(new Error('已跳转到登录页'));
  }

  function fetchWithAuth(url, init) {
    var requestInit = init || {};
    var normalizedInit = Object.assign({}, requestInit);
    var shouldAutoLogin = normalizedInit.autoLogin === true;
    if (Object.prototype.hasOwnProperty.call(normalizedInit, 'autoLogin')) {
      delete normalizedInit.autoLogin;
    }

    function doFetch() {
      var token = getToken();
      if (token && !isTokenValid(token)) {
        clearToken();
        token = null;
      }

      var headers = new Headers(normalizedInit.headers || {});
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', 'Bearer ' + token);
      }

      return fetch(url, Object.assign({}, normalizedInit, { headers: headers }));
    }

    if (shouldAutoLogin) {
      return ensureLogin({ devFallback: true })
        .catch(function () {
          return null;
        })
        .then(function () {
          return doFetch();
        });
    }

    return doFetch();
  }

  window.AcpAuth = {
    ensureLogin: ensureLogin,
    ensurePhoneLogin: ensurePhoneLogin,
    fetchWithAuth: fetchWithAuth,
    loginWithPhonePassword: loginWithPhonePassword,
    registerWithPhonePassword: registerWithPhonePassword,
    getUserId: getUserId,
    getLoginType: getLoginType,
    getPhone: getPhone,
    getToken: getToken,
    clearToken: clearToken,
    logout: logout,
    parseTokenPayload: parseTokenPayload,
  };
})();
