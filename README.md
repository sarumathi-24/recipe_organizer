# Recipe Organizer MVP

Full-stack Recipe Organizer built with React, Express.js, Node.js, and PostgreSQL.

## Folder Structure

```text
Recipe-Organizer-final-project/
  backend/
    database/schema.sql
    src/config/db.js
    src/controllers/authController.js
    src/controllers/recipeController.js
    src/middleware/authMiddleware.js
    src/routes/authRoutes.js
    src/routes/recipeRoutes.js
    src/server.js
    .env.example
    package.json
  frontend/
    src/api/api.js
    src/components/
    src/context/AuthContext.jsx
    src/pages/
    src/App.jsx
    src/main.jsx
    src/styles.css
    .env.example
    package.json
```

## Features

- Signup and login
- Password hashing with bcrypt
- JWT protected routes
- Create, view, edit, and delete recipes
- Upload recipe images from your computer
- Owner-only edit and delete
- View all recipes
- View only logged-in user's recipes
- Profile page
- 404 page
- Responsive UI
- Search recipes on the home page

## Database Setup

1. Update `backend/.env` with your PostgreSQL password.
2. Run the setup command:

```bash
cd backend
npm run db:setup
```

You can also run `backend/database/schema.sql` manually in PostgreSQL if your teacher asks for a SQL-file workflow.

## Environment Files

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/recipe_organizer
JWT_SECRET=change_this_to_a_long_secret
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Installation

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run The Project

Start backend:

```bash
cd backend
npm run dev
```

Start frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

If you change backend code, stop the backend terminal with `Ctrl + C` and start it again.

On Windows PowerShell, if `npm` says running scripts are disabled, use `npm.cmd`:

```bash
npm.cmd install
npm.cmd run dev
```

## Deploy On Render

Deploy this project as three Render resources:

1. PostgreSQL database
2. Backend web service
3. Frontend static site

### 1. Create PostgreSQL

In Render, click **New +** -> **PostgreSQL**.

Use any name, for example:

```text
recipe-organizer-db
```

After it is created, copy the **Internal Database URL**. Use this as the backend `DATABASE_URL`.

### 2. Deploy Backend

In Render, click **New +** -> **Web Service** and connect your GitHub repository.

Use these settings:

```text
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm run render:start
```

Add these backend environment variables:

```env
DATABASE_URL=paste_render_internal_database_url_here
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_URL=https://your-frontend-site.onrender.com
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password
```

If the frontend has not been deployed yet, you can add `CLIENT_URL` after the frontend URL is created, then redeploy the backend.

The `render:start` script runs database migration first, then starts the API. This creates the recipe tables and the database file columns used for uploaded pictures/documents.

### 3. Deploy Frontend

In Render, click **New +** -> **Static Site** and connect the same GitHub repository.

Use these settings:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Add this frontend environment variable:

```env
VITE_API_URL=https://your-backend-service.onrender.com/api
```

After the frontend deploy finishes, copy its URL and update the backend `CLIENT_URL` environment variable with that exact frontend URL.

### 4. Final Check

Open the frontend Render URL and test:

1. Signup or login
2. Add a recipe
3. Upload a picture, PDF, or Word document between 1 MB and 5 MB
4. Open the recipe details page
5. Edit and delete your own recipe

## API Routes

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile`

Recipes:

- `GET /api/recipes`
- `GET /api/recipes/mine`
- `GET /api/recipes/:id`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

## Learning Checkpoint

Before adding extra features, test this flow:

1. Signup
2. Add a recipe
3. View it on Home
4. Open Recipe Details
5. Edit from your account
6. Delete from My Recipes
