package plugin

import (
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

// Make sure App implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example app instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler and backend.CallResourceHandler interfaces.
// Plugin should not implement all these interfaces - only those which are
// required for a particular task.
var (
	_ backend.CallResourceHandler   = (*App)(nil)
	_ instancemgmt.InstanceDisposer = (*App)(nil)
)

// App is an example app backend plugin which can respond to data queries, reports
// its health and handle resource calls.
type App struct {
	backend.CallResourceHandler
}

// NewApp creates a new example *App instance.
func NewApp(_ backend.AppInstanceSettings) (instancemgmt.Instance, error) {
	var app App

	// Use a httpadapter (provided by the SDK) for resource calls. This allows us
	// to use a *http.ServeMux for resource calls, so we can map multiple routes
	// to CallResource without having to implement extra logic.
	app.CallResourceHandler = httpadapter.New(newResourceHTTPServeMux(&app))

	return &app, nil
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using the factory function.
func (a *App) Dispose() {
	// cleanup
}
