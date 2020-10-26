class PaperboyClient {

  constructor(tokenBaseUrl, wsUrl) {
    this.tokenBaseUrl = tokenBaseUrl;
    this.wsUrl = wsUrl;
  }

  _requestToken(channel, callback) {
    const http = new XMLHttpRequest();
    http.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        callback(http.responseText);
      }
    }
    http.open('GET', this.tokenBaseUrl + channel);
    http.send();
  }

  _subscribe(token, msgHandler) {
    // TODO: use WSS for secure/encrypted ws channels
    const ws = new WebSocket(this.wsUrl);
    ws.onopen = function() {
      ws.send(token);
    };
    ws.onmessage = msgHandler;
    // TODO: deal with reconnection, timeout, heartbeat, isalive, etc
    // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
  }

  subscribe(channel, msgHandler) {
    const that = this
    this._requestToken(channel, function callback(token) {
      that._subscribe(token, msgHandler);
    })
  }

}
