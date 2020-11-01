class PaperboyClient {

  constructor(tokenBaseUrl, wsUrl) {
    this.tokenBaseUrl = tokenBaseUrl;
    this.wsUrl = wsUrl;
    this.subscriptions = new Map();
    this.tokenBuffer = [];
  }

  _scheduleSocketMaintainance() {
    clearInterval(this._scheduleSocketMaintainanceInterval);
    const that = this;
    this._scheduleSocketMaintainanceInterval = setInterval(() => {
      if (that.ws != undefined && (that.ws.readyState === 2 || that.ws.readyState === 3)) {
        console.log('Cleaning up dead WebSocket connection.');
        that.ws.close();
        that.ws = undefined;
        if (that.subscriptions.size > 0) {
          console.log('Reconnecting as client was subscribed.');
          that.subscriptions.forEach((value, key) => {
            that.subscribe(key, value);
          });
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

  _openWebSocket(callback) {
    const ws = new WebSocket(this.wsUrl);
    this.ws = ws;
    const that = this;

    ws.onopen = function() {
      console.log('WebSocket opened.');
      that._scheduleSocketMaintainance();
      callback();
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
  }

  subscribe(channel, msgHandler) {
    this.subscriptions.set(channel, msgHandler);
    const that = this;
    this._requestToken(channel, function callback(token) {
      if (that.ws === undefined) {
        that._openWebSocket(function callback() {
          while (that.tokenBuffer.length > 0) {
            that.ws.send(that.tokenBuffer.pop());
          }
          that.ws.send(token);
        });
      } else {
        if (that.ws.readyState === 1) {
          that.ws.send(token);
        } else {
          that.tokenBuffer.push(token);
        }
      }
    })
  }

  unsubscribe(channel) {
    if (this.ws != undefined) {
      this.ws.send('unsubscribe:' + channel);
    }
    this.subscriptions.delete(channel);
  }

}
