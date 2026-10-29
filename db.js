const { Pool } = require('pg')

// Configures the connection using secrets from your .env file
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

// Test the connection automatically when the application starts
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Database connection failed:', err.stack)
    }
    console.log('✅ Database connected successfully')
    release() 
})

// Exports the connection pool so your registration and login routes can use it
module.exports = pool