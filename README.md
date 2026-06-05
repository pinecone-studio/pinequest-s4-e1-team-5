# pinequest-s4-e1-team-5

## Preview on phone

Find your Mac IP:

```bash
ipconfig getifaddr en0
```

Set `client/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://MAC_IP:4000
```

Set `server/.env`:

```bash
CLIENT_URL=http://MAC_IP:3000
```

Run the server:

```bash
cd server && bun run dev
```

Run the client:

```bash
cd client && bun dev
```

Open on your phone:

```text
http://MAC_IP:3000
```
