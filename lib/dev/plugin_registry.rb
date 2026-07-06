# frozen_string_literal: true

module Dev
  class PluginRegistry
    @commands = {}

    class << self
      def register(command_name, &block)
        raise ArgumentError, "#{command_name} needs a block" unless block

        commands[command_name] = block
      end

      def fetch(command_name)
        commands[command_name]
      end

      private

      attr_reader :commands
    end
  end

  FeatureRegistry = PluginRegistry
end
