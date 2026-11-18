# YouthLink

A platform to transform ideas into real businesses through the collaboration of youth with different skills.

## About

YouthLink helps young people connect, share their skills and ideas, and find others with complementary skills. For example, a software developer can match with someone who has a business idea, marketing skills or financial skills, so they can form a team and develop a project together. Later on, teams can get mentorship and attract investors.

## How it works

Create Account → Create Profile → Add Skills and Ideas → Discover Matches → Connect → Form Team → Develop Project → Explore Mentorship and Business Opportunities

## Features

| Feature | Requirement | Status |
|---|---|---|
| Registration and login | FR1 | Done |
| User profile with skills and interests | FR2 | Done |
| Skill-based matching | FR3 | Done |
| Connection requests | FR4 | Done |
| Team formation | FR5 | Done |
| Project management | FR6 | Done |
| Mentorship | FR7 | Done |
| In-app messaging | FR8 | Planned (Sprint 4) |
| Notifications | FR9 | Planned (Sprint 4) |
| Admin moderation | FR10 | Planned (Sprint 4) |

## Tech stack

- Frontend: React (Vite), React Router, plain CSS
- Backend: Node.js and Express (REST API with JSON)
- Database: SQLite
- Authentication: JWT, passwords hashed with bcrypt
- Testing: Jest and Supertest

## Development model

The project follows the Agile model and is built in short sprints. Each sprint ends with testing and feedback before the next one starts.

## Getting started

You need Node.js 20 or newer.

### 1. Start the server

```
cd server
npm install
npm run seed
npm start
```

The API runs on http://localhost:4000. `npm run seed` is optional, it fills the database with demo users.

### 2. Start the client

Open a second terminal:

```
cd client
npm install
npm run dev
```

Then open http://localhost:5173 in the browser.

### Demo accounts

After running the seed script you can log in with any of these accounts. The password for all of them is `password123`.

| Name | Email | Skills |
|---|---|---|
| Eric Mugisha | eric@example.com | Technology |
| Diane Uwase | diane@example.com | Marketing |
| Patrick Nshuti | patrick@example.com | Business |
| Grace Ingabire | grace@example.com | Design |
| Samuel Habimana | samuel@example.com | Finance |
| Claudine Mukamana | claudine@example.com | Media |
| Jean Paul Niyonzima | mentor@example.com | Mentor |
| Aline Uwimana | investor@example.com | Investor |

The seed data also adds a team called Farm Connect (Eric, Diane and Patrick) with one project and a mentorship request waiting for Jean Paul to answer.

### Settings

The server reads these environment variables. All of them have defaults for local development.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Port of the API |
| `JWT_SECRET` | development value | Secret used to sign login tokens. Must be changed in production |
| `DB_FILE` | `server/youthlink.db` | Location of the SQLite database file |

## Running the tests

```
cd server
npm test
```

## How matching works

Each user adds the skills they have, and chooses the skill areas they are looking for in a teammate. Two users are a match when one of them has skills in an area the other is looking for. Matches are ordered by a score:

- 3 points for each skill area the other person has that I am looking for
- 2 points for each skill area I have that the other person is looking for
- 1 point for each shared interest

## API overview

All routes except register and login need the header `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
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

Project stages are Idea, Planning, In development and Launched.

## Project structure

```
client/   React frontend
server/   Express API, database schema and tests
```

## Sprints

| Sprint | Focus | Status |
|---|---|---|
| 1 | Planning and design (SRS and UML diagrams) | Done |
| 2 | Core platform: accounts, profiles, matching, connections, teams | Done |
| 3 | Projects and mentorship | Done |
| 4 | Messaging, notifications and admin | Todo |
| 5 | Testing, deployment and handover | Todo |
