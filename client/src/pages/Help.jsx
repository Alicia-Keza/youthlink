import { Link } from 'react-router-dom';

// Step by step guide for each part of YouthLink
const GUIDE = [
  {
    title: 'Create your account',
    steps: [
      'Click "Sign up" at the top of the page.',
      'Enter your name, email and a password of at least 8 characters.',
      'Choose if you are joining as a youth, a mentor or an investor.',
      'Tick the box to agree to how your data is used, then click "Sign up".',
    ],
  },
  {
    title: 'Complete your profile',
    steps: [
      'Open "Profile" in the menu.',
      'Add your skills, for example "Web development" in the Technology area.',
      'Write a short bio and add your education, location and interests.',
      'Tick the skill areas you are looking for in a teammate, then click "Save profile".',
    ],
  },
  {
    title: 'Find people with complementary skills',
    steps: [
      'Open "Matches". People whose skills complete yours are shown first.',
      'Each card shows what they can help you with and what you can help them with.',
      'Use the search box or the skill area filter to narrow the list.',
      'Click "Connect" to send a connection request.',
    ],
  },
  {
    title: 'Connect and form a team',
    steps: [
      'Open "Connections" to accept or decline the requests you received.',
      'Open "Teams", give your team a name and tick the connections you want in it.',
      'The team page shows which skill areas your team covers and which are missing.',
    ],
  },
  {
    title: 'Start a project',
    steps: [
      'Open your team and click "Start a project".',
      'Give it a title, describe it and choose its stage (Idea, Planning, In development or Launched).',
      'Update the stage as your team makes progress. Everyone can see your project on the "Projects" page.',
    ],
  },
  {
    title: 'Get a mentor',
    steps: [
      'Open your team and click "Find a mentor".',
      'Choose a mentor whose expertise fits your project and tell them what you need help with.',
      'When the mentor accepts, they can follow your projects and give feedback.',
    ],
  },
  {
    title: 'Messages and notifications',
    steps: [
      'Click "Message" next to one of your connections to start a private conversation.',
      'New messages arrive straight away, without refreshing the page.',
      'The number next to "Notifications" shows what you have not read yet: requests, new teams, messages and feedback.',
    ],
  },
  {
    title: 'For mentors and investors',
    steps: [
      'Add your expertise and the focus areas you want to support on your profile.',
      'Mentors open "Mentoring" to accept requests from teams and see the teams they mentor.',
      'Mentors and investors can give feedback on any project.',
      'Investors can click "I am interested in investing" on a project. The team will see your name.',
    ],
  },
];

const FAQ = [
  {
    question: 'Is YouthLink free?',
    answer: 'Yes. Creating an account and using all the features is free.',
  },
  {
    question: 'Why do I not see any matches?',
    answer:
      'Matches are based on your skills and the skill areas you are looking for. Add at least one skill and tick the skill areas you need on your profile, then open "Matches" again.',
  },
  {
    question: 'Can I message someone I am not connected with?',
    answer: 'No. To protect everyone, you can only send messages to people who accepted your connection request.',
  },
  {
    question: 'Who can see my email address?',
    answer: 'Nobody except you and the YouthLink administrators. Other users only see your name and profile.',
  },
  {
    question: 'Who can see my projects?',
    answer:
      'All logged in users can see your projects on the "Projects" page, so mentors and investors can find them. Only your team can edit them.',
  },
  {
    question: 'How do I report something inappropriate?',
    answer:
      'Click "Report" under the project or feedback and tell us why. An administrator will review it and remove it if it breaks the rules.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Open "Profile", scroll to "Delete my account" and enter your password. Your account, profile, skills, connections, messages and team memberships are deleted and cannot be brought back.',
  },
  {
    question: 'I made too many wrong login attempts. What now?',
    answer: 'For your safety, logins are paused after 10 wrong passwords. Wait 15 minutes and try again.',
  },
];

export default function Help() {
  return (
    <div>
      <h1>Help and user guide</h1>
      <p className="muted">How to use YouthLink, step by step, and answers to common questions.</p>

      <nav className="card help-contents" aria-label="Help topics">
        <h2>On this page</h2>
        <ol>
          {GUIDE.map((section, index) => (
            <li key={section.title}>
              <a href={`#guide-${index}`}>{section.title}</a>
            </li>
          ))}
          <li>
            <a href="#faq">Frequently asked questions</a>
          </li>
        </ol>
      </nav>

      {GUIDE.map((section, index) => (
        <section className="card" id={`guide-${index}`} key={section.title}>
          <h2>{section.title}</h2>
          <ol>
            {section.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ))}

      <section className="card" id="faq">
        <h2>Frequently asked questions</h2>
        {FAQ.map((item) => (
          <details className="faq" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <p className="muted">
        Ready to start? <Link to="/register">Create an account</Link> or <Link to="/login">log in</Link>.
      </p>
    </div>
  );
}
