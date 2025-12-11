# OneDrive (Microsoft Graph) Configuration Guide

This guide explains how to set up a Microsoft App to enable OneDrive integration in the Automation Kit.

## Prerequisites
- A Microsoft Azure Account (free credentials can be created).

## Step 0: Create a Clean Azure Account (If you have tenant issues)

If you are stuck in a loop with "Tenant" errors, the easiest fix is to start fresh:

1.  Go to [signup.live.com](https://signup.live.com/) and create a **brand new** email address (e.g., `myautomationUser01@outlook.com`).
2.  Open an Incognito/Private window.
3.  Go to [portal.azure.com](https://portal.azure.com).
4.  Sign in with your **new** Outlook/Hotmail address.
5.  This guarantees you are the **Global Administrator** of your own personal "Default Directory". You won't have permission issues here.

### 🚨 CRITICAL: If you are locked out of Azure Portal (AADSTS50020)
If you see an error saying you "cannot access application ADIbizaUX" or "Microsoft Services" while trying to log in to the **Azure Portal**:
1.  **STOP**. Your browser is remembering a bad login session.
2.  Open a **New Incognito Window** (Ctrl+Shift+N).
3.  Go to `https://portal.azure.com`.
4.  Log in there. **Do not use your main browser window.**

## Step 0.5: Create a Tenant (If you see "Deprecated" error)
If you see: *"The ability to create applications outside of a directory has been deprecated"*:

1.  This means your account has no "Directory" (Tenant) yet.
2.  In Azure Portal, search for **"Microsoft Entra ID"** (formerly Azure Active Directory).
3.  Click **Manage Tenants** (top bar) or go to the Entra ID overview.
4.  Click **Create** (or **Manage Tenants** > **Create**).
5.  Choose **Personal** or **Customer**? No, choose **"Force"**—actually, easiest is to search "Tenant" > **Create a Tenant**.
    *   Tenant type: **Microsoft Entra ID**.
    *   Configuration: Give it a name like "MyDevTenant".
6.  Review + Create. (You might need to solve a Captcha).
7.  **IMPORTANT**: Once created, click **Switch Tenant** (in notification or Profile menu) to enter your new Tenant.
8.  NOW you can register apps.

## Step 1: Register an App in Azure Portal

1.  Go to the [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps).
2.  Click **+ New registration**.
3.  **Name**: Enter a name (e.g., `AutomationKit-OneDrive`).
4.  **Supported account types**: Select **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**.
    *   *Note: This is crucial to allow personal OneDrive accounts (like @outlook.com) to work.*
5.  **Redirect URI (Optional)**:
    *   Select **Web**.
    *   URL: `http://localhost:4000/api/auth/microsoft/callback`
6.  Click **Register**.

## Step 2: Get Client ID

1.  On the app's **Overview** page, look for **Application (client) ID**.
2.  Copy this value.
3.  Add it to your backend `.env` file:
    ```env
    MICROSOFT_CLIENT_ID=your_copied_client_id
    ```

## Step 3: Create Client Secret

1.  In the left sidebar, click **Certificates & secrets**.
2.  Under **Client secrets**, click **+ New client secret**.
3.  **Description**: Enter a description (e.g., `Backend Secret`).
4.  **Expires**: Select a duration (e.g., 24 months).
5.  Click **Add**.
6.  **IMPORTANT**: Copy the **Value** (not the Secret ID) immediately. You won't be able to see it again.
7.  Add it to your backend `.env` file:
    ```env
    MICROSOFT_CLIENT_SECRET=your_copied_secret_value
    ```

## Step 4: Configure Redirect URI (If missed in Step 1)

1.  In the left sidebar, click **Authentication**.
2.  Under **Platform configurations** > **Web**, ensure the **Redirect URI** `http://localhost:4000/api/auth/microsoft/callback` is listed.
3.  If not, click **Add URI** and enter it.
4.  Also, verify that the **Configured URL** matches your `MICROSOFT_CALLBACK_URL` in `.env`:
    ```env
    MICROSOFT_CALLBACK_URL=http://localhost:4000/api/auth/microsoft/callback
    ```

## Step 5: API Permissions

1.  In the left sidebar, click **API permissions**.
2.  Click **+ Add a permission** > **Microsoft Graph** > **Delegated permissions**.
3.  Search for and select:
    *   `User.Read` (usually default)
    *   `Files.Read` or `Files.Read.All` (for reading OneDrive files)
    *   `offline_access` (Required for getting refresh tokens to keep the connection alive)
4.  Click **Add permissions**.

## Summary of .env Configuration

Your `BE/.env` file should look like this:

```env
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_secret_value_here
MICROSOFT_CALLBACK_URL=http://localhost:4000/api/auth/microsoft/callback
```

Once configured, restart your backend server (`npm run dev` in BE folder), and you can use the "Connect New Account" button in the OneDrive node configuration.

## Troubleshooting

### Error: "Selected user account does not exist in tenant..."
If you see an error like: *Selected user account does not exist in tenant 'Microsoft Services' and cannot access the application...*

**Cause**: You selected "Single Tenant" or "Multitenant (Organizational only)" when creating the app, but you are trying to sign in with a **Personal** account (like @outlook.com, @hotmail.com, or @live.com).

**Fix**:
1.  Go to the [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps).
2.  Select your app.
3.  Click **Authentication** in the left sidebar.
4.  Look for **Supported account types**.
5.  Click **"Change"** (if available) or check if strictly locked.
    *   You MUST switch it to: **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**.
6.  If you cannot change it (sometimes restricted), you must **Create a New App Registration** and strictly select the **"... and personal Microsoft accounts"** option during creation (Step 1.4 in this guide).
### CRITICAL: Verify your Application Type
If you are getting `AADSTS50020`, it 99% means your App is "Single Tenant". You need to verify this:

1.  Go to your App Registration in Azure Portal.
2.  Click **Overview** in the left sidebar.
3.  Look at **Supported account types** (under Essentials).
4.  It **MUST** say: *"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"*.
5.  If it says *"My organization only"* or *"Single tenant"*, **IT WILL NOT WORK**.
    *   **Fix**: Click the "Manifest" blade on the left.
    *   Find `"signInAudience": "AzureADMyOrg"`.
    *   Change it to `"signInAudience": "AzureADandPersonalMicrosoftAccount"`.
    *   Click **Save**.
    *   Try logging in again.
