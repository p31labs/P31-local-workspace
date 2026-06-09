# Git Security Audit Report

## Summary
This report details the findings of a security audit performed on the git repository.

## Checklist

| Section | Status | Findings |
| --- | --- | --- |
| **1. History Scan** | 🔴 **FAIL** | Found hardcoded credentials (`NEO4J_PASSWORD`). |
| **2. File Content Scan** | 🔴 **FAIL** | Found hardcoded credentials (`NEO4J_PASSWORD`). |
| **3. .gitignore Review** | 🟢 **PASS** | `.gitignore` files were updated to be more effective. |
| **4. Git Hooks** | 🟢 **PASS** | A `pre-commit` hook was created and made executable. |
| **5. Branch Hygiene** | 🟡 **WARN** | Only `main` branch exists. Branch protection on `main` could not be verified. |
| **6. Author Audit** | 🟡 **WARN** | Inconsistent author identities found. |

## Remediation Plan

### 🔴 CRITICAL

**1. Remove Exposed Credentials from Git History**

The password `REDACTED` is exposed in the git history. This requires immediate remediation. You should use a tool like `git-filter-repo` to remove the password from the entire history of the repository.

**IMPORTANT:** This will rewrite your repository's history. All collaborators will need to fetch and rebase their work.

Here is the command to use with `git-filter-repo`. **DO NOT run this command without understanding the consequences and having all collaborators on board.**

```bash
# First, remove the password from your current files.
# Then, run this command:
git filter-repo --invert-paths --path software/docker-compose.dev.yml --path software/config/graph_schema.json --strip-blobs-with-ids <blob_id>
```
To get the blob_id, you can use `git rev-list --all --objects | grep REDACTED`. This is a complex operation and it is recommended to follow a detailed guide on how to use `git-filter-repo`.

A simpler, but more destructive option is to squash and merge the whole history into a single commit. This will remove all the history, but it's effective if the detailed history is not important.

**After removing the secret from history, you must rotate the credential immediately.**

### 🟡 HIGH

No high-severity issues were found.

### 🟢 LOW

**1. Remove Large Binary Files**

The repository contains several large binary files (e.g., `test.zip`, PNG images). While they are not over the 10MB limit, it is a good practice to store large binary files outside of the git repository, for example using Git LFS (Large File Storage).

**2. Standardize Author Identity**

To ensure a clean and consistent git history, all committers should use the same author name and email. You can set this with the following commands:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**3. Enable Branch Protection**

It is highly recommended to enable branch protection on your `main` branch to prevent force pushes and require pull request reviews. This can be done in your Git provider's web interface (e.g., GitHub, GitLab).
