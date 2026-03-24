const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose'); // Import mongoose to close DB connection

describe('User API', () => {
  let server;
  let uniqueEmail = ""; // Store unique email for both tests

  beforeAll((done) => {
    server = app.listen(4001, done); // Use a test port
  });

  // Properly close server and mongoose connection after tests
  afterAll(async () => {
    await server.close();
    await mongoose.connection.close();
  });

  test('Register a new user', async () => {
    uniqueEmail = `testuser_${Date.now()}@example.com`; // Generate unique email
    const res = await request(server)
      .post('/register')
      .send({
        user_name: "Test User",
        user_email: uniqueEmail,
        user_password: "Test@1234",
        user_company: "TestCompany"
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
  });

  test('Login with registered user', async () => {
    const res = await request(server)
      .post('/login')
      .send({
        useremail: uniqueEmail,
        password: "Test@1234"
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});