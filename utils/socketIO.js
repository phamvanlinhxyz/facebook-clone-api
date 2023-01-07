const jwt = require('jsonwebtoken');
const chatController = require('../controllers/Chats');
const notificationsController = require('../controllers/Notifications');
const { Server } = require('socket.io');

function connectSocket(server) {
  var socketIds = {};
  var mapSocketIds = {};

  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        callback(null, true);
      },
      credentials: true,
    },
  });

  // Kết nối socket
  io.on('connection', (socket) => {
    if (socket.handshake.headers.token) {
      try {
        decoded = jwt.verify(
          socket.handshake.headers.token,
          process.env.JWT_SECRET
        );
        if (socketIds[decoded.id] && socketIds[decoded.id].length > 0) {
          socketIds[decoded.id].push(socket.id);
        } else {
          socketIds[decoded.id] = [];
          socketIds[decoded.id].push(socket.id);
        }
        mapSocketIds[socket.id] = decoded.id;
        console.log(
          'A user connected, account devices: ' + socketIds[decoded.id]
        );
      } catch (e) {
        console.log('Invalid token');
      }
    }

    // Ngắt kết nối socket
    socket.on('disconnect', () => {
      let userId = mapSocketIds[socket.id];
      if (socketIds[userId]) {
        for (let i = 0; i < socketIds[userId].length; i++) {
          console.log(
            'A user disconnected, account devices: ' + socketIds[userId]
          );
          if (socketIds[userId][i] == socket.id) {
            socketIds[userId].splice(i, 1);
          }
        }
      }
    });

    // Bắn socket thông báo
    socket.on('pushNotification', async (msg) => {
      if (msg.token) {
        try {
          decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          msg.senderId = decoded.id;

          delete msg.token;

          let res = await notificationsController.create(
            msg.type,
            msg.receiverId,
            msg.senderId,
            msg.refId
          );

          if (res) {
            msg.data = res;
            if (socketIds[msg.receiverId]) {
              for (let i = 0; i < socketIds[msg.receiverId].length; i++) {
                io.to(socketIds[msg.receiverId][i]).emit(
                  'pushNotification',
                  msg
                );
              }
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
    });

    socket.on('chatmessage', async (msg) => {
      // console.log(msg.token)
      if (msg.token && msg.receiverId) {
        try {
          decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          msg.senderId = decoded.id;
          delete msg.token;
          msg.time = new Date();
          data = await chatController.saveMessage(msg);
          if (data !== null) {
            msg.chatId = data.chatId;
            msg._id = data.msgId;
            if (socketIds[msg.senderId]) {
              for (let i = 0; i < socketIds[msg.senderId].length; i++) {
                io.to(socketIds[msg.senderId][i]).emit('message', msg);
              }
            }
            if (socketIds[msg.receiverId]) {
              for (let i = 0; i < socketIds[msg.receiverId].length; i++) {
                io.to(socketIds[msg.receiverId][i]).emit('message', msg);
              }
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
    });

    socket.on('blockers', async (msg) => {
      // console.log(msg.token)
      if (msg.token && msg.receiverId) {
        try {
          decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          msg.senderId = decoded.id;
          delete msg.token;
          if (msg.type == 'block') {
            msg.data = await chatController.blockChat(msg);
          } else {
            msg.data = await chatController.unBlockChat(msg);
          }

          delete msg.chatId;
          if (msg.data !== null) {
            if (socketIds[msg.senderId]) {
              for (let i = 0; i < socketIds[msg.senderId].length; i++) {
                io.to(socketIds[msg.senderId][i]).emit('blockers', msg);
              }
            }
            if (socketIds[msg.receiverId]) {
              for (let i = 0; i < socketIds[msg.receiverId].length; i++) {
                io.to(socketIds[msg.receiverId][i]).emit('blockers', msg);
              }
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
    });

    socket.on('recallmessage', async (msg) => {
      // console.log(msg.token)
      if (msg.token && msg.receiverId) {
        try {
          decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          msg.senderId = decoded.id;
          delete msg.token;
          msg.data = await chatController.recallMessage(msg);

          delete msg.chatId;
          if (msg.data !== null) {
            if (socketIds[msg.senderId]) {
              for (let i = 0; i < socketIds[msg.senderId].length; i++) {
                io.to(socketIds[msg.senderId][i]).emit('recallmessage', msg);
              }
            }
            if (socketIds[msg.receiverId]) {
              for (let i = 0; i < socketIds[msg.receiverId].length; i++) {
                io.to(socketIds[msg.receiverId][i]).emit('recallmessage', msg);
              }
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
    });

    socket.on('seenMessage', async (msg) => {
      // console.log(msg.token)
      if (msg.token && msg.chatId) {
        try {
          decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          msg.userId = decoded.id;
          delete msg.token;
          await chatController.seenMessage(msg);
        } catch (e) {
          console.log(e);
        }
      }
    });
  });
}

module.exports = connectSocket;
