const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  const {
    sha,
    ref,
    repo: { owner, repo },
    payload,
  } = github.context;

  // GITHUB_RUN_ID is provided by Github
  const runId = process.env.GITHUB_RUN_ID;

  let branch = ref.slice(11);
  let headSha = sha;

  if (payload.pull_request) {
    branch = payload.pull_request.head.ref;
    headSha = payload.pull_request.head.sha;
  }

  const token = core.getInput('accessToken', { required: true });

  const octokit = new github.GitHub(token);

  // Obtain workflow id from url
  // Example url: https://api.github.com/repos/octo-org/octo-repo/actions/workflows/30433642
  const { data: currentWorkflowRun } = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id: runId,
  });
  const workflowUrlParts = currentWorkflowRun.workflow_url.split('/');
  const workflowId = workflowUrlParts[workflowUrlParts.length - 1];

  // Obtain workflow runs
  const { data: allWorkflowRuns } = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id: workflowId,
    branch,
  });

  core.info(`Found ${allWorkflowRuns.total_count} runs total.`);

  // Filter workflow runs
  const runningWorkflows = allWorkflowRuns.workflow_runs.filter(
    workflowRun => workflowRun.head_sha !== headSha && workflowRun.status !== 'completed'
  );

  core.info(`Found ${runningWorkflows.length} runs in progress.`);

  // Cancel previous workflow runs
  for (const { id, head_sha: headSha, status } of runningWorkflows) {
    core.info('Cancelling another run: ' + JSON.stringify({ id, headSha, status }));
    const result = await octokit.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id: id,
    });
    core.info(`Run status changed to ${result.status}`);
  }

  core.info('Done.');
}

main()
  .then(() => core.info('Cancel Complete.'))
  .catch(e => core.setFailed(e.message));
