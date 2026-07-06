# frozen_string_literal: true

module Dev
  class FeatureLoader
    def self.load(config_path:, config:)
      new(config_path:, config:).load
    end

    def self.load_packaged_feature(feature_name)
      feature_path = File.expand_path("features/#{feature_name}.rb", __dir__)

      unless File.exist?(feature_path)
        raise ArgumentError, "Unknown packaged dev feature: #{feature_name}"
      end

      require feature_path
    end

    def initialize(config_path:, config:)
      @config_path = config_path
      @config = config
    end

    def load
      load_packaged_features
      load_local_feature_files
    end

    private

    attr_reader :config_path, :config

    def load_packaged_features
      config.features.each do |feature_name|
        self.class.load_packaged_feature(feature_name)
      end
    end

    def load_local_feature_files
      config.feature_files.each do |feature_file|
        feature_path = File.expand_path(feature_file, config_directory)

        unless File.exist?(feature_path)
          raise ArgumentError, "Local dev feature file not found: #{feature_file}"
        end

        require feature_path
      end
    end

    def config_directory
      File.dirname(File.expand_path(config_path))
    end
  end
end
