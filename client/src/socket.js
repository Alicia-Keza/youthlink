import { io } from 'socket.io-client';
import { getToken } from './api';

// Opens a live connection to the server using the saved login token.
// Remember to call socket.disconnect() when the page closes.
export function connectSocket() {
  return io({ auth: { token: getToken() } });
}
