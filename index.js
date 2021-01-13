const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.urlencoded({ extended: false }));

// betoltjuk az EJS view engine-t
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// cookie funkcionalitas
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 3600 * 1000, // 1hr elet
  })
);

// isLoggedIn check
const ifNotLoggedin = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.render('login-register');
  }
  next();
};

const ifLoggedin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    return res.redirect('/home');
  }
  next();
};

// app belseje
app.get('/', ifNotLoggedin, (req, res, next) => {
  dbConnection
    .execute('SELECT `email` FROM `users` WHERE `id`=?', [req.session.userID])
    .then(([rows]) => {
      res.render('home', {
        name: rows[0].email,
      });
    });
});

// regisztracio check
app.post(
  '/register',
  ifLoggedin,
  // adatvalidalas
  [
    body('user_email', 'Invalid email address!')
      .isEmail()
      .custom((value) => {
        return dbConnection
          .execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
          .then(([rows]) => {
            if (rows.length > 0) {
              return Promise.reject('This E-mail already in use!');
            }
            return true;
          });
      }),
    body('user_name', 'Username is Empty!').trim().not().isEmpty(),
    body('user_pass', 'The password must be of minimum length 6 characters')
      .trim()
      .isLength({ min: 6 }),
  ],
  (req, res, next) => {
    const validation_result = validationResult(req);
    const { user_name, user_pass, user_email } = req.body;
    // ha sikeres a validalas
    if (validation_result.isEmpty()) {
      //  bcryptjs hasheles
      bcrypt
        .hash(user_pass, 12)
        .then((hash_pass) => {
          // tarolas
          dbConnection
            .execute(
              'INSERT INTO `users`(`name`, `email`,`password`) VALUES(?,?,?)',
              [user_name, user_email, hash_pass]
            )
            .then((result) => {
              res.send(
                `your account has been created successfully, Now you can <a href="/">Login</a>`
              );
            })
            .catch((err) => {
              if (err) throw err;
            });
        })
        .catch((err) => {
          if (err) throw err;
        });
    } else {
      // validalasi hibak begyujtese
      let allErrors = validation_result.errors.map((error) => {
        return error.msg;
      });
      // megjelenites
      res.render('login-register', {
        register_error: allErrors,
        old_data: req.body,
      });
    }
  }
);

// login
app.post(
  '/',
  ifLoggedin,
  [
    body('user_email').custom((value) => {
      return dbConnection
        .execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
          if (rows.length == 1) {
            return true;
          }
          return Promise.reject('Invalid Email Address!');
        });
    }),
    body('user_pass', 'Password is empty!').trim().not().isEmpty(),
  ],
  (req, res) => {
    const validation_result = validationResult(req);
    const { user_pass, user_email } = req.body;
    if (validation_result.isEmpty()) {
      dbConnection
        .execute('SELECT * FROM `users` WHERE `email`=?', [user_email])
        .then(([rows]) => {
          bcrypt
            .compare(user_pass, rows[0].password)
            .then((compare_result) => {
              if (compare_result === true) {
                req.session.isLoggedIn = true;
                req.session.userID = rows[0].id;

                res.redirect('/');
              } else {
                res.render('login-register', {
                  login_errors: ['Invalid Password!'],
                });
              }
            })
            .catch((err) => {
              if (err) throw err;
            });
        })
        .catch((err) => {
          if (err) throw err;
        });
    } else {
      let allErrors = validation_result.errors.map((error) => {
        return error.msg;
      });
      res.render('login-register', {
        login_errors: allErrors,
      });
    }
  }
);

app.post(
  '/login-magicurl',
  ifLoggedin,
  [
    body('user_email').custom((value) => {
      return dbConnection
        .execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
          if (rows.length == 1) {
            return true;
          }
          return Promise.reject(`There is no user associated with ${value}!`);
        })
        .catch((err) => {
          res.render('login-magicurl', {
            login_errors: err.message,
          });
        });
    }),
    body('user_email', 'Email is empty!').trim().not().isEmpty(),
  ],
  (req, res) => {
    const user_email = req.body.user_email;
    dbConnection
      .execute('SELECT * FROM `users` WHERE `email`=?', [user_email])
      .then(([rows]) => {
        let email = rows[0].email;
        let password = rows[0].password;
        var encodedCredentials = Buffer.from(email + '==' + password).toString(
          'base64'
        );
        let magicLink = `http://localhost:3000/magicLinkLogin?way=email&credentials=${encodedCredentials}`;
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'testSzoftBizMailer@gmail.com',
            pass: 'Test123!',
          },
        });
        const mailOptions = {
          from: 'testSzoftBizMailer@gmail.com',
          to: rows[0].email,
          subject: 'New SzoftBizmagicURL Login Link',
          html: `<div><h1>You can now log in using the link below</h1>
            <br />
            <p> Please click here: 
              <a href=${magicLink} target="_blank">${magicLink}</a>
            </p>
            </div>`,
        };
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            login_errors: [
              'Something went wrong while sending your magic link',
            ];
          }
        });
        res.render('login-register', {
          login_errors: ['Invalid Password!'],
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }
);

// logot
app.get('/logout', (req, res) => {
  //session bezarasa
  req.session = null;
  res.redirect('/');
});

app.get('/magicLinkLogin', (req, res) => {
  var way = req.query.way;
  if (way === 'email') {
    var credentialsEncoded = req.query.credentials;
    var decodedCredentials = Buffer.from(credentialsEncoded, 'base64');
    var email = decodedCredentials.toString().split('==')[0];
    var password = decodedCredentials.toString().split('==')[1];
    dbConnection
      .execute('SELECT * FROM `users` WHERE `email`=? AND `password`=?', [
        email,
        password,
      ])
      .then(([rows]) => {
        if (rows.length == 1) {
          req.session.isLoggedIn = true;
          req.session.userID = rows[0].id;

          res.redirect('/');
        } else {
          res.render('login-register', {
            login_errors: ['Invalid Credentials!'],
          });
        }
      });
  }
});

app.get('/login-magicurl', (req, res) => {
  res.render('login-magicurl');
});

app.use('/', (req, res) => {
  res.status(404).send('<h1>404 Page Not Found!</h1>');
});

app.listen(3000, () => console.log('Server is Running...'));
