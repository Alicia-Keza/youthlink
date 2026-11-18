import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { connectSocket } from '../socket';

function formatTime(createdAt) {
  // SQLite saves the time in UTC without a time zone, so add Z before reading it
  return new Date(createdAt.replace(' ', 'T') + 'Z').toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [chat, setChat] = useState(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  function loadConversations() {
    api('/messages')
      .then((data) => setConversations(data.conversations))
      .catch((err) => setError(err.message));
  }

  function loadChat() {
    if (!userId) {
      setChat(null);
      return;
    }
    api(`/messages/${userId}`)
      .then((data) => {
        setChat(data);
        // Opening a chat marks its messages as read, so refresh the unread counts
        loadConversations();
      })
      .catch((err) => setError(err.message));
  }

  useEffect(loadConversations, []);
  useEffect(loadChat, [userId]);

  // Show new messages as soon as they arrive, without refreshing the page
  useEffect(() => {
    const socket = connectSocket();

    socket.on('message', (message) => {
      if (message.senderId === Number(userId)) {
        // The open chat: load it again so the message is shown and marked as read
        loadChat();
      } else {
        loadConversations();
      }
    });

    return () => socket.disconnect();
  }, [userId]);

  async function sendMessage(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/messages/${userId}`, { method: 'POST', body: { body } });
      setChat({ ...chat, messages: [...chat.messages, data.message] });
      setBody('');
      loadConversations();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Messages</h1>
      {error && <p className="error">{error}</p>}

      <div className="chat-layout">
        <section className="card conversation-list">
          <h2>Conversations</h2>
          {conversations.length === 0 && (
            <p className="muted">
              No messages yet. Start a conversation from your <Link to="/connections">connections</Link>.
            </p>
          )}
          <ul className="list">
            {conversations.map((conversation) => (
              <li key={conversation.user.id}>
                <Link
                  to={`/messages/${conversation.user.id}`}
                  className={Number(userId) === conversation.user.id ? 'active' : ''}
                >
                  <strong>{conversation.user.name}</strong>
                  <span className="muted preview">{conversation.lastMessage.body}</span>
                </Link>
                {conversation.unread > 0 && <span className="badge">{conversation.unread}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="card chat">
          {!chat && <p className="muted">Choose a conversation to read your messages.</p>}

          {chat && (
            <>
              <h2>{chat.user.name}</h2>
              <div className="chat-messages">
                {chat.messages.length === 0 && <p className="muted">Say hello to start the conversation.</p>}
                {chat.messages.map((message) => (
                  <div key={message.id} className={message.senderId === user.id ? 'bubble mine' : 'bubble'}>
                    <p>{message.body}</p>
                    <span className="muted">{formatTime(message.createdAt)}</span>
                  </div>
                ))}
              </div>

              {chat.canSend ? (
                <form className="row" onSubmit={sendMessage}>
                  <input
                    placeholder="Write a message"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={2000}
                    required
                  />
                  <button className="button" type="submit">Send</button>
                </form>
              ) : (
                <p className="muted">You can only send messages to your connections.</p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
