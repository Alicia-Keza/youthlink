import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'youth', consent: false });
  const [error, setError] = useState('');

  function updateField(e) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card form narrow" onSubmit={handleSubmit}>
      <h1>Create your account</h1>
      {error && <p className="error">{error}</p>}

      <label>
        Full name
        <input name="name" value={form.name} onChange={updateField} required />
      </label>
      <label>
        Email
        <input type="email" name="email" value={form.email} onChange={updateField} required />
      </label>
      <label>
        Password
        <input type="password" name="password" value={form.password} onChange={updateField} minLength={8} required />
        <span className="muted">At least 8 characters</span>
      </label>
      <label>
        I am joining as
        <select name="role" value={form.role} onChange={updateField}>
          <option value="youth">Youth (student, graduate or young entrepreneur)</option>
          <option value="mentor">Mentor</option>
          <option value="investor">Investor</option>
        </select>
      </label>

      <label className="checkbox">
        <input type="checkbox" name="consent" checked={form.consent} onChange={updateField} required />
        <span>
          I agree that YouthLink stores and uses the information I provide to run the platform.
          I can delete my account and my data at any time.
        </span>
      </label>

      <button className="button" type="submit">Sign up</button>
      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
