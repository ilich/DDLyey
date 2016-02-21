module.exports = {
    mongodb: 'mongodb://127.0.0.1/DDLeye',
    rememberMeCookie: {
        name: 'remember_me',
        options: { 
            path: '/', 
            httpOnly: true, 
            maxAge: 604800000 
        }
    },
    default: {
        username: 'demo',
        password: 'demo',
        email: 'demo@localhost'
    }
};