import request from 'supertest'
import { app } from '../src/lib/socket.js'
import authRoutes from '../src/routes/auth.route.js'
import messageRoutes from '../src/routes/message.route.js'
import express from 'express'
import cookieParser from 'cookie-parser'

app.use(cookieParser())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)

describe('Auth Routes', () => {
  
  it('POST /api/auth/signup - missing fields should return 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({})
    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  it('POST /api/auth/signup - missing password should return 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'test@test.com', fullName: 'Test User' })
    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  it('POST /api/auth/login - missing fields should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  it('POST /api/auth/login - missing password should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' })
    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  // this doesnt work right now because we dont have a test database setup, but we should add it in the future
  
  // it('POST /api/auth/login - non existent user should return 400', async () => {
  //   const res = await request(app).post('/api/auth/login').send({ email: 'ghost@test.com', password: 'password123' })
  //   expect(res.statusCode).toBe(400)
  //   expect(res.body.message).toBe('User does not exist')
  // })

  it('POST /api/auth/logout - no auth should return 401', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.statusCode).toBe(401)
  })

  it('PUT /api/auth/profile - no auth should return 401', async () => {
    const res = await request(app).put('/api/auth/profile').send({})
    expect(res.statusCode).toBe(401)
  })

  it('GET /api/auth/check - no auth should return 401', async () => {
    const res = await request(app).get('/api/auth/check')
    expect(res.statusCode).toBe(401)
  })
})

describe('Message Routes', () => {
  
  it('GET /api/messages/users - no auth should return 401', async () => {
    const res = await request(app).get('/api/messages/users')
    expect(res.statusCode).toBe(401)
  })

  it('GET /api/messages/:id - no auth should return 401', async () => {
    const res = await request(app).get('/api/messages/someUserId')
    expect(res.statusCode).toBe(401)
  })

  it('POST /api/messages/send/:id - no auth should return 401', async () => {
    const res = await request(app).post('/api/messages/send/someUserId').send({})
    expect(res.statusCode).toBe(401)
  })
})