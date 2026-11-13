import { useEffect, useState } from 'react';
import { api } from '../api';
import { SKILL_CATEGORIES } from '../constants';

export default function Profile() {
  const [form, setForm] = useState({ bio: '', education: '', location: '', interests: '', lookingFor: [] });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/profile/me')
      .then(({ profile }) => {
        setForm({
          bio: profile.bio,
          education: profile.education,
          location: profile.location,
          interests: profile.interests.join(', '),
          lookingFor: profile.lookingFor,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleLookingFor(category) {
    const selected = form.lookingFor.includes(category)
      ? form.lookingFor.filter((item) => item !== category)
      : [...form.lookingFor, category];
    setForm({ ...form, lookingFor: selected });
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api('/profile/me', {
        method: 'PUT',
        body: { ...form, interests: form.interests.split(',') },
      });
      setMessage('Profile saved');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>My profile</h1>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <form className="card form" onSubmit={saveProfile}>
        <h2>About me</h2>
        <label>
          Bio
          <textarea name="bio" value={form.bio} onChange={updateField} maxLength={500} rows={3} />
        </label>
        <label>
          Education
          <input name="education" value={form.education} onChange={updateField} />
        </label>
        <label>
          Location
          <input name="location" value={form.location} onChange={updateField} />
        </label>
        <label>
          Interests and ideas
          <input name="interests" value={form.interests} onChange={updateField} placeholder="Agriculture, Education, Health" />
          <span className="muted">Separate them with commas</span>
        </label>

        <fieldset>
          <legend>Skills I am looking for in a teammate</legend>
          <div className="checkbox-list">
            {SKILL_CATEGORIES.map((category) => (
              <label key={category} className="checkbox">
                <input
                  type="checkbox"
                  checked={form.lookingFor.includes(category)}
                  onChange={() => toggleLookingFor(category)}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="button" type="submit">Save profile</button>
      </form>
    </div>
  );
}
