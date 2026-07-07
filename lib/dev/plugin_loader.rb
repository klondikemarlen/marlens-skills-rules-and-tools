# frozen_string_literal: true

module Dev
  class PluginLoader
    def self.load(config_path:, config:)
      new(config_path:, config:).load
    end

    def self.load_packaged_plugin(plugin_name)
      plugin_path = File.expand_path("plugins/#{plugin_name}.rb", __dir__)

      unless File.exist?(plugin_path)
        raise ArgumentError, "Unknown packaged dev plugin: #{plugin_name}"
      end

      require plugin_path
    end

    def self.packaged_plugin_names
      Dir.children(File.expand_path("plugins", __dir__))
        .grep(/\.rb\z/)
        .map { |file_name| File.basename(file_name, ".rb").tr("_", "-") }
        .sort
    end

    def initialize(config_path:, config:)
      @config_path = config_path
      @config = config
    end

    def load
      load_packaged_plugins
      load_local_plugin_files
    end

    private

    attr_reader :config_path, :config

    def load_packaged_plugins
      config.plugins.each do |plugin_name|
        self.class.load_packaged_plugin(plugin_name)
      end
    end

    def load_local_plugin_files
      config.plugin_files.each do |plugin_file|
        plugin_path = File.expand_path(plugin_file, config_directory)

        unless File.exist?(plugin_path)
          raise ArgumentError, "Local dev plugin file not found: #{plugin_file}"
        end

        require plugin_path
      end
    end

    def config_directory
      File.dirname(File.expand_path(config_path))
    end
  end

  FeatureLoader = PluginLoader
end
