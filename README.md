
# Financify - Local Development Setup

Welcome to Financify! This guide will walk you through setting up the project for local development.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20 or higher is recommended)
*   [npm](https://www.npmjs.com/) (which comes bundled with Node.js)

## Getting Started

### 1. Export the Project Code

First, you'll need to get the project files onto your local computer.

*   Press the **'Hostinger Horizons'** dropdown menu at the top left corner of your screen.
*   Press the **'Export Project'** button to download a zip file of the entire codebase.
*   Unzip the downloaded file in your preferred location.

### 2. Navigate to Project Directory

Open your terminal or command prompt and navigate into the newly unzipped project folder:
```bash
cd path/to/your/project/financify
```

### 3. Install Dependencies

Run the following command to install all the necessary packages defined in `package.json`. This might take a few moments.
```bash
npm install
```

## Environment Configuration

This project connects to Supabase for its backend services (like database, authentication, and edge functions). To run it locally, you'll need to provide your secret keys in an environment file.

### 1. Create a `.env` file

In the root directory of the project, create a new file named `.env`. This file will securely store your secret keys and is ignored by version control.

### 2. Add Your Supabase Keys

Copy the structure below into your new `.env` file. You will need to replace the placeholder values with your actual credentials from your Supabase project dashboard.

```env
# Supabase credentials for the client-side application
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# The keys below are for running Supabase Edge Functions locally via the Supabase CLI
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET=YOUR_SUPER_SECRET_JWT_SECRET
```

#### Where to find your keys:

*   **`VITE_SUPABASE_URL`** & **`VITE_SUPABASE_ANON_KEY`**: In your Supabase project, navigate to **Project Settings > API**. You'll find the Project URL and the `anon` public key there.
*   **`SUPABASE_SERVICE_ROLE_KEY`**: This key is also in **Project Settings > API**. **Important:** This key is highly sensitive as it bypasses all security policies. Keep it secret and never expose it on the client-side!
*   **`JWT_SECRET`**: This is a secret you create for signing custom JSON Web Tokens (JWTs). Generate a long, random, and secure string. You can use a command-line tool like `openssl rand -hex 32` to create a strong secret.

**Note:** For running the edge functions locally, you will need to install and use the [Supabase CLI](https://supabase.com/docs/guides/cli).

## Running the Application

With your environment configured, you're ready to launch the app!

*   **Start the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically at `http://localhost:5173`. The application will automatically reload in your browser whenever you save a file.

*   **Create a production-ready build:**
    ```bash
    npm run build
    ```
    This command bundles your application into optimized static files, placing them in the `dist/` directory, ready for deployment.

*   **Preview the production build locally:**
    ```bash
    npm run preview
    ```
    This starts a simple web server to host your production files from the `dist/` directory. It's a great way to double-check that everything works as expected before going live.

---

Happy coding! 💻
