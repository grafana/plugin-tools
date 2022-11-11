package plugin

import (
	"bytes"
	"context"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestResourceHandlers tests the resource http.HandlerFunc s for the example handlers.
func TestResourceHandlers(t *testing.T) {
	var app App

	// Set up and run test cases
	type tc struct {
		name string

		// request
		method  string
		handler http.HandlerFunc
		body    []byte

		// response (expectations)
		// if something is not provided, it won't be checked
		expStatus int
		expBody   []byte
	}
	for _, tc := range []tc{
		{
			name: "get ping",

			method:  http.MethodGet,
			handler: app.handlePing,

			expStatus: http.StatusOK,
			expBody:   []byte(`{"message": "ok"}`),
		},
		{
			name: "post echo 200",

			method:  http.MethodPost,
			handler: app.handleEcho,
			body:    []byte(`{"message":"hello"}`),

			expStatus: http.StatusOK,
			expBody:   []byte(`{"message":"hello"}`),
		},
		{
			name: "get echo 405",

			method:  http.MethodGet,
			handler: app.handleEcho,

			expStatus: http.StatusMethodNotAllowed,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			// Direct request to the handlerFunc using httptest
			req := httptest.NewRequest(tc.method, "/", bytes.NewBuffer(tc.body))
			w := httptest.NewRecorder()
			tc.handler(w, req)
			res := w.Result()
			defer func() {
				if err := res.Body.Close(); err != nil {
					t.Fatalf("close: %s", err)
				}
			}()

			// Check expectations
			if tc.expStatus > 0 && res.StatusCode != tc.expStatus {
				t.Errorf("wrong status code. expected %d, got %d", tc.expStatus, res.StatusCode)
			}
			if len(tc.expBody) > 0 {
				b, err := io.ReadAll(res.Body)
				if err != nil {
					t.Fatalf("readall: %s", err)
				}
				b = bytes.TrimSpace(b)
				if !bytes.Equal(b, tc.expBody) {
					t.Errorf("response body does not match. expected %s, got %s", string(tc.expBody), string(b))
				}
			}
		})
	}
}

// mockCallResourceResponseSender implements backend.CallResourceResponseSender
// for use in tests.
type mockCallResourceResponseSender struct {
	response *backend.CallResourceResponse
}

// Send sets the received *backend.CallResourceResponse to s.response
func (s *mockCallResourceResponseSender) Send(response *backend.CallResourceResponse) error {
	s.response = response
	return nil
}

// TestCallResource tests CallResource calls, using backend.CallResourceRequest and backend.CallResourceResponse.
// This ensures the httpadapter for CallResource works correctly.
func TestCallResource(t *testing.T) {
	// Initialize app
	inst, err := NewApp(backend.AppInstanceSettings{})
	if err != nil {
		t.Fatalf("new app: %s", err)
	}
	if inst == nil {
		t.Fatal("inst must not be nil")
	}
	app, ok := inst.(*App)
	if !ok {
		t.Fatal("inst must be of type *App")
	}

	// Set up and run test cases
	for _, tc := range []struct {
		name string

		method string
		path   string
		body   []byte

		expStatus int
		expBody   []byte
	}{
		{
			name:      "get ping 200",
			method:    http.MethodGet,
			path:      "ping",
			expStatus: http.StatusOK,
		},
		{
			name:      "post echo 200",
			method:    http.MethodPost,
			path:      "echo",
			body:      []byte(`{"message":"ok"}`),
			expStatus: http.StatusOK,
			expBody:   []byte(`{"message":"ok"}`),
		},
		{
			name:      "get non existing handler 404",
			method:    http.MethodGet,
			path:      "not_found",
			expStatus: http.StatusNotFound,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			// Request by calling CallResource. This tests the httpadapter.
			var r mockCallResourceResponseSender
			err = app.CallResource(context.Background(), &backend.CallResourceRequest{
				Method: tc.method,
				Path:   tc.path,
				Body:   tc.body,
			}, &r)
			if err != nil {
				t.Fatalf("CallResource error: %s", err)
			}
			if r.response == nil {
				t.Fatal("no response received from CallResource")
			}
			if tc.expStatus > 0 && tc.expStatus != r.response.Status {
				t.Errorf("response status should be %d, got %d", tc.expStatus, r.response.Status)
			}
			if len(tc.expBody) > 0 {
				if tb := bytes.TrimSpace(r.response.Body); !bytes.Equal(tb, tc.expBody) {
					t.Errorf("response body should be %s, got %s", tc.expBody, tb)
				}
			}
		})
	}
}
