# Deployment & Database Connection Guide

This application is designed to be flexible, allowing deployment on standard web servers like XAMPP and connection to various database backends.

## 1. Hosting on XAMPP (Windows/Linux)

To run this application on XAMPP:

1.  **Build the Application:**
    Open a terminal in the project folder and run:
    ```bash
    npm run build
    ```
    This creates a `dist` folder with the static files.

2.  **Copy to htdocs:**
    Copy the contents of the `dist` folder to your XAMPP `htdocs` directory (e.g., `C:\xampp\htdocs\rcas`).

3.  **Access:**
    Open your browser and go to `http://localhost/rcas`.
    
    *Note: The included `.htaccess` file ensures that refreshing pages works correctly (SPA routing).*

## 2. Exposing via Cloudflare Tunnel

To make your local XAMPP or Dev server accessible from the internet:

1.  **Install Cloudflared:**
    Download `cloudflared` from [Cloudflare's website](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).

2.  **Run the Tunnel:**
    If your app is running on port 80 (XAMPP):
    ```bash
    cloudflared tunnel --url http://localhost:80
    ```
    If running via `npm run dev` (Port 5173):
    ```bash
    cloudflared tunnel --url http://localhost:5173
    ```

3.  **Share the Link:**
    Cloudflare will provide a random URL (e.g., `https://random-name.trycloudflare.com`) that you can share.

## 3. Database Connections (One-Click Setup)

You can connect the application to different databases without changing code.

1.  Go to **Settings > Database**.
2.  Select your **Provider**:

    *   **Local Storage:** (Default) Runs entirely in the browser. Good for testing.
    *   **Supabase (PostgreSQL):**
        *   Create a project at [supabase.com](https://supabase.com).
        *   Enter your **Project URL** and **Anon Key**.
        *   The app will connect directly to your PostgreSQL database.
    *   **Firebase (Firestore):**
        *   Create a project at [firebase.google.com](https://firebase.google.com).
        *   Enable **Firestore Database**.
        *   Enter your **API Key** and **Project ID**.
    *   **Custom REST API (MySQL, MSSQL, MongoDB):**
        *   For traditional databases, you need a backend API.
        *   Enter the **API URL** of your backend.
        *   The app will send standard JSON requests to this URL.

### Database Schema
If using Supabase or SQL, ensure you create tables matching the entity names:
- `Company`
- `User`
- `Voucher`
- `Ledger`
- etc.
