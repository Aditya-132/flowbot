# Deploy FlowBot

This setup deploys one Render web service that serves both:

- the FlowBot React app
- the backend API and WhatsApp webhooks

It also provisions a Postgres database for saved bots.

## 1. Push This Folder To GitHub

Render Blueprints deploy from a GitHub/GitLab/Bitbucket repo.

If this folder is not already a repo:

```bash
cd ~/Downloads/flowbot-meta/flowbot
git init
git add .
git commit -m "Deploy FlowBot"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 2. Deploy On Render

1. Open `https://dashboard.render.com`
2. Click **New +** -> **Blueprint**
3. Connect the GitHub repo that contains `render.yaml`
4. Review the resources:
   - `flowbot` web service
   - `flowbot-db` Postgres database
5. Click **Deploy Blueprint**

Render will build the frontend, start the backend, and run the app on a URL like:

```text
https://flowbot.onrender.com
```

## 3. Recreate / Activate Your Bot On The Deployed App

The deployed Postgres database starts empty, so open your Render app URL and:

1. Design or recreate the flow
2. Save it
3. Go to **Activate & test**
4. Choose **Whapi.cloud**
5. Paste your Whapi token
6. Activate

You will get a webhook path like:

```text
/whapi/webhook/<botId>
```

## 4. Set Whapi Webhook

In Whapi.cloud channel settings, set the webhook URL to:

```text
https://<your-render-app>.onrender.com/whapi/webhook/<botId>
```

Use:

- Event: `messages.post`
- Method: `POST`
- Mode: `body`

Then send a WhatsApp message from another number to the Whapi-paired number.
