# Todo Flow

A Vue 3 todo app connected to the REST service described in `postman.json`.

## Run locally

1. Start the Todo API on `http://localhost:3000`.
2. Install and start the frontend:

   ```bash
   npm install
   npm run dev
   ```

3. Open the URL printed by Vite (normally `http://localhost:5173`).

During development, Vite proxies `/api` to `http://localhost:3000`, avoiding browser CORS issues. For a deployed frontend, copy `.env.example` to `.env` and set `VITE_API_URL` to the public API origin.

## API contract

- `GET /todos`
- `POST /todos`
- `PUT /todos/:id`
- `DELETE /todos/:id`

The app supports creating, filtering, completing, editing, and deleting tasks.
