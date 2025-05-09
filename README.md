# F.R.O.G. - For Rebranding on Ghost

## Requirements
1. Docker
2. Node
3. Yarn
4. A running Ghost instance somewhere

> **⚠️ Docker + Local Ghost Configuration**
>
> If you're running FROG in Docker and testing against a local Ghost instance, make sure you sign in to `host.docker.internal:2368`, not `localhost:2368`. That tripped me up a few times.


## Setup
1. run `make copy-env` (or OS-specific variant) to copy the non-secret env files from `.env.example` to `.env` in root and each directory.
2. run `openssl rand -base64 32` to generate an encryption key and set `ENCRYPTION_KEY` in `server/.env` to that.
3. run `make frog`, or copy the docker-compose from the `Makefile` and run that. This will spin up the client on port 1111, server on port 2222, and redis on port 4444.
4. (Optional) if you want to look at the code without a bunch of squiggly lines, run `make setup` to install node_modules in each dir.

## Other Notes
- here's a [walkthrough video](https://www.loom.com/share/e8ea1b4a2496483a9db47221efc1f4ea)
- if your Ghost instance is 5.118 or greater, you may run into [this Github issue](https://github.com/TryGhost/Ghost/issues/23050) and not be able to sign in on F.R.O.G. because it won't send an auth code. The [suggestion to turn off staff verification](https://github.com/TryGhost/Ghost/issues/23050#issuecomment-2848527751) seemed to solve it for me.