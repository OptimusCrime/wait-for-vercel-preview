# Wait for Vercel Preview — A GitHub Action ⏱

Do you have other Github actions (Lighthouse, Cypress, etc) that depend on the Vercel Preview URL? This action will wait until the url is available before running the next task.

Please note that this action is supposed to be run on the `pull_request` or `push` events.

## Inputs

### `token` (Required)

The Vercel secret `${{ secrets.VERCEL_TOKEN }}`

### `team_id` (Required)

The Vercel team ID `${{ secrets.VERCEL_TEAM_ID }}`

### `app` (Required)

The app name to find the deployment for.

### `commit_sha` (Required)

The commit we should find the deployment for.

### `commit_branch` (Required)

The branch we should find the deployment for.

### `max_timeout`

Optional — The amount of time (in seconds) to spend waiting on Vercel. Defaults to `120` seconds.

### `initial_timeout`

Optional — The amount of time (in seconds) to wait before the first check. Defaults to `5` seconds.

### `check_interval`

Optional - How often (in seconds) should we make the HTTP request checking to see if the deployment is available? Defaults to `2` seconds.

## Outputs

### `url`

The vercel deploy preview url that was deployed.

## Example usage

Basic Usage

```yaml
steps:
  - name: Waiting for 200 from the Vercel Preview
    uses: OptimusCrime/wait-for-vercel-preview@v2.0.0
    id: waitFor200
    with:
      token: ${{ secrets.VERCEL_TOKEN }}
      team_id: ${{ secrets.VERCEL_TEAM_ID }}
      app: app-name
      commit_sha: ${{ github.sha }}
      commit_branch: main
      max_timeout: 60
  # access preview url
  - run: echo ${{ steps.waitFor200.outputs.url }}
```

## Building

The Action is bundled via [ncc](https://github.com/vercel/ncc). See [this discussion](https://github.com/actions/hello-world-javascript-action/issues/12) for more information.

```sh
npm run build
# outputs the build to dist/index.js
```
