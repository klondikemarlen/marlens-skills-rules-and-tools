# Dev Config Template

Use this when a project wants to customize the shared Ruby `dev` wrapper without forking the wrapper itself.

Create `dev.config.rb` in the project root:

```ruby
{
  compose: ["docker", "compose"],
  services: {
    api: "api",
    web: "web",
    db: "db"
  },
  commands: {
    api_shell: ["sh"],
    web_shell: ["sh"],
    api_test: ["npm", "run", "test"],
    web_test: ["npm", "run", "test"],
    api_check_types: ["npm", "run", "check-types"],
    web_check_types: ["npm", "run", "check-types"]
  }
}
```

## Common Overrides

### Different Service Names

```ruby
{
  services: {
    api: "backend",
    web: "frontend",
    db: "postgres"
  }
}
```

### Test Runner Flags

```ruby
{
  commands: {
    api_test: ["npm", "run", "test", "--"],
    web_test: ["npm", "run", "test", "--"]
  }
}
```

### Alternate Compose Command

```ruby
{
  compose: ["docker", "compose", "--profile", "design"]
}
```

### Packaged Plugins

Packaged plugins can be run by command or loaded by config.

Install or remove packaged plugins:

```bash
dev plugin install bash-completions
dev plugin uninstall bash-completions
dev plugin list
```

For convenience, `dev install bash-completions` and `dev uninstall bash-completions` are aliases.

Load packaged plugin commands for normal dispatch:

```ruby
{
  plugins: ["bash_completions"]
}
```

### Local Plugin Files

Local plugin files load relative to `dev.config.rb`:

```ruby
{
  plugin_files: ["dev/plugins/project_plugin.rb"]
}
```

Plugin files register commands:

```ruby
Dev::PluginRegistry.register("hello") do |_command, args|
  puts "hello #{args.join(' ')}"
end
```

## Rule

Keep project-specific ports, cloud targets, database names, credentials, and issue tracker IDs in local config or local wrappers. Do not add them to the shared wrapper.
