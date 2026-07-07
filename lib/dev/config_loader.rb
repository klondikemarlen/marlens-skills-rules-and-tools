# frozen_string_literal: true

module Dev
  class ConfigLoader
    def self.load(config_path)
      new(config_path).load
    end

    def initialize(config_path)
      @config_path = config_path
    end

    def load
      Config.new(config_overrides)
    end

    private

    attr_reader :config_path

    def config_overrides
      return {} unless File.exist?(config_path)

      overrides = eval(File.read(config_path), binding, config_path) # rubocop:disable Security/Eval
      return overrides if overrides.is_a?(Hash)

      raise TypeError, "#{config_path} must return a Hash"
    end
  end
end
