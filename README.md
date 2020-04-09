# setup-clj-kondo

This action sets up clj-kondo for using in GitHub Actions.

# Usage

```yaml
steps:
- uses: DeLaGuardo/setup-clj-kondo@v1
  with:
    version: '2020.04.05'

- uses: actions/checkout@latest

- name: Run on ubuntu or macosx
  run: clj-kondo --lint src

- name: Run on windows
  run: clj-kondo.exe --lint src
```

For the real world example please check [Test Workflow file](https://github.com/DeLaGuardo/setup-clj-kondo/blob/master/.github/workflows/test.yml)

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
