import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { SKILL_CATEGORIES } from '../constants';
import SkillTag from '../components/SkillTag';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Mentors and investors have extra fields and do not look for teammates
  const isMentorOrInvestor = user.role === 'mentor' || user.role === 'investor';
  const [form, setForm] = useState({
    bio: '',
    education: '',
    location: '',
    interests: '',
    lookingFor: [],
    expertise: '',
    focusAreas: '',
  });
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', category: SKILL_CATEGORIES[0] });
  const [deletePassword, setDeletePassword] = useState('');
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
          expertise: profile.expertise || '',
          focusAreas: (profile.focusAreas || []).join(', '),
        });
        setSkills(profile.skills);
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
        body: { ...form, interests: form.interests.split(','), focusAreas: form.focusAreas.split(',') },
      });
      setMessage('Profile saved');
    } catch (err) {
      setError(err.message);
    }
  }

  async function addSkill(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const data = await api('/profile/me/skills', { method: 'POST', body: newSkill });
      setSkills([...skills, data.skill]);
      setNewSkill({ ...newSkill, name: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSkill(skillId) {
    try {
      await api(`/profile/me/skills/${skillId}`, { method: 'DELETE' });
      setSkills(skills.filter((skill) => skill.id !== skillId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setError('');
    if (!window.confirm('This will permanently delete your account and all your data. Continue?')) {
      return;
    }
    try {
      await api('/auth/me', { method: 'DELETE', body: { password: deletePassword } });
      logout();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>My profile</h1>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>My skills</h2>
        {skills.length === 0 && <p className="muted">You have not added any skills yet.</p>}
        <div className="tags">
          {skills.map((skill) => (
            <span key={skill.id} className="tag-with-remove">
              <SkillTag skill={skill} />
              <button className="link-button" onClick={() => removeSkill(skill.id)} aria-label={`Remove ${skill.name}`}>
                Remove
              </button>
            </span>
          ))}
        </div>

        <form className="row" onSubmit={addSkill}>
          <input
            placeholder="Skill, for example Web development"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            required
          />
          <select value={newSkill.category} onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}>
            {SKILL_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <button className="button" type="submit">Add skill</button>
        </form>
      </section>

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

        {isMentorOrInvestor ? (
          <>
            <label>
              My expertise
              <input
                name="expertise"
                value={form.expertise}
                onChange={updateField}
                placeholder="For example Business strategy, Marketing, Software"
              />
            </label>
            <label>
              Focus areas
              <input
                name="focusAreas"
                value={form.focusAreas}
                onChange={updateField}
                placeholder="Agriculture, Education, Health"
              />
              <span className="muted">The kinds of projects you want to support. Separate them with commas</span>
            </label>
          </>
        ) : (
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
        )}

        <button className="button" type="submit">Save profile</button>
      </form>

      <form className="card form danger-zone" onSubmit={deleteAccount}>
        <h2>Delete my account</h2>
        <p className="muted">
          This removes your account, profile, skills, connections and team memberships. It cannot be undone.
        </p>
        <label>
          Enter your password to confirm
          <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required />
        </label>
        <button className="button danger" type="submit">Delete my account</button>
      </form>
    </div>
  );
}
