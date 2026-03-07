const { OTServer } = require('../ot/otEngine');
const Document = require('../models/Document');

// In-memory session state
// Structure: { [sessionId]: { otServer, users: Map<socketId, userObj>, saveTimer } }
const sessions = new Map();

const USER_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];
let colorIdx = 0;
function nextColor() { return USER_COLORS[colorIdx++ % USER_COLORS.length]; }

async function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    let content = '';
    let revision = 0;
    try {
      const doc = await Document.findOne({ sessionId });
      if (doc) { content = doc.content; revision = doc.revision; }
    } catch (e) { /* db might not be connected */ }

    const otServer = new OTServer(content);
    // Fast-forward revision counter (operations array not stored in memory across restarts)
    otServer.operations = new Array(revision).fill(null);

    sessions.set(sessionId, { otServer, users: new Map(), saveTimer: null });
  }
  return sessions.get(sessionId);
}

// Debounced save to MongoDB
function scheduleSave(sessionId, session) {
  if (session.saveTimer) clearTimeout(session.saveTimer);
  session.saveTimer = setTimeout(async () => {
    try {
      const content = session.otServer.document;
      const revision = session.otServer.getRevision();
      await Document.findOneAndUpdate(
        { sessionId },
        { content, revision, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error('Save error:', e.message);
    }
  }, 2000); // save 2s after last operation
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Join Session ──────────────────────────────────────────────────────────
    socket.on('join-session', async ({ sessionId, user }) => {
      try {
        const session = await getOrCreateSession(sessionId);
        socket.join(sessionId);

        const userObj = {
          socketId: socket.id,
          id:       user?.id || socket.id,
          name:     user?.name || `Guest_${socket.id.slice(0, 4)}`,
          color:    nextColor(),
          cursor:   null,
        };
        session.users.set(socket.id, userObj);

        // Send current doc state to the joining user
        socket.emit('init-document', {
          content:  session.otServer.document,
          revision: session.otServer.getRevision(),
          users:    [...session.users.values()],
        });

        // Tell everyone else a user joined
        socket.to(sessionId).emit('user-joined', userObj);
        console.log(`User "${userObj.name}" joined session ${sessionId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join session' });
        console.error('join-session error:', err);
      }
    });

    // ── Operation ────────────────────────────────────────────────────────────
    socket.on('operation', ({ sessionId, revision, operation }) => {
      const session = sessions.get(sessionId);
      if (!session) return;

      try {
        const transformed = session.otServer.receiveOperation(revision, operation);

        // Acknowledge to sender
        socket.emit('ack', { revision: session.otServer.getRevision() });

        // Broadcast transformed op to all OTHER users in the room
        socket.to(sessionId).emit('operation', {
          operation: transformed.toJSON(),
          revision:  session.otServer.getRevision(),
          authorId:  socket.id,
        });

        scheduleSave(sessionId, session);
      } catch (err) {
        console.error('OT error:', err.message);
        socket.emit('op-error', { message: err.message });
      }
    });

    // ── Cursor Change ─────────────────────────────────────────────────────────
    socket.on('cursor-change', ({ sessionId, cursor }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      const user = session.users.get(socket.id);
      if (user) user.cursor = cursor;
      socket.to(sessionId).emit('cursor-update', { userId: socket.id, cursor, color: user?.color });
    });

    // ── Selection Change ──────────────────────────────────────────────────────
    socket.on('selection-change', ({ sessionId, selection }) => {
      socket.to(sessionId).emit('selection-update', { userId: socket.id, selection });
    });

    // ── Language Change ───────────────────────────────────────────────────────
    socket.on('language-change', ({ sessionId, language }) => {
      socket.to(sessionId).emit('language-changed', { language, changedBy: socket.id });
      Document.findOneAndUpdate({ sessionId }, { language }).catch(() => {});
    });

    // ── Save Version (manual) ─────────────────────────────────────────────────
    socket.on('save-version', async ({ sessionId, label }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      try {
        const doc = await Document.findOne({ sessionId });
        if (doc) {
          doc.history.push({ content: doc.content, savedBy: socket.id, revision: doc.revision, label: label || 'Manual save' });
          if (doc.history.length > 50) doc.history.shift();
          await doc.save();
          socket.emit('version-saved', { message: 'Version saved', label });
        }
      } catch (e) { console.error('Save version error:', e); }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        const session = sessions.get(room);
        if (session) {
          session.users.delete(socket.id);
          socket.to(room).emit('user-left', { userId: socket.id });
          // Clean up empty sessions after 30 min
          if (session.users.size === 0) {
            setTimeout(() => {
              if (sessions.get(room)?.users.size === 0) sessions.delete(room);
            }, 30 * 60 * 1000);
          }
        }
      }
    });
  });
};
