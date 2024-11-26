var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var indexRouter = require('./routes/index.route');
var usersRouter = require('./routes/users.route');
var postsRouter = require('./routes/posts.route');

const debugMiddleware = require('./middleware/debug.middleware');

const { logger } = require('./utils/logger');
const { sequelize } = require('./config/sequelize.config');
const dbConfig = require('./config/db.config');

const appInit = async () => {
  return new Promise((resolve, reject) => {
  sequelize.sync({ force: dbConfig.forceDrop })
    .then(() => {
      logger.info('[DB] Database sync complete.');

      var app = new express();

      // view engine setup
      app.set('views', path.join(__dirname, 'views'));
      app.set('view engine', 'pug');

      app.use(express.json());
      app.use(express.urlencoded({ extended: false }));
      app.use(cookieParser());
      app.use(express.static(path.join(__dirname, 'public')));

      app.use(debugMiddleware.incomingRequest);

      app.use('/api/', indexRouter);
      app.use('/api/users', usersRouter);
      app.use('/api/posts', postsRouter);

      // catch 404 and forward to error handler
      app.use(function(req, res, next) {
        next(createError(404));
      });

      // error handler
      app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
      });

      resolve(app);
    })
    .catch(err => {
      logger.error(`[DB] Database sync failed: ${err}`);
      reject('Failed to sync');
    });
  });
}

module.exports = {appInit}
