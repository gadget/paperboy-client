function requestToken(channel, callback) {
  const http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(http.responseText);
    }
  }
  http.open('GET', 'http://localhost:8080/paperboyAuth/testChannel');
  http.send();
}

function connect(token, msgHandler) {
  // TODO: use WSS for secure/encrypted ws channels
  ws = new WebSocket('ws://localhost:3000');
  ws.onopen = function() {
    ws.send(token);
  };
  ws.onmessage = msgHandler;
  // TODO: deal with reconnection, timeout, heartbeat, isalive, etc
  // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
}
