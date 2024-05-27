const core = require('@actions/core');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The data is structured like this:
 * - deployments
 * -- readyState
 * -- meta
 * --- githubCommitRef
 * --- githubCommitSha
 * @param data
 * @param COMMIT_SHA
 * @param COMMIT_BRANCH
 */
const findDeployment = (data, COMMIT_SHA, COMMIT_BRANCH) => {
  if (!data.deployments) {
    return null;
  }

  const deployments = data.deployments;

  for (const deployment of deployments) {
    if (!deployment.meta) {
      continue;
    }

    if (!deployment.meta.githubCommitRef || !deployment.meta.githubCommitSha) {
      continue;
    }

    if (deployment.meta.githubCommitRef !== COMMIT_BRANCH) {
      continue;
    }

    if (deployment.meta.githubCommitSha !== COMMIT_SHA) {
      continue;
    }

    return deployment;
  }

  return null;
}


const run = async () => {
  try {
    // Inputs
    const VERCEL_TOKEN = core.getInput('token', {required: true});
    const VERCEL_TEAM_ID = core.getInput('team_id', {required: true});
    const APP = core.getInput('app', {required: true});
    const COMMIT_SHA = core.getInput('commit_sha', {required: true});
    const COMMIT_BRANCH = core.getInput('commit_branch', {required: true});

    const MAX_TIMEOUT_IN_MS = (Number(core.getInput('max_timeout')) || 120) * 1000;
    const INITIAL_TIMEOUT_IN_MS = (Number(core.getInput('initial_timeout')) || 5) * 1000;
    const CHECK_INTERVAL_IN_MS = (Number(core.getInput('check_interval')) || 2) * 1000;

    // Validate all required inputs
    const missingInputs = [];
    if (!VERCEL_TOKEN) {
      missingInputs.push('Field `token` was not provided');
    }
    if (!VERCEL_TEAM_ID) {
      missingInputs.push('Field `team_id` was not provided');
    }
    if (!APP) {
      missingInputs.push('Field `app` was not provided');
    }
    if (!COMMIT_SHA) {
      missingInputs.push('Field `commit_sha` was not provided');
    }
    if (!COMMIT_BRANCH) {
      missingInputs.push('Field `commit_branch` was not provided');
    }

    if (missingInputs.length > 0) {
      core.setFailed(`Missing one or more required field(s): ${missingInputs.join('. ')}`);
    }

    if (INITIAL_TIMEOUT_IN_MS > 0) {
      await wait(INITIAL_TIMEOUT_IN_MS);
    }

    const startTime = Date.now();

    while (true) {
      const currentTime = Date.now();
      const durationInMs = currentTime - startTime;
      if (durationInMs > MAX_TIMEOUT_IN_MS) {
        break;
      }

      try {
        const req = await fetch(`https://api.vercel.com/v6/deployments?teamId=${VERCEL_TEAM_ID}&app=${APP}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${VERCEL_TOKEN}`,
          }
        });

        if (req.status !== 200) {
          console.log(`Request failed with status code: ${req.status}`);
        } else {
          const data = await req.json();
          const deployment = findDeployment(
            data,
            COMMIT_SHA,
            COMMIT_BRANCH
          );

          if (deployment === null) {
            console.log("No deployment found yet. Waiting and trying again");
          } else {
            console.log("Deployment found. Waiting for deployment to be ready");

            switch (deployment.readyState) {
              case "READY":
                console.log("Deployment is ready");
                core.setOutput('url', deployment.url);
                return;
              case "BUILDING":
              case "INITIALIZING":
              case "QUEUED":
                console.log(`Deployment is being processed. Current status: ${deployment.status}`);
                break;
              case "ERROR":
              case "CANCELED":
                core.setFailed(`Deployment can never be ready. Deployment status: ${deployment.status}`);
                return;
              default:
                console.log("Deployment has unexpected status. Trying again");
                break;
            }
          }
        }

        await wait(CHECK_INTERVAL_IN_MS);
      } catch (err) {
        core.setFailed(err.message);
      }
    }

    core.setFailed("Exceeded max timeout");
  } catch (error) {
    core.setFailed(error.message);
  }
};

exports.run = run;
