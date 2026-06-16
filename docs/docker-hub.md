# Klaro

Self-hosted contract tracker — subscriptions, insurance, utilities, and more.

**Source & documentation:** https://github.com/mallwang/klaro

---

## Quick start

Save the following as `docker-compose.yml` and run `docker compose up -d`:

```yaml
services:
  app:
    image: walefish/klaro:latest
    ports:
      - "3001:3000"
    environment:
      NODE_ENV: production
      DATABASE_PATH: /data/contracts.db
      # SMTP (required for email invitations and password reset):
      # SMTP_HOST: smtp.example.com
      # SMTP_PORT: 587
      # SMTP_USER: your-smtp-username
      # SMTP_PASSWORD: your-smtp-password
      # SMTP_FROM: noreply@example.com
      # APP_URL: https://your-app-domain.com
      # Provider logos (optional — get a token at https://logo.dev):
      # LOGO_DEV_TOKEN: pk_your_token_here
    volumes:
      - ./data:/data
    restart: unless-stopped
```

The app is available at **http://localhost:3001**.

On first start, the bootstrap admin credentials are printed to the container logs:

```
docker compose logs app
```

Sign in with those credentials and change the password immediately.

---

## Persistent data

The SQLite database is stored at `./data/contracts.db` on the host.
It survives container restarts and image updates.

## Updating

```
docker compose pull && docker compose up -d
```

## Changing the host port

Edit the left-hand side of `ports:` — e.g. `"9090:3000"` exposes on port 9090.

## Updating via Portainer

If you manage your stack through [Portainer](https://www.portainer.io/):

1. Open **Stacks** and select your Klaro stack.
2. Scroll down and click **Pull and redeploy**.
3. Confirm the dialog — Portainer pulls the new `latest` image and restarts the container. Your data volume is untouched.

Alternatively, pin the stack to a specific version tag (e.g. `walefish/klaro:v1.1.0`) and update the tag in the stack editor before redeploying.

## Tags

| Tag | Description |
|-----|-------------|
| `latest` | Most recent stable release |
| `vX.Y.Z` | Pinned release — immutable once pushed |
