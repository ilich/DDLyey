module.exports = {
    applicationKey: 'w5unuS@e=aP_avAph_vaFreTHupaf!8a',
    requestLifetime: 2,       // 2 minutes
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