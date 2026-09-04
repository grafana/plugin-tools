package provider

import (
	"github.com/grafana/grafana-app-sdk/app"
	"github.com/grafana/grafana-app-sdk/simple"

	examplev1alpha1 "github.com/{{ kebabCase orgName }}/{{ kebabCase pluginName }}/pkg/generated/example/v1alpha1"
	"github.com/{{ kebabCase orgName }}/{{ kebabCase pluginName }}/pkg/generated/manifestdata"
)

// New returns the app.Provider, the single entry point to this package. main.go uses it to read the
// manifest and instantiate the app.App.
func New() app.Provider {
	return simple.NewAppProvider(manifestdata.LocalManifest(), nil, newApp)
}

// newApp is the factory passed to simple.NewAppProvider; it builds the app.App from the resolved
// config. Attach a Validator, Mutator, or Reconciler per kind as you need one — see
// simple.AppManagedKind and ./.config/AGENTS/app-sdk.md.
func newApp(cfg app.Config) (app.App, error) {
	return simple.NewApp(simple.AppConfig{
		Name:       "{{ pluginId }}",
		KubeConfig: cfg.KubeConfig,
		ManagedKinds: []simple.AppManagedKind{
			{
				Kind: examplev1alpha1.Kind(),
			},
		},
	})
}
