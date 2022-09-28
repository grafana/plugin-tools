package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/{{ kebabCase orgName }}/{{ kebabCase pluginName }}/pkg/plugin"
)

func main() {
	// Setup the plugin environment
	backend.SetupPluginEnvironment("{{ kebabCase orgName }}-{{ kebabCase pluginName }}")

	// Start listening to requests sent from Grafana. This call is blocking so
	// it wont finish until Grafana shuts down the process or the plugin chooses
	// to exit and close down by itself
	err := backend.Serve(backend.ServeOpts{
		CallResourceHandler: backend.CallResourceHandlerFunc(plugin.ProxyHandler),
	})

	// Log any error if we could not start the plugin.
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
