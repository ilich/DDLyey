var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var helmet = require('helmet');
var csrf = require('csurf');
var passport = require('passport');
var configPassport = require('./middleware/passport');
var commonData = require('./middleware/common-data');

var api = require('./routes/api');
var database = require('./routes/database');
var login = require('./routes/login');
var account = require('./routes/account');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'janEphEzEN8Cr8racU',
    name: 'SessionId',
    resave: false,
    saveUninitialized: true,
    cookie: {
        // secure: true,
        httpOnly: true
    }
}));

app.use(flash());

configPassport(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));

// API - no CSURF

app.use('/api', api('v1.0'));

// Web UI - CSURF required

app.use(csrf());
app.use(commonData);

app.use('/login', login);
app.use('/account', account);
app.use('/', database);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN') {
      res.status(403);
      return res.send('access denied');    
    }
    
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403);
    return res.send('access denied');    
  }
  
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
