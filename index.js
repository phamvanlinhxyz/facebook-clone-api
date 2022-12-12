require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mainRouter = require('./routes/index');
const { PORT } = require('./constants/constants');
const { MONGO_URI } = require('./constants/constants');
const app = express();
const connectSocket = require('./utils/socketIO');

// connect to mongodb
mongoose
  .connect(MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    dbName: process.env.DB_NAME,
  })
  .then((res) => {
    console.log('Connect to mongodb succesfully');
  })
  .catch((err) => {
    console.log(err);
  });

// use middleware to enable cors
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
);

// route middleware
app.use('/', mainRouter);

const server = app.listen(PORT, () => {
  console.log('Server is listening on port ' + PORT);
});

// Connect socket.io
connectSocket(server);
