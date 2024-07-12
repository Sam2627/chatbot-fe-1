import config from './config.js';

const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const signUpForm = document.querySelector('.sign-up form');
const signInForm = document.querySelector('.sign-in form');

registerBtn.addEventListener('click', () => {
  container.classList.add("active"); 
  registerBtn.classList.add('active'); 
  loginBtn.classList.remove('active');  
});

loginBtn.addEventListener('click', () => {
  container.classList.remove("active");
  loginBtn.classList.add('active');   
  registerBtn.classList.remove('active'); 
});

function redirectToRole(redirectUrl) {
  window.location.href = redirectUrl;
}

// Signup form submission
signUpForm.addEventListener('submit', async (event) => {
  event.preventDefault(); 

  const userName = signUpForm.querySelector('input[placeholder="Name"]').value;
  const email = signUpForm.querySelector('input[type="email"]').value;
  const password = signUpForm.querySelector('input[type="password"]').value;

// Check if any field is empty
if (!userName || !email || !password) {
  alert('Xin hãy điền vào tất cả ô trống');
  return;
}

  try {
    const response = await fetch(`${config.apiUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_name: userName, email, password }) 
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User created:', data);

      container.classList.remove("active");
      loginBtn.classList.add('active');   
      registerBtn.classList.remove('active'); 
      signUpForm.reset(); 

    } else {
      const errorData = await response.json();
      console.error('Signup error:', errorData);
      alert(errorData.error || 'Failed to sign up');
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('An error occurred during signup');
  }
});

// Login form submission
signInForm.addEventListener('submit', async (event) => {
  event.preventDefault(); 

  const email = signInForm.querySelector('input[type="email"]').value;
  const password = signInForm.querySelector('input[type="password"]').value;

  // Check if any field is empty
  if (!email || !password) {
    alert('Xin hãy điền vào email và mật khẩu');
    return;
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
      localStorage.setItem('authToken', data.token); // Store JWT token in localStorage
      setTimeout(() => {
        redirectToRole(data.redirectUrl); 
      }, 1000); // Adjust delay as needed!
    } else if (response.status === 401) {
      console.error('Login error:', response.statusText);
      alert('Email hoặc mật khẩu không hợp lệ'); // Provide appropriate error message
    } else {
      const errorText = await response.text();
      console.error('Login error:', errorText);
      alert('Đã xảy ra lỗi trong quá trình đăng nhập'); // General error message
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Đã xảy ra lỗi trong quá trình đăng nhập');
  }
});

