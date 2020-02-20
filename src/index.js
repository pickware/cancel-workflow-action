const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  const { sha, ref, repo: { owner, repo }, payload, run_id } = github.context;
  
  let branch = ref.slice(11);
  let headSha = sha;

  if (payload.pull_request) {
    branch = payload.pull_request.head.ref;
    headSha = payload.pull_request.head.sha;
  }
  
  const token = core.getInput('access_token', { required: true });

  const octokit = new github.GitHub(token);
  
  // Obtain workflow id from url
  // Example url: https://api.github.com/repos/octo-org/octo-repo/actions/workflows/30433642
  const { data: { workflow_url } } = await octokit.actions.getWorkflowRun({ owner, repo, run_id });
  const workflow_id = workflow_url.substring(workflow_url.lastIndexOf("/workflows/") + 11, Number.POSITIVE_INFINITY);


  // Obtain workflow runs
  const { data: runs } = await octokit.actions.listWorkflowRuns({ owner, repo, workflow_id, branch });
  
  console.log(`Found ${runs.total_count} runs total.`);
  
  // Filter workflow runs
  const runningWorkflows = runs.workflow_runs.filter(
    workflow => workflow.head_sha !== headSha && workflow.status !== 'completed'
  );
  
  console.log(`Found ${runningWorkflows.length} runs in progress.`);
  
  // Cancel workflow runs
  for (const { id, head_sha, status } of runningWorkflows) {
    console.log('Cancelling another run: ', { id, head_sha, status });
    const res = await octokit.actions.cancelWorkflowRun({ owner, repo, run_id: id });
    console.log(`Status ${res.status}`);
  }
  
  console.log('Done.');
}

main()
  .then(() => core.info('Cancel Complete.'))
  .catch(e => core.setFailed(e.message));
