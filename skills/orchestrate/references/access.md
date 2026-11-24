# Your human's access to GitHub or Bitbucket

Check it the first time a pull request step needs it, and again when it stops answering. When it answers, say nothing. The credentials are your human's own.

**GitHub** answers when `gh auth status` exits 0 and `gh repo view --json name` names the repository. When `gh` is missing, offer to install it (macOS: `brew install gh`; Windows: `winget install GitHub.cli`). When it is not signed in, your human runs `gh auth login` themselves (suggest `! gh auth login`, so it runs in this session), choosing GitHub.com, HTTPS and the browser. A "not found" on the repository with a valid login means their account has no access to it.

**Bitbucket** answers when `BITBUCKET_USER` and `BITBUCKET_TOKEN` are set and `GET https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests?pagelen=1` (the workspace and repo from `git remote get-url origin`) returns 200. Print only the status code. A 401 means the email or the token is wrong (often the Bitbucket username in place of the email); a 403, a missing scope. To set it up, guide them one step at a time: at id.atlassian.com, Security, "Create and manage API tokens", "Create API token with scopes"; the app is Bitbucket, the scopes read and write pull requests and read the repository. `BITBUCKET_USER` is their Atlassian account email. They set both in their own environment (macOS: two `export` lines in `~/.zshrc`; Windows: `setx BITBUCKET_USER <email>` and `setx BITBUCKET_TOKEN <token>` in a terminal of their own), then restart Claude Code.

**A secret never passes through you.** The person types the token where it is stored, never in this conversation; if they paste one here, tell them to revoke it and create another. Never print a token or write it into a file.

When they decline, or it still fails, they open and merge pull requests in the web UI, and you tell them the title, the body, the strategy and the message (`references/git.md`). Say it once.
