# frozen_string_literal: true

require "shellwords"

module Dev
  class Command
    COMMAND_TO_METHOD = {
      "up" => :up,
      "down" => :down,
      "logs" => :logs,
      "ps" => :ps,
      "build" => :build,
      "run" => :compose_run,
      "exec" => :compose_exec,
      "sh" => :sh,
      "api" => :api,
      "web" => :web,
      "npm" => :npm,
      "test" => :test,
      "check-types" => :check_types
    }.freeze
    HELP_COMMANDS = [nil, "help", "--help", "-h"].freeze

    def self.call(*args)
      config_path, command_args = ConfigArgument.parse(args)
      config = ConfigLoader.load(config_path)

      FeatureLoader.load(config_path:, config:)

      new(config:).call(*command_args)
    end

    def initialize(config:)
      @config = config
    end

    def call(command_name = nil, *args)
      return help if HELP_COMMANDS.include?(command_name)

      command_method = COMMAND_TO_METHOD[command_name]
      return public_send(command_method, *args) if command_method

      feature_command = FeatureRegistry.fetch(command_name)
      return feature_command.call(self, args) if feature_command

      compose(command_name, *args)
    end

    def up(*args)
      compose("up", "--remove-orphans", *args)
    end

    def down(*args)
      compose("down", "--remove-orphans", *args)
    end

    def logs(*args)
      compose("logs", "-f", *args)
    end

    def ps(*args)
      compose("ps", *args)
    end

    def build(*args)
      compose("build", *args)
    end

    def compose_run(*args)
      compose("run", "--rm", *args)
    end

    def compose_exec(*args)
      compose("exec", *args)
    end

    def sh(*args)
      shell_command = [*config.command_args(:api_shell), *args]

      run_service(:api, shell_command)
    end

    def api(*args)
      run_service(:api, args)
    end

    def web(*args)
      run_service(:web, args, ["--no-deps"])
    end

    def npm(*args)
      run_service(:api, ["npm", *args])
    end

    def test(service = nil, *args)
      return test_web(*args) if service == "web"
      return test_api(*args) if service == "api"

      api_test_args = service.nil? ? args : [service, *args]
      test_api(*api_test_args)
    end

    def check_types(*args)
      api_check_command = [*config.command_args(:api_check_types), *args]
      web_check_command = [*config.command_args(:web_check_types), *args]

      wait_for(*compose_run_command(:api, api_check_command))
      run_service(:web, web_check_command, ["--no-deps"])
    end

    def help
      puts <<~HELP
        Usage: dev <command> [args]

        Generic Docker Compose development wrapper. Configure with dev.config.rb for project-local service names and commands.

        Commands:
          up [services...]          docker compose up --remove-orphans
          down                      docker compose down --remove-orphans
          logs [services...]        docker compose logs -f
          ps                        docker compose ps
          build [services...]       docker compose build
          run <service> <cmd...>    docker compose run --rm <service> <cmd...>
          exec <service> <cmd...>   docker compose exec <service> <cmd...>
          sh                        shell in the API service
          api <cmd...>              run command in the API service
          web <cmd...>              run command in the web service without dependencies
          npm <args...>             run npm in the API service
          test [api|web] [args...]  run configured API or web test command
          check-types [args...]     run configured API then web type checks

        Config:
          Create dev.config.rb in the project root:

          {
            compose: ["docker", "compose"],
            services: { api: "api", web: "web", db: "db" },
            commands: {
              api_test: ["npm", "run", "test"],
              web_test: ["npm", "run", "test"],
              api_check_types: ["npm", "run", "check-types"],
              web_check_types: ["npm", "run", "check-types"]
            }
          }

        Optional packaged features:
          features: ["bash_completions"]

        Optional local feature files:
          feature_files: ["dev/features/project_feature.rb"]

        Optional config path:
          dev --config /path/to/dev.config.rb help
      HELP
    end

    private

    attr_reader :config

    def test_api(*args)
      api_test_command = [*config.command_args(:api_test), *args]

      run_service(:api, api_test_command)
    end

    def test_web(*args)
      web_test_command = [*config.command_args(:web_test), *args]

      run_service(:web, web_test_command, ["--no-deps"])
    end

    def run_service(service, command_args = [], compose_args = [])
      run(*compose_run_command(service, command_args, compose_args))
    end

    def compose_run_command(service, command_args = [], compose_args = [])
      [
        *config.compose_command,
        "run",
        "--rm",
        *compose_args,
        config.service_name(service),
        *command_args
      ]
    end

    def compose(*args)
      run(*config.compose_command, *args)
    end

    def run(*command)
      warn "Running: #{command.shelljoin}"
      exec(*command)
    end

    def wait_for(*command)
      warn "Running: #{command.shelljoin}"
      return if system(*command)

      exit($?.exitstatus || 1)
    end
  end
end
