---
name: devops
description: >
  Containerization, deployment, and infrastructure for a project — Dockerfiles,
  docker-compose with healthchecks and volumes, CI/CD pipelines, nginx, container logs and
  startup diagnostics — using the templates and rules in references/. Load it when the user
  asks to dockerize, deploy, bring up, or troubleshoot a service or its infrastructure.
when_to_use: >
  "разверни проект", "подними в докере", "задеплой", "логи контейнера", "/devops"
---

# DevOps — containerization, deployment, and infrastructure

Help the user deploy a project, configure containers, orchestration, and infrastructure.

## General approach

1. **Study the project.** Before creating configs, read:
   - Build file (`build.gradle.kts`, `pom.xml`, `package.json`)
   - Existing `Dockerfile`, `docker-compose.yml`, `.dockerignore`
   - Application configs (`application.yml`, `.env`)
   - Module structure (mono-repo or multi-module)

2. **Ask for what is missing.** Don't guess — ask the user:
   - Which services are needed (DB, cache, broker, proxy)
   - Which ports to use
   - Whether volumes for data are needed
   - Environment: dev, staging, or prod

3. **Create the configuration.** Use templates from `references/`:
   - Dockerfile → `references/docker.md`
   - docker-compose.yml → `references/compose.md`
   - CI/CD → `references/cicd.md`

4. **Verify it works.** After creating the configs:
   - Check Docker is running: `docker info`
   - Build the image: `docker compose build`
   - Start: `docker compose up -d`
   - Check status: `docker compose ps`
   - Show logs on errors: `docker compose logs <service>`

## Capabilities

### Containerization
- Creating Dockerfiles (multi-stage build for Java/Spring Boot)
- Creating .dockerignore
- Optimizing image size and build time
- Layer caching for Gradle/Maven dependencies

### Orchestration (Docker Compose)
- Building docker-compose.yml with required services
- Configuring networks, volumes, healthchecks
- Profiles for different environments (dev/prod)
- Service dependencies (depends_on + healthcheck)

### Container management
- Start/stop/restart: `docker compose up -d`, `down`, `restart`
- Logs: `docker compose logs -f <service>`
- Status: `docker compose ps`
- Enter container: `docker compose exec <service> bash`
- Cleanup: `docker system prune`, `docker volume prune`

### CI/CD (when needed)
- GitHub Actions workflows
- Building and pushing images
- Auto-deploy on tags/branches

### Monitoring and debugging
- Health check endpoints (Spring Boot Actuator)
- Port and network checks
- Resource analysis: `docker stats`
- Diagnosing startup problems

## Rules

- ALWAYS read the project before generating configs — do not template blindly
- Do not overwrite existing Dockerfile/compose without confirmation
- Use multi-stage builds for production images
- Do not hardcode passwords and secrets — use `.env` files and environment variables
- Add a healthcheck for each service in compose
- For data volumes (DBs) use named volumes, not bind mounts
- Ports: do not map to 80/443 by default — ask the user
- On build errors — show logs and diagnose, do not retry blindly
