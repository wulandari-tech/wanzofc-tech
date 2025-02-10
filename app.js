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
const path = require('path');

const apiRouters = require('./routes/api');
const userRouters = require('./routes/users');

const { isAuthenticated } = require('./lib/auth');
const { connectMongoDb } = require('./database/connect');
const { getApikey } = require('./database/db');

const PORT = process.env.PORT || 3000;

connectMongoDb();

app.set('trust proxy', 1);
app.use(compression())

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 2000,
    message: 'Oops terlalu banyak permintaan'
});
app.use(limiter);

app.set('view engine', 'ejs');
app.use(expressLayout);
app.use(express.static('public'));

// Konfigurasi direktori views
app.set('views', path.join(__dirname, 'views'));

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

// Data API Key (Contoh - Ganti dengan data dari database Anda)
const apiKeys = [
    {
        name: "API Key low",
        description: "Cocok untuk proyek kecil.",
        price: "Rp 5.000",
        features: ["5.000 panggilan API/bulan", "Dukungan komunitas"]
    },
    {
        name: "API Key standar",
        description: "Untuk bisnis yang berkembang.",
        price: "Rp 10.000",
        features: ["10.000 panggilan API/bulan", "Dukungan email prioritas"]
    }
];

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
        res.locals.error_msg = "Error fetching API key. Please try again.";
        res.redirect('/users/login');
    }
});

// Rute untuk Halaman Harga
app.get('/price', isAuthenticated, async (req, res) => {
    try {
        const username = req.user ? (req.user.username || req.user.id) : 'Guest';
        let getkey = await getApikey(req.user.id);
        let { apikey } = getkey;

        res.render('buyFull', {
            layout: 'layouts/main',
            apikey: apikey,
            username: username
        });
    } catch (error) {
        console.error("Kesalahan saat merender /price:", error);
        res.locals.error_msg = "Kesalahan saat memuat halaman harga. Silakan coba lagi.";
        res.redirect('/');
    }
});

// Rute untuk Halaman Premium


// Rute untuk Halaman Daftar Produk API Key
app.get('/princing', (req, res) => {
    res.render('buyFull', {
        layout: 'layouts/main',
        apiKeys: apiKeys  // Kirim data API Key ke template
    });
});

app.use('/api', apiRouters);
app.use('/users', userRouters);

// Middleware untuk menangani rute yang tidak ditemukan (404)
app.use(function (req, res, next) {
    res.status(404).render('notfound', {
        layout: 'layouts/main'
    });
});

app.set('json spaces', 4);

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});
