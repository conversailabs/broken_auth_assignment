const http = require('http');
const fs = require('fs');
const path = require('path');

let sessionData = {
  loginSessionId: null,
  otp: null,
  sessionCookie: null,
  accessToken: null
};

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readServerLogs(lookFor) {
  // Wait a bit for server to write logs
  await sleep(500);
  
  try {
    // Check if server is writing to console and capturable
    // For now, just return a placeholder
    return null;
  } catch (err) {
    return null;
  }
}

async function runTests() {
  const output = [];
  const testLog = [];
  
  output.push('='.repeat(70));
  output.push('AUTHENTICATION FLOW DEBUG & TEST');
  output.push('='.repeat(70));
  output.push('');

  // TASK 1: LOGIN
  output.push('TASK 1: LOGIN');
  output.push('-'.repeat(70));
  
  const loginCmd = 'curl -X POST http://localhost:3000/auth/login \\';
  const loginCmd2 = '  -H "Content-Type: application/json" \\';
  const loginCmd3 = '  -d \'{"email":"deepak@example.com","password":"password123"}\'';
  
  output.push(loginCmd);
  output.push(loginCmd2);
  output.push(loginCmd3);
  output.push('');

  try {
    testLog.push(loginCmd);
    testLog.push(loginCmd2);
    testLog.push(loginCmd3);
    testLog.push('');

    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'deepak@example.com',
      password: 'password123'
    });

    output.push('Response Status: ' + loginResponse.status);
    output.push('Response Body:');
    output.push(loginResponse.body);
    output.push('');

    testLog.push('Response Status: ' + loginResponse.status);
    testLog.push('Response Body:');
    testLog.push(loginResponse.body);
    testLog.push('');

    const loginData = JSON.parse(loginResponse.body);
    sessionData.loginSessionId = loginData.loginSessionId;
    
    output.push('Extracted loginSessionId: ' + sessionData.loginSessionId);
    output.push('');
    testLog.push('Extracted loginSessionId: ' + sessionData.loginSessionId);
    testLog.push('');

  } catch (err) {
    output.push('ERROR: ' + err.message);
    testLog.push('ERROR: ' + err.message);
  }

  output.push('Note: Check server console output for [OTP] message');
  output.push('The OTP value is logged by the server but not returned in the response.');
  output.push('');
  testLog.push('Note: Check server console output for [OTP] message');
  testLog.push('');

  output.push('-'.repeat(70));
  output.push('');

  // TASK 2: VERIFY OTP
  // Since we can't easily capture the OTP from server logs in this approach,
  // we'll show what the command should be
  output.push('TASK 2: VERIFY OTP');
  output.push('-'.repeat(70));
  
  const verifyCmd = `curl -c cookies.txt -X POST http://localhost:3000/auth/verify-otp \\`;
  const verifyCmd2 = `  -H "Content-Type: application/json" \\`;
  const verifyCmd3 = `  -d '{"loginSessionId":"${sessionData.loginSessionId}","otp":"<OTP_FROM_SERVER_LOG>"}'`;
  
  output.push(verifyCmd);
  output.push(verifyCmd2);
  output.push(verifyCmd3);
  output.push('');
  output.push('INSTRUCTIONS:');
  output.push('1. Look at the server output above for a message like: [OTP] Session xxx generated');
  output.push('2. The OTP is a 6-digit number');
  output.push('3. Replace <OTP_FROM_SERVER_LOG> with the actual OTP and run the command');
  output.push('4. This will create a cookies.txt file with the session cookie');
  output.push('');

  testLog.push(verifyCmd);
  testLog.push(verifyCmd2);
  testLog.push(verifyCmd3);
  testLog.push('');
  testLog.push('INSTRUCTIONS:');
  testLog.push('1. Look at the server output for a message like: [OTP] Session xxx generated');
  testLog.push('2. The OTP is a 6-digit number');
  testLog.push('3. Replace <OTP_FROM_SERVER_LOG> with the actual OTP and run the command');
  testLog.push('4. This will create a cookies.txt file with the session cookie');
  testLog.push('');

  output.push('-'.repeat(70));
  output.push('');

  // For testing purposes, let's try with a fake OTP to show the flow
  // In real testing, you'd get the actual OTP from server logs
  output.push('TESTING WITH SAMPLE OTP (123456):');
  output.push('');

  try {
    // Note: We're using a placeholder OTP for demonstration
    // In actual testing, replace this with the real OTP from server logs
    const verifyResponse = await makeRequest('POST', '/auth/verify-otp', {
      loginSessionId: sessionData.loginSessionId,
      otp: 123456  // This won't match, used for demonstration
    });

    output.push('Response Status: ' + verifyResponse.status);
    output.push('Response Body:');
    output.push(verifyResponse.body);
    output.push('');
    output.push('(This will likely fail because OTP is incorrect)');
    output.push('');

  } catch (err) {
    output.push('ERROR: ' + err.message);
  }

  output.push('-'.repeat(70));
  output.push('');

  // TASK 3: TOKEN GENERATION
  output.push('TASK 3: GET ACCESS TOKEN');
  output.push('-'.repeat(70));
  
  const tokenCmd = 'curl -b cookies.txt -X POST http://localhost:3000/auth/token';
  
  output.push(tokenCmd);
  output.push('');
  output.push('This command requires cookies.txt created in Task 2');
  output.push('');

  testLog.push(tokenCmd);
  testLog.push('');
  testLog.push('This command requires cookies.txt created in Task 2');
  testLog.push('');

  output.push('-'.repeat(70));
  output.push('');

  // TASK 4: PROTECTED ROUTE
  output.push('TASK 4: ACCESS PROTECTED ROUTE');
  output.push('-'.repeat(70));
  
  const protectedCmd = 'curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:3000/protected';
  
  output.push(protectedCmd);
  output.push('');
  output.push('This command requires the JWT token from Task 3');
  output.push('The response should contain a success_flag in the format:');
  output.push('FLAG-<base64_encoded_email_COMPLETED_ASSIGNMENT>');
  output.push('');

  testLog.push(protectedCmd);
  testLog.push('');
  testLog.push('This command requires the JWT token from Task 3');
  testLog.push('The response should contain a success_flag');
  testLog.push('');

  output.push('-'.repeat(70));
  output.push('');

  const fullOutput = output.join('\n');
  const fullTestLog = testLog.join('\n');

  console.log(fullOutput);
  
  // Write to files
  fs.writeFileSync('output.txt', fullTestLog, 'utf8');
  fs.writeFileSync('test-output.txt', fullOutput, 'utf8');

  console.log('\n\n[Files created: output.txt and test-output.txt]');

  return fullOutput;
}

runTests().catch(console.error);
