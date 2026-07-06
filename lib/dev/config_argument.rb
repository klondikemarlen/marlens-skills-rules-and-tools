# frozen_string_literal: true

module Dev
  class ConfigArgument
    FLAG = "--config"
    DEFAULT_CONFIG_PATH = "dev.config.rb"

    def self.parse(args)
      new(args).parse
    end

    def initialize(args)
      @args = args
    end

    def parse
      return [DEFAULT_CONFIG_PATH, args] unless args.first == FLAG

      config_path = args[1]
      raise ArgumentError, "#{FLAG} requires a path" if config_path.nil? || config_path.empty?

      [config_path, args.drop(2)]
    end

    private

    attr_reader :args
  end
end
