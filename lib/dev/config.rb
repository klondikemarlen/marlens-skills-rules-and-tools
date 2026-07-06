# frozen_string_literal: true

module Dev
  class Config
    DEFAULT_COMPOSE_COMMAND = ["docker", "compose"].freeze
    DEFAULT_SERVICES = {
      api: "api",
      web: "web",
      db: "db"
    }.freeze
    DEFAULT_COMMANDS = {
      api_shell: ["sh"],
      api_test: ["npm", "run", "test"],
      web_test: ["npm", "run", "test"],
      api_check_types: ["npm", "run", "check-types"],
      web_check_types: ["npm", "run", "check-types"]
    }.freeze

    def initialize(overrides = {})
      @overrides = overrides
    end

    def compose_command
      command = overrides.fetch(:compose, DEFAULT_COMPOSE_COMMAND)

      unless command.is_a?(Array)
        raise TypeError, "compose must be an Array of command arguments"
      end

      command
    end

    def service_name(name)
      services.fetch(name) { DEFAULT_SERVICES.fetch(name) }
    end

    def command_args(name)
      commands.fetch(name) { DEFAULT_COMMANDS.fetch(name) }
    end

    def plugins
      plugin_names = overrides.fetch(:plugins) { overrides.fetch(:features, []) }

      unless plugin_names.is_a?(Array)
        raise TypeError, "plugins must be an Array of packaged plugin names"
      end

      plugin_names
    end

    def features
      plugins
    end

    def plugin_files
      files = overrides.fetch(:plugin_files) { overrides.fetch(:feature_files, []) }

      unless files.is_a?(Array)
        raise TypeError, "plugin_files must be an Array of Ruby file paths"
      end

      files
    end

    def feature_files
      plugin_files
    end

    private

    attr_reader :overrides

    def services
      overrides.fetch(:services, {})
    end

    def commands
      overrides.fetch(:commands, {})
    end
  end
end
