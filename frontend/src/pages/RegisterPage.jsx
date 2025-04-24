const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  try {
    console.log('Attempting registration with:', {
      email,
      password,
      role
    });

    const response = await api.post('/auth/register', {
      email,
      password,
      role
    });

    console.log('Registration response:', response.data);

    // Store the token and role
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userRole', response.data.user.role);
    localStorage.setItem('userEmail', response.data.user.email);

    // Redirect based on role
    if (response.data.user.role === 'speaker') {
      navigate('/speaker-dashboard');
    } else {
      navigate('/listener-dashboard');
    }
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    setError(error.response?.data?.message || 'Registration failed');
  }
}; 