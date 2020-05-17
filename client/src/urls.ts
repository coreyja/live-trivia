const HOST = process.env.REACT_APP_HOST || window.location.origin;
const WEBSOCKET_HOST = HOST.replace(/^http/, "ws");

export { HOST, WEBSOCKET_HOST };
