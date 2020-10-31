class PaperboyClient {

  constructor(tokenBaseUrl, wsUrl) {
    this.tokenBaseUrl = tokenBaseUrl;
    this.wsUrl = wsUrl;
    this.subscriptions = new Map();
  }

  _scheduleSocketMaintainance() {
    clearInterval(this._scheduleSocketMaintainanceInterval);
    const that = this;
    this._scheduleSocketMaintainanceInterval = setInterval(() => {
      if (that.ws.readyState === 2 || that.ws.readyState === 3) {
        console.log('Dead WebSocket connection.');
        that.ws.close();
        if (that.subscriptions.size > 0) {
          console.log('Reconnecting as client was subscribed.');
          for (let s of that.subscriptions.entries()) {
            that.ws = undefined;
            that.subscribe(s.key, s.value);
          }
        }
      }
    }, 5000);
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
    if (this.ws === undefined) {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      const that = this;

      ws.onopen = function() {
        console.log('WebSocket opened.');
        that.ws.send(token);
        that._scheduleSocketMaintainance();
      };
      ws.onclose = function() {
        console.log('WebSocket closed.');
      };
      ws.onmessage = function(e) {
        if (e.data.length < 100 && e.data.startsWith('subscribed:')) {
          const ch = e.data.substring(11);
          console.log('Subscribed to channel: "%s".', ch);
        } else {
          const msg = JSON.parse(e.data);
          that.subscriptions.get(msg.channel)(msg);
        }
      };
    } else {
      this.ws.send(token);
    }
  }

  subscribe(channel, msgHandler) {
    this.subscriptions.set(channel, msgHandler);
    const that = this;
    this._requestToken(channel, function callback(token) {
      that._subscribe(token, msgHandler);
    })
  }

  unsubscribe(channel) {
    if (this.ws != undefined) {
      this.ws.send('unsubscribe:' + channel);
    }
    this.subscriptions.delete(channel);
  }

}
