# OMP Plugin Install Reference

## Routine Install

Use the generic GitHub repository reference for normal installation and reinstall. It follows the repository's default branch and is the correct path for routine development and release verification when the project documents that command:

```bash
omp plugin install github:OWNER/REPOSITORY
```

A generic GitHub reference is not a claim that the plugin manager installed a particular semantic version. Verify the installed version with `omp plugin list` or the project's documented version command.

## Exact Artifact Verification

Use a full commit hash only when reproducing an exact artifact or diagnosing stale plugin-cache state. Keep `--force` on this exceptional path so the requested revision replaces a cached install:

```bash
omp plugin install github:OWNER/REPOSITORY#FULL_COMMIT_HASH --force
```

A release tag may be useful when the project explicitly asks for that release, but it is not the routine install default. Do not describe an unpinned GitHub reference as a versioned release unless the plugin manager documents that guarantee.

## Documentation Rules

- Keep project-specific repository names, versions, and reinstall commands in the project README or release workflow.
- Put the generic-versus-exact policy in shared guidance such as this reference or the feature workflow.
- After a published merge or release, verify the remote source, reinstall from that source, and record the observed installed version.
- Restart OMP after installing or changing skills when the running client may retain the previous plugin module set.
