const mongoose = require('mongoose');
const dotenv = require('dotenv');

// process.on('uncaughtException', err => {
//   console.log('uncaught exception');
//   console.log(err.name, err.message);
//   process.exit(1);
// });

dotenv.config({ path: './.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose.connect(DB).then(() => {
  console.log('connected to the database');
});

// creating server port.
const { PORT } = process.env;
const server = app.listen(PORT, () => {
  console.log(`Listening on ${PORT}!!`);
});
// server();

// process.on('unhandledRejection', err => {
//   console.log(err.name, err.message);
//   console.log('UNHANDLED REJECTION');
//   server.close (() => {
//     process.exit(1);
//   });
// });
