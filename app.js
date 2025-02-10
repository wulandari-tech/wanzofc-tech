const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressLayout = require('express-ejs-layouts');
const rateLimit = require("express-rate-limit");
const passport = require('passport');
const flash = require('connect-flash');
const MemoryStore = require('memorystore')(session);
const compression = require('compression');

const apiRouters = require('./routes/api');
const userRouters = require('./routes/users');

const { isAuthenticated } = require('./lib/auth');
const { connectMongoDb } = require('./database/connect');
const { getApikey } = require('./database/db');
const { port } = require('./lib/settings');

const PORT = process.env.PORT || port;

connectMongoDb();

app.set('trust proxy', 1);
app.use(compression())

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 2000,
    message: 'Oops too many requests'
});
app.use(limiter);

app.set('view engine', 'ejs');
app.use(expressLayout);
app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
require('./lib/config')(passport);

app.use(flash());

app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
})

app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main'
    });
});

app.get('/docs', isAuthenticated, async (req, res) => {
    try {
        let getkey = await getApikey(req.user.id)
        let { apikey, username } = getkey
        res.render('docs', {
            username: username,
            apikey: apikey,
            layout: 'layouts/main'
        });
    } catch (error) {
        console.error("Error fetching API key:", error);
        res.locals.error_msg = "Error fetching API key. Please try again."; // Set an error message
        res.redirect('/users/login'); // Redirect to login or an error page
    }
});

app.get('/price', isAuthenticated, async (req, res) => {
    try {
        // Check if user is authenticated and has a username
        const username = req.user ? (req.user.username || req.user.id) : 'Guest';
        res.render('buyFull', {
            layout: 'layouts/main',
            apikey: apikey,
            username: username  // Pass the username variable
        });
    } catch (error) {
        console.error("Error rendering /price:", error);
        res.locals.error_msg = "Error loading price page. Please try again.";
        res.redirect('/'); // Redirect to home or an error page
    }
});

app.get('/premium', isAuthenticated, async (req, res) => {
    try {
        // Check if user is authenticated and has a username
        const username = req.user ? (req.user.username || req.user.id) : 'Guest';
        res.render('buyFull', {
            layout: 'layouts/main',
            apikey: apikey,
            username: username  // Pass the username variable
        });
    } catch (error) {
        console.error("Error rendering /premium:", error);
        res.locals.error_msg = "Error loading premium page. Please try again.";
        res.redirect('/'); // Redirect to home or an error page
    }
});

app.use('/api', apiRouters);
app.use('/users', userRouters);

app.use(function (req, res, next) {
    if (res.statusCode == '200') {
        res.render('notfound', {
            layout: 'layouts/main'
        });
    }
});

app.set('json spaces', 4);

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});
