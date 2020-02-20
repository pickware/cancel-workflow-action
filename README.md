# Cancel Workflow Action

This is a Github Action that will cancel any previous runs that are not `completed` for a given workflow.

This includes runs with a [status](https://developer.github.com/v3/checks/runs/#parameters-1) of `queued` or `in_progress`.

## How does it work?

When you `git push`, this action will capture the Branch and SHA. It will query GitHub's API to find workflow runs that match the Branch but do not match the SHA (these would be previous pushes) and cancel all of these in-progress runs so that the latest run (current SHA) will finish.

Read more about the [Workflow Runs API](https://developer.github.com/v3/actions/workflow_runs/).

## Usage

- Visit https://github.com/settings/tokens to generate a token with `public_repo` scope (or full `repo` scope for private repos).
- Visit `https://github.com/:org/:repo/settings/secrets` to add a secret called `GH_ACCESS_TOKEN` with the token as the value.
- Add a new file `.github/workflows/cancel.yml` with the following:

```yml
name: Runs Cancellation

on: [push]

jobs:
  cancel:
    runs-on: ubuntu-latest
    name: Cancel Jobs
    timeout-minutes: 3
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Cancel Runs
        uses: pickware/cancel-workflow-action@paulvonallwoerden/make-workflow-id-dynamic
        with:
          access_token: ${{ secrets.GITHUB_TOKEN }}

```
