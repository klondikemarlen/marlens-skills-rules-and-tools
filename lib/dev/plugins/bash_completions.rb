# frozen_string_literal: true

require "fileutils"
require "shellwords"

module Dev
  module Plugins
    class BashCompletions
      COMPLETION_DIRECTORY = File.expand_path(
        "completions",
        ENV.fetch("BASH_COMPLETION_USER_DIR") do
          File.join(ENV.fetch("XDG_DATA_HOME", "~/.local/share"), "bash-completion")
        end
      )
      COMPLETION_FILE = File.join(COMPLETION_DIRECTORY, "dev.bash")
      LEGACY_COMPLETION_FILES = [
        File.join(COMPLETION_DIRECTORY, "dev"),
        File.expand_path("~/.local/share/bash-completion/completions/dev")
      ].uniq.freeze

      def initialize(action = nil, *words)
        @action = action
        @words = words
      end

      def call
        case action
        when "install"
          install
        when "uninstall"
          uninstall
        when "words"
          puts words_for(words)
        else
          puts script
        end
      end

      private

      attr_reader :action, :words

      def install
        FileUtils.mkdir_p(COMPLETION_DIRECTORY)
        File.write(COMPLETION_FILE, script)
        puts "Installed dev bash completions to #{COMPLETION_FILE}"
        puts "Open a new shell, or run: source #{COMPLETION_FILE}"
      end

      def uninstall
        removed_files = [COMPLETION_FILE, *LEGACY_COMPLETION_FILES].select { |path| File.exist?(path) }

        removed_files.each { |path| File.delete(path) }

        if removed_files.empty?
          puts "Dev bash completions were not installed at #{COMPLETION_FILE}"
        else
          puts "Removed dev bash completions from #{removed_files.join(", ")}"
        end
      end

      def script
        <<~BASH
          # dev bash completions
          _dev_completions() {
            local current_word invoked_command dev_command_path completion_words

            current_word="${COMP_WORDS[COMP_CWORD]}"
            invoked_command="${COMP_WORDS[0]}"

            if [[ "$invoked_command" == */* ]]; then
              dev_command_path="$invoked_command"
            else
              dev_command_path="$(command -v "$invoked_command")"
            fi

            completion_words="$(ruby "$dev_command_path" bash-completions words "$COMP_CWORD" "${COMP_WORDS[@]}")"

            if [ -z "$completion_words" ]; then
              return
            fi

            COMPREPLY=($(compgen -W "$completion_words" -- "$current_word"))
          }

          complete -F _dev_completions dev bin/dev ./bin/dev
        BASH
      end

      def words_for(words)
        completed_words = completed_words_from(words)

        case completed_words
        in []
          root_words
        in ["plugin" | "plugins"]
          plugin_action_words
        in ["plugin" | "plugins", "install" | "uninstall" | "remove"]
          packaged_plugin_words
        in ["install" | "uninstall"]
          packaged_plugin_words
        in ["bash-completions"]
          bash_completion_action_words
        else
          ""
        end
      end

      def completed_words_from(words)
        completion_index, *command_words = words

        return [completion_index].compact unless completion_index&.match?(/\A\d+\z/)

        command_words[1...completion_index.to_i] || []
      end

      def root_words
        %w[plugin install uninstall bash-completions].join(" ")
      end

      def plugin_action_words
        %w[install uninstall remove list ls].join(" ")
      end

      def packaged_plugin_words
        Dev::PluginLoader.packaged_plugin_names.join(" ")
      end

      def bash_completion_action_words
        %w[install uninstall words].join(" ")
      end
    end
  end
end

Dev::PluginRegistry.register("bash-completions") do |_command, args|
  Dev::Plugins::BashCompletions.new(*args).call
end
