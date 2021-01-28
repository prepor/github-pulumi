# setup-pulumi

Github Action. Starts Pulumi in CI environment. See workflow examples [here](./.github/workflows/)

## Usage

```yaml
name: Test

on:
  push:
    branches:
      - master

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
      with:
        fetch-depth: 1
    - uses: prepor/setup-pulumi@master
      with:
        version: 1.3.4
    - uses: prepor/github-pulumi@master
      with:
        stack: dev
        args: up
        root: example
        github-token: ${{ secrets.GITHUB_TOKEN }}
      env:
        PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Pulumi v2 

If you are using v2 of the CLI, please make sure to add an `PULUMI_SKIP_CONFIRMATIONS: 'true'` to your `env` section (Otherwise, `up` command will fail).

