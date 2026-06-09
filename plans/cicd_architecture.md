# CI/CD Architecture

This document outlines the new two-pronged CI/CD workflow for this project.

## `deploy:dev` Script

For rapid, iterative development, a new `deploy:dev` script will be added to `package.json`. This script will facilitate direct deployments to a Cloudflare preview environment.

The script will be defined as follows:

```json
"deploy:dev": "npx wrangler pages deploy dist --project-name p31ca --branch=preview --commit-dirty=true"
```

This command uses `wrangler` to deploy the contents of the `dist/` directory to the `p31ca` Cloudflare Pages project, specifically to a branch named `preview`. The `--commit-dirty=true` flag allows for deployments even with uncommitted local changes, which is ideal for a development workflow.

## Production CI/CD Pipeline

The existing GitHub Actions workflow at `.github/workflows/cicd.yml` will be enhanced to serve as the production deployment pipeline. This pipeline will trigger on every push to the `main` branch.

### Workflow Triggers

The workflow will be configured to trigger on pushes to the `main` branch:

```yaml
on:
  push:
    branches:
      - main
```

### Deployment Job

The `deploy` job will be modified to deploy the application to the production environment on Cloudflare. The placeholder `echo` commands will be replaced with the actual deployment command.

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: build_and_test
  steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-artifacts
    - name: Deploy to Production
      run: npx wrangler pages deploy dist --project-name p31ca --branch=main
```

This job will download the build artifacts from the `build_and_test` job and then use `wrangler` to deploy the `dist/` directory to the `main` branch of the `p31ca` Cloudflare Pages project, which corresponds to the production environment.
