# frozen_string_literal: true

require "fileutils"
require "shellwords"

module Dev
  module Features
    class BashCompletions
      COMPLETION_DIRECTORY = File.expand_path("~/.local/share/bash-completion/completions")
      COMPLETION_FILE = File.join(COMPLETION_DIRECTORY, "dev")

      def initialize(action = nil, previous_word = nil)
        @action = action
        @previous_word = previous_word
      end

      def call
        case action
        when "install"
          install
        when "uninstall"
          uninstall
        when "words"
          puts words_for(previous_word)
        else
          puts script
        end
      end

      private

      attr_reader :action, :previous_word

      def install
        FileUtils.mkdir_p(COMPLETION_DIRECTORY)
        File.write(COMPLETION_FILE, script)
        puts "Installed dev bash completions to #{COMPLETION_FILE}"
        puts "Open a new shell, or run: source #{COMPLETION_FILE}"
      end

      def uninstall
        if File.exist?(COMPLETION_FILE)
          File.delete(COMPLETION_FILE)
          puts "Removed dev bash completions from #{COMPLETION_FILE}"
        else
          puts "Dev bash completions were not installed at #{COMPLETION_FILE}"
        end
      end

      def script
        <<~BASH
          # dev bash completions
          _dev_completions() {
            local current_word previous_word invoked_command dev_command_path completion_words

            current_word="${COMP_WORDS[COMP_CWORD]}"
            previous_word="${COMP_WORDS[COMP_CWORD - 1]}"
            invoked_command="${COMP_WORDS[0]}"

            if [[ "$invoked_command" == */* ]]; then
              dev_command_path="$invoked_command"
            else
              dev_command_path="$(command -v "$invoked_command")"
            fi

            completion_words="$(ruby "$dev_command_path" bash-completions words "$previous_word")"

            if [ -z "$completion_words" ]; then
              return
            fi

            COMPREPLY=($(compgen -W "$completion_words" -- "$current_word"))
          }

          complete -F _dev_completions dev bin/dev ./bin/dev
        BASH
      end

      def words_for(previous_word)
        case previous_word
        when "bash-completions"
          %w[install uninstall words].join(" ")
        else
          ""
        end
      end
    end
  end
end

Dev::FeatureRegistry.register("bash-completions") do |_command, args|
  Dev::Features::BashCompletions.new(*args).call
end
