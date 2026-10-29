require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const db = require('./db') // Imports your active pg connection pool
const jwt = require('jsonwebtoken')
const app = express()
const {body, validationResult} = require('express-validator')
console.log('Commence.')
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.static('public'))


app.post('/api/register', [body('email').isEmail().withMessage('Please provide a valid email format (e.g. name@example.com)').normalizeEmail(), // Cleans and standardises inputs (e.g. removes extra spaces or dots)
                        body('password').isLength({ min: 8 }).withMessage('Security constraint: Password must be at least 8 characters long').matches(/\d/).withMessage('Security constraint: Password must contain at least one number')
], async (req, res) => {const errors = validationResult(req)
        if (!errors.isEmpty()) { return res.status(400).json({ error: errors.array()[0].msg })}
    const { email, password } = req.body

    // 1. Basic validation check
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password' })
    }

    try {
        // 2. Check if the user email already exists in the database
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists' })
        }

        // 3. Encrypt (hash) the password securely using bcryptjs
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // 4. Insert the new user profile into the PostgreSQL database columns
        const newUser = await db.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, hashedPassword]
        )

        // 5. Send back a successful registration summary (Never send back the password!)
        res.status(201).json({
            message: 'User account created successfully!',
            user: newUser.rows[0]
        })

    } catch (err) {
        console.error('Registration Error:', err.message)
        res.status(500).json({ error: 'Internal server testing error' })
    }
})
app.post('/api/login', async (req, res) => {const {email, password} = req.body
if (!email || !password) { return res.status(400).json({error: 'Please provide email and password'})}
try {const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {return res.status(401).json({error: 'Invalid email or password'})}
const user = result.rows[0]
const isMatch = await bcrypt.compare(password, user.password)
if (!isMatch) {return res.status(401).json({error: 'Invalid email or password'})}
const token= jwt.sign({userId: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'})
res.json ({message: 'Login successful!', token: token, user: {id: user.id, email: user.email}})}
catch (err) {console.error('Login Error:', err.message)
    res.status(500).json({error: 'Internal server login error.'})
}})
const authenticateToken = (req, res, next) => {const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {return res.status(401).json({error: 'Access denied. No session token provided.'})}
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedData) => {
        if (err) {return res.status(403).json({error: 'Invalid or expired session token.'})}
        req.userId=decodedData.userId
        console.log('User logged in and verified.')
        next()
    })
}
app.get('/api/profile', [
        authenticateToken// Runs token check first
                            ],
 async(req,res)=> { 
    try {
    const result = await db.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.userId])
    if (result.rows.length === 0) {return res.status(404).json({error: 'User profile not found.'})}
    res.json({message: 'Protected dashboard data accessed successfully', profile: result.rows[0]})
}
catch(err){console.error('Failed')
     res.status(500).json({error: 'failed to retrieve secure profile'})}})
app.patch('/api/profile/update-email', authenticateToken, async (req, res) => {const {newEmail} = req.body
if (!newEmail || newEmail.trim() === '') return res.status(400).json({error: 'new email is empty'
})
try {const result = await db.query ('UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email', [newEmail, req.userId])
    res.json({message: 'Email updated successfully', user: result.rows[0]})
}
catch (err){ if (err.code === '23505') {return res.status(400).json({error: 'This email is already in use'})}
res.status(500).json({error: 'Failed to update email'})}})
app.delete('/api/profile/delete', authenticateToken, async (req, res) => {
  try {await db.query('DELETE FROM users WHERE id = $1', [req.userId])
    res.json({message: 'Account deleted.'})
  }
  catch(err) {res.status(500).json({error: 'Failed to delete account'})} 
})
const PORT = process.env.PORT || 5000
app.listen(PORT, '::', () => {
    console.log(`Server running and listening for signups on port ${PORT}`)
})
