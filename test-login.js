const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    // Test with one of the existing users
    const loginData = {
      email: 'akashraikwar763@gmail.com',
      password: 'password123' // This might not be the correct password
    };

    console.log('Attempting login with:', loginData.email);
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful!');
      console.log('Token:', data.token ? 'Present' : 'Missing');
      console.log('User:', data.user ? 'Present' : 'Missing');
      
      if (data.token) {
        // Test a protected endpoint
        console.log('\nTesting protected endpoint...');
        const protectedResponse = await fetch('http://localhost:5000/api/departments', {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Protected endpoint status:', protectedResponse.status);
        if (protectedResponse.ok) {
          const protectedData = await protectedResponse.json();
          console.log('Protected endpoint response:', protectedData);
        } else {
          const errorData = await protectedResponse.json();
          console.log('Protected endpoint error:', errorData);
        }
      }
    } else {
      const errorData = await response.json();
      console.log('Login failed:', errorData);
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin(); 