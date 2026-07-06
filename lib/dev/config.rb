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

    def features
      feature_names = overrides.fetch(:features, [])

      unless feature_names.is_a?(Array)
        raise TypeError, "features must be an Array of packaged feature names"
      end

      feature_names
    end

    def feature_files
      files = overrides.fetch(:feature_files, [])

      unless files.is_a?(Array)
        raise TypeError, "feature_files must be an Array of Ruby file paths"
      end

      files
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
