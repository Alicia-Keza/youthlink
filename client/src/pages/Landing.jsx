import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const STEPS = [
  { title: 'Create your profile', text: 'Add your skills, education, interests and ideas.' },
  { title: 'Discover matches', text: 'See people whose skills complement yours.' },
  { title: 'Connect', text: 'Send a connection request to the people you want to work with.' },
  { title: 'Form a team', text: 'Bring your connections together and start building.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      <section className="hero">
        <h1>Turn your skills and ideas into a real business</h1>
        <p>
          YouthLink connects young people with complementary skills. A developer, a marketer and
          someone with a business idea can find each other, form a team and build something together.
        </p>
        {user ? (
          <Link to="/dashboard" className="button">Go to my dashboard</Link>
        ) : (
          <div className="row center">
            <Link to="/register" className="button">Get started</Link>
            <Link to="/login" className="button secondary">Log in</Link>
          </div>
        )}
      </section>

      <h2>How it works</h2>
      <div className="grid">
        {STEPS.map((step, index) => (
          <div className="card" key={step.title}>
            <p className="step-number">{index + 1}</p>
            <h3>{step.title}</h3>
            <p className="muted">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
