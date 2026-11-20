# YouthLink

A platform to transform ideas into real businesses through the collaboration of youth with different skills.

**Live demo:** the link will be added here after deployment.

## About

YouthLink helps young people connect, share their skills and ideas, and find others with complementary skills. For example, a software developer can match with someone who has a business idea, marketing skills or financial skills, so they can form a team and develop a project together. Teams can then ask mentors for guidance, receive feedback, and attract investors.

## How it works

Create Account → Create Profile → Add Skills and Ideas → Discover Matches → Connect → Form Team → Develop Project → Explore Mentorship and Business Opportunities

## Features

| Feature | Requirement | What users can do |
|---|---|---|
| Registration and login | FR1 | Sign up as a youth, mentor or investor, give consent, log in and out, delete their account |
| User profile | FR2 | Add skills, bio, education, location, interests and the skills they are looking for |
| Skill-based matching | FR3 | See people with complementary skills, best match first, with search and filter |
| Connections | FR4 | Send, accept and decline connection requests |
| Team formation | FR5 | Form a team with connections and see which skill areas the team covers |
| Project management | FR6 | Create and edit projects, update their stage, browse all projects, show interest in investing |
| Mentorship | FR7 | Ask a mentor to guide the team, accept or decline as a mentor, give feedback on projects |
| In-app messaging | FR8 | Send private messages to connections, delivered in real time |
| Notifications | FR9 | Get notified about requests, teams, messages, mentorship and feedback, with an unread count |
| Admin moderation | FR10 | Report content; admins remove inappropriate content and suspend users |
| Help page | SRS 2.6 | Step by step user guide and frequently asked questions |

## Tech stack

- Frontend: React (Vite), React Router, plain CSS
- Backend: Node.js and Express (REST API with JSON)
- Real time: Socket.IO
- Database: SQLite (better-sqlite3)
- Authentication: JWT, passwords hashed with bcrypt
- Security: helmet, login rate limiting, input checks
- Testing: Jest and Supertest
- Hosting: Render (free plan)

## Development model

The project follows the Agile model and was built in short sprints. Each sprint ends with testing and feedback before the next one starts.

| Sprint | Focus | Status |
|---|---|---|
| 1 | Planning and design (SRS and UML diagrams) | Done |
| 2 | Core platform: accounts, profiles, matching, connections, teams | Done |
| 3 | Projects and mentorship | Done |
| 4 | Messaging, notifications and admin | Done |
| 5 | Security, backups, deployment, testing and handover | In progress |

## Run it on your computer

### What you need

- [Node.js](https://nodejs.org) version 20 or newer. Check with `node --version`.
- [Git](https://git-scm.com), to download the code.

### 1. Download the code

```
git clone https://github.com/Alicia-Keza/youthlink.git
cd youthlink
```

### 2. Install and start the server

```
cd server
npm install
npm run seed
npm start
```

Leave this terminal open. You should see `YouthLink API running on http://localhost:4000`.

`npm run seed` fills the database with demo accounts, a team and a project. It deletes all existing data first, so only run it when you want to start fresh.

### 3. Install and start the client

Open a **second** terminal in the `youthlink` folder:

```
cd client
npm install
npm run dev
```

Then open http://localhost:5173 in the browser.

### 4. Log in with a demo account

The password for every demo account is `password123`.

| Name | Email | Role | Good for trying |
|---|---|---|---|
| Eric Mugisha | eric@example.com | Youth (Technology) | Matches, connections, teams, projects, messages |
| Diane Uwase | diane@example.com | Youth (Marketing) | Messaging Eric live from a second browser |
| Patrick Nshuti | patrick@example.com | Youth (Business) | Team member of Farm Connect |
| Grace Ingabire | grace@example.com | Youth (Design) | Has a pending connection request to Eric |
| Samuel Habimana | samuel@example.com | Youth (Finance) | A match for Eric who is not connected yet |
| Claudine Mukamana | claudine@example.com | Youth (Media) | Another match |
| Jean Paul Niyonzima | mentor@example.com | Mentor | Mentoring page, feedback on projects |
| Aline Uwimana | investor@example.com | Investor | "Interested in investing", feedback, reporting |
| YouthLink Admin | admin@example.com | Administrator | Admin page: reports and suspending users |

The demo data also includes a team called **Farm Connect** (Eric, Diane and Patrick) with a project and a mentorship request waiting for Jean Paul to answer.

### To stop

Press `Ctrl + C` in each terminal.

## Running the tests

```
cd server
npm test
```

There are 131 API tests covering FR1 to FR10, security, input checks, backups and the demo data.

## Settings

The server reads these environment variables. All of them have defaults for local development.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Port of the server |
| `NODE_ENV` | not set | Set to `production` on the live server: serves the React pages, forces HTTPS and requires `JWT_SECRET` |
| `JWT_SECRET` | development value | Secret used to sign login tokens. Required in production |
| `DB_FILE` | `server/youthlink.db` | Location of the SQLite database file |
| `BACKUP_DIR` | `server/backups` | Folder for the daily database backups |
| `SEED_IF_EMPTY` | not set | When `true`, the demo data is added if the database is empty at start-up |

## Deployment

The live version runs on [Render](https://render.com)'s free plan. The settings are in [render.yaml](render.yaml).

1. Sign in to Render with GitHub.
2. Choose **New** → **Blueprint** and select this repository.
3. Render reads `render.yaml`, builds the app with `npm run build` and starts it with `npm start`. It also creates a random `JWT_SECRET`.
4. When the build finishes, Render shows the public link.

In production a single Express server sends both the API and the React pages, so there is only one link.

### Limits of the free plan

- The app goes to sleep after 15 minutes without visitors. The first visit after that can take up to a minute while it wakes up.
- The free plan has no permanent disk, so the database is emptied every time the app restarts or wakes up. The demo accounts are added again automatically (`SEED_IF_EMPTY=true`), but accounts and content created on the live site do not last. For the same reason, the daily backups only work properly on a paid plan with a disk, or when running on your own computer.

## Security and privacy

- Passwords are hashed with bcrypt and never stored as plain text
- Users must give consent at sign-up and can delete their account and all their data
- After 10 wrong passwords, login is blocked for 15 minutes
- Every form field is checked on the server for type and length
- Security headers are sent with every response, and HTTPS is required in production
- Only connected users can message each other, and email addresses are not shown to other users
- Administrators can suspend users and remove reported content

## How matching works

Each user adds the skills they have, and chooses the skill areas they are looking for in a teammate. Two users are a match when one of them has skills in an area the other is looking for. Matches are ordered by a score:

- 3 points for each skill area the other person has that I am looking for
- 2 points for each skill area I have that the other person is looking for
- 1 point for each shared interest

## Troubleshooting

| Problem | Solution |
|---|---|
| Login or sign-up does nothing or shows an error | The server is not running. Start it with `npm start` in the `server` folder and keep that terminal open |
| "Too many failed login attempts" | Wait 15 minutes, or restart the server when running it on your computer |
| No matches | Add at least one skill and tick the skill areas you are looking for on your profile |
| The live site is slow to open | It is waking up after sleeping. Wait up to a minute |
| `npm start` says it cannot find package.json | Make sure you are inside the `server` folder |

## API overview

All routes except register, login and health need the header `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Check that the server is running |
| POST | `/api/auth/register` | Create an account (consent is required) |
| POST | `/api/auth/login` | Log in and get a token |
| GET | `/api/auth/me` | Get the logged in user |
| DELETE | `/api/auth/me` | Delete my account and data |
| GET | `/api/profile/me` | Get my profile |
| PUT | `/api/profile/me` | Update my profile (mentors and investors can also send `expertise` and `focusAreas`) |
| POST | `/api/profile/me/skills` | Add a skill |
| DELETE | `/api/profile/me/skills/:id` | Remove a skill |
| GET | `/api/profile/:userId` | View another user's profile |
| GET | `/api/matches` | Get my matches (`search` and `category` are optional) |
| GET | `/api/connections` | List my requests and connections |
| POST | `/api/connections` | Send a connection request |
| PUT | `/api/connections/:id/accept` | Accept a request |
| PUT | `/api/connections/:id/decline` | Decline a request |
| GET | `/api/teams` | List my teams |
| POST | `/api/teams` | Create a team with connected users |
| GET | `/api/teams/:id` | Team details and members |
| POST | `/api/teams/:id/members` | Add a connected user to the team |
| DELETE | `/api/teams/:id/members/me` | Leave the team |
| GET | `/api/projects` | Browse all projects (`stage` and `teamId` are optional) |
| POST | `/api/projects` | Create a project for one of my teams |
| GET | `/api/projects/:id` | Project details |
| PUT | `/api/projects/:id` | Edit the title and description (team members only) |
| PUT | `/api/projects/:id/stage` | Update the stage (team members only) |
| POST | `/api/projects/:id/interest` | Show interest in investing (investors only) |
| DELETE | `/api/projects/:id/interest` | Remove my interest |
| POST | `/api/projects/:id/feedback` | Give feedback on a project (mentors and investors only) |
| GET | `/api/mentorship/mentors` | List mentors |
| POST | `/api/mentorship` | Ask a mentor to guide my team |
| GET | `/api/mentorship/team/:teamId` | Mentorship requests of my team |
| GET | `/api/mentorship/requests` | Mentor dashboard: pending requests and teams I mentor |
| PUT | `/api/mentorship/:id/accept` | Accept a mentorship request (mentor only) |
| PUT | `/api/mentorship/:id/decline` | Decline a mentorship request (mentor only) |
| GET | `/api/messages` | My conversations with the last message and unread count |
| GET | `/api/messages/:userId` | Messages with one user (marks them as read) |
| POST | `/api/messages/:userId` | Send a message to a connection |
| GET | `/api/notifications` | My notifications and the unread count |
| PUT | `/api/notifications/:id/read` | Mark one notification as read |
| PUT | `/api/notifications/read-all` | Mark all notifications as read |
| POST | `/api/reports` | Report a project or feedback as inappropriate |
| GET | `/api/admin/users` | All users (admin only) |
| PUT | `/api/admin/users/:id/suspend` | Suspend a user (admin only) |
| PUT | `/api/admin/users/:id/unsuspend` | Unsuspend a user (admin only) |
| GET | `/api/admin/reports` | Open reports, or all with `?status=all` (admin only) |
| PUT | `/api/admin/reports/:id/remove` | Remove the reported content (admin only) |
| PUT | `/api/admin/reports/:id/dismiss` | Keep the content and close the report (admin only) |

Project stages are Idea, Planning, In development and Launched.

Real-time events are sent with Socket.IO on the same server. The browser connects with its login token and receives `message` and `notification` events.

## Project structure

```
youthlink/
  package.json    build and start commands used by Render
  render.yaml     Render settings
  client/         React frontend
    src/pages/        one file per page
    src/components/   navbar, notification count, report button and other shared parts
  server/         Express API
    src/routes/       one file per part of the API
    src/schema.sql    database tables
    src/seed.js       demo data
    src/backup.js     daily database backup
    tests/            API tests
```
