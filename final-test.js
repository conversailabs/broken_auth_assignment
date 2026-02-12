const http = require('http');
const fs = require('fs');

let sessionData = {};

function makeRequest(method, pathname, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: pathname,
      method: method,
      headers: defaultHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runFullFlow() {
  const results = [];
  
  results.push('='.repeat(70));
  results.push('COMPLETE AUTHENTICATION FLOW TEST');
  results.push('='.repeat(70));
  results.push('');

  // TASK 1: Login
  results.push('═'.repeat(70));
  results.push('TASK 1: LOGIN');
  results.push('═'.repeat(70));
  results.push('curl -X POST http://localhost:3000/auth/login \\');
  results.push('  -H "Content-Type: application/json" \\');
  results.push('  -d \'{"email":"deepak@example.com","password":"password123"}\'');
  results.push('');

  try {
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'deepak@example.com',
      password: 'password123'
    });

    results.push(`HTTP/1.1 ${loginResponse.status}`);
    results.push(loginResponse.body);
    results.push('');

    const loginData = JSON.parse(loginResponse.body);
    sessionData.loginSessionId = loginData.loginSessionId;
    results.push(`Session ID obtained: ${sessionData.loginSessionId}`);
    results.push('');

  } catch (err) {
    results.push(`ERROR: ${err.message}`);
    results.push('');
    return results.join('\n');
  }

  // TASK 2: Verify OTP
  results.push('═'.repeat(70));
  results.push('TASK 2: VERIFY OTP');
  results.push('═'.repeat(70));
  
  // First, get the OTP from debug endpoint
  results.push(`GET /debug/otp/${sessionData.loginSessionId}`);
  results.push('');

  let otp = null;
  try {
    const otpResponse = await makeRequest('GET', `/debug/otp/${sessionData.loginSessionId}`);
    results.push(`HTTP/1.1 ${otpResponse.status}`);
    results.push(otpResponse.body);
    results.push('');

    const otpData = JSON.parse(otpResponse.body);
    otp = otpData.otp;
    results.push(`OTP obtained: ${otp}`);
    results.push('');

  } catch (err) {
    results.push(`ERROR getting OTP: ${err.message}`);
    results.push('');
    return results.join('\n');
  }

  // Now verify the OTP
  results.push('curl -c cookies.txt -X POST http://localhost:3000/auth/verify-otp \\');
  results.push('  -H "Content-Type: application/json" \\');
  results.push(`  -d '{"loginSessionId":"${sessionData.loginSessionId}","otp":"${otp}"}'`);
  results.push('');

  let sessionCookie = null;
  try {
    const verifyResponse = await makeRequest('POST', '/auth/verify-otp', {
      loginSessionId: sessionData.loginSessionId,
      otp: otp.toString()
    });

    results.push(`HTTP/1.1 ${verifyResponse.status}`);
    results.push(verifyResponse.body);
    results.push('');

    // Extract session cookie
    if (verifyResponse.headers['set-cookie']) {
      sessionCookie = verifyResponse.headers['set-cookie'][0];
      results.push(`Cookie received: ${sessionCookie.split(';')[0]}`);
      results.push('');
    }

  } catch (err) {
    results.push(`ERROR: ${err.message}`);
    results.push('');
    return results.join('\n');
  }

  // TASK 3: Get Token
  results.push('═'.repeat(70));
  results.push('TASK 3: GET ACCESS TOKEN');
  results.push('═'.repeat(70));
  results.push('curl -b cookies.txt -X POST http://localhost:3000/auth/token');
  results.push('');

  let accessToken = null;
  try {
    const tokenResponse = await makeRequest('POST', '/auth/token', null, {
      'Cookie': sessionCookie
    });

    results.push(`HTTP/1.1 ${tokenResponse.status}`);
    results.push(tokenResponse.body);
    results.push('');

    const tokenData = JSON.parse(tokenResponse.body);
    accessToken = tokenData.access_token;
    results.push('');

  } catch (err) {
    results.push(`ERROR: ${err.message}`);
    results.push('');
    return results.join('\n');
  }

  // TASK 4: Access Protected Route
  results.push('═'.repeat(70));
  results.push('TASK 4: ACCESS PROTECTED ROUTE');
  results.push('═'.repeat(70));
  results.push(`curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/protected`);
  results.push('');

  try {
    const protectedResponse = await makeRequest('GET', '/protected', null, {
      'Authorization': `Bearer ${accessToken}`
    });

    results.push(`HTTP/1.1 ${protectedResponse.status}`);
    results.push(protectedResponse.body);
    results.push('');

    // Extract and display success flag
    const protectedData = JSON.parse(protectedResponse.body);
    if (protectedData.success_flag) {
      results.push('SUCCESS FLAG:');
      results.push(protectedData.success_flag);
      results.push('');
    }

  } catch (err) {
    results.push(`ERROR: ${err.message}`);
    results.push('');
  }

  results.push('═'.repeat(70));
  results.push('TEST COMPLETE');
  results.push('═'.repeat(70));

  const finalOutput = results.join('\n');
  console.log(finalOutput);
  
  // Write to output.txt
  fs.writeFileSync('output.txt', finalOutput, 'utf8');
  console.log('\n[Output saved to output.txt]');

  return finalOutput;
}

runFullFlow().catch(err => {
  console.error('FATAL ERROR:', err);
  const errorOutput = `FATAL ERROR: ${err.message}\n\n${err.stack}`;
  fs.writeFileSync('output.txt', errorOutput, 'utf8');
});
