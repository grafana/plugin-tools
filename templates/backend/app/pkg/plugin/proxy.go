package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type jsonData struct {
	URL string `json:"backendUrl"`
}

type Settings struct {
	URL         string
	AccessToken string
	APIKey      string
}

var client = &http.Client{Timeout: 30 * time.Second}

func LoadSettings(req *backend.CallResourceRequest) (Settings, error) {
	settings := Settings{}

	var jd jsonData
	err := json.Unmarshal(req.PluginContext.AppInstanceSettings.JSONData, &jd)
	if err != nil {
		err = fmt.Errorf("LoadSettings: json.Unmarshal: %w", err)
		log.DefaultLogger.Error(err.Error())
		return settings, err
	}

	settings.AccessToken = strings.TrimSpace(req.PluginContext.AppInstanceSettings.DecryptedSecureJSONData["accessToken"])
	settings.APIKey = strings.TrimSpace(req.PluginContext.AppInstanceSettings.DecryptedSecureJSONData["apiKey"])
	settings.URL = jd.URL

	// Ensure that the settings.URL is always suffixed with a slash iff needed.
	if !strings.HasSuffix(settings.URL, "/") {
		settings.URL = settings.URL + "/"
	}

	return settings, nil
}

func handleError(sender backend.CallResourceResponseSender, status int, errStr string) error {
	return sender.Send(&backend.CallResourceResponse{
		Status: status,
		Body:   []byte(errStr),
	})
}

func ProxyHandler(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	// load all needed settings from the callResourceRequest
	settings, err := LoadSettings(req)
	if err != nil {
		return handleError(sender, http.StatusBadRequest, "invalid AppSettings")
	}

	// API requests will fail if no accessToken is set,
	// so there is no point in sending them.
	if settings.AccessToken == "" {
		return handleError(sender, http.StatusBadRequest, "accessToken not set")
	}

	// merge the backendUrl with the path requested
	backendURL := settings.URL + req.URL

	// if there is a request body, wrap it in an io.Reader
	var body io.Reader
	if len(req.Body) > 0 {
		body = bytes.NewReader(req.Body)
	}

	// create the http request to send to the api
	backendReq, err := http.NewRequestWithContext(ctx, req.Method, backendURL, body)
	if err != nil {
		return handleError(sender, http.StatusBadRequest, err.Error())
	}
	for key, values := range req.Headers {
		backendReq.Header[key] = values
	}

	// Add auth header
	backendReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", settings.AccessToken))

	// Add user header
	if req.PluginContext.User != nil {

		if req.PluginContext.User.Email != "" {
			backendReq.Header.Set("X-Grafana-User", "email:"+req.PluginContext.User.Email)
		} else {
			backendReq.Header.Set("X-Grafana-User", "grafana-login:"+req.PluginContext.User.Login)
		}
		backendReq.Header.Set("X-Grafana-Role", req.PluginContext.User.Role)
	}

	// execute the request
	resp, err := client.Do(backendReq)
	if err != nil {
		return handleError(sender, http.StatusServiceUnavailable, err.Error())
	}
	defer resp.Body.Close()

	// read the response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return handleError(sender, http.StatusServiceUnavailable, err.Error())
	}

	// return the response to the caller.
	return sender.Send(&backend.CallResourceResponse{
		Status:  resp.StatusCode,
		Headers: resp.Header,
		Body:    respBody,
	})
}
