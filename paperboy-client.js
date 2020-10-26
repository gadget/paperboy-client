class PaperboyClient {

  constructor(tokenBaseUrl, wsUrl) {
    this.tokenBaseUrl = tokenBaseUrl;
    this.wsUrl = wsUrl;
    this.subscribed = false;
  }

  _scheduleSocketMaintainance() {
    clearInterval(this._scheduleSocketMaintainanceInterval);
    const that = this;
    this._scheduleSocketMaintainanceInterval = setInterval(() => {
      if (that.ws.readyState === 2 || that.ws.readyState === 3) {
        console.log('Cleaning up WebSocket connection.');
        that.ws.close();
        if (that.subscribed === true) {
          console.log('Reconnecting as client was subscribed.');
          that.subscribe(that.channel, that.msgHandler);
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
    const ws = new WebSocket(this.wsUrl);
    this.ws = ws;
    const that = this;
    ws.onopen = function() {
      console.log('WebSocket opened.');
      ws.send(token);
      that._scheduleSocketMaintainance();
    };
    ws.onclose = function() {
      console.log('WebSocket closed.');
    };
    ws.onmessage = function(e) {
      if (e.data.length === 10 && e.data === 'subscribed') {
        console.log('Subscribed to channel.');
        that.subscribed = true;
      } else {
        msgHandler(e);
      }
    };
  }

  subscribe(channel, msgHandler) {
    const that = this;
    this.channel = channel;
    this.msgHandler = msgHandler;
    this._requestToken(channel, function callback(token) {
      that._subscribe(token, msgHandler);
    })
  }

}
