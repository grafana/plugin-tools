package plugin

import (
	"context"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"net/http"
	"testing"
)

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

func TestCallResource(t *testing.T) {
	// Initialize app
	inst, err := NewApp(backend.AppInstanceSettings{})
	require.NoError(t, err, "NewApp must not return an error")
	require.NotNil(t, inst, "inst must not be nil")
	app, ok := inst.(*App)
	require.True(t, ok, "inst should be of type *App")

	// request contains the fields set to the request that will be made to CallResource.
	type request struct {
		method string
		path   string
		body   []byte
	}

	// expect represents is a struct that contains expectations
	// for the response received from CallResource.
	// Any zero-values won't be checked.
	type expect struct {
		status      int
		body        []byte
		contentType string
	}

	// Set up and run test cases
	for _, tc := range []struct {
		name    string
		request request
		expect  expect
	}{
		{
			name: "get ping 200",
			request: request{
				method: http.MethodGet,
				path:   "ping",
			},
			expect: expect{
				status:      http.StatusOK,
				contentType: "application/json",
				body:        []byte(`{"message": "ok"}`),
			},
		},
		{
			name: "post echo 200",
			request: request{
				method: http.MethodPost,
				path:   "echo",
				body:   []byte(`{"message": "hello"}`),
			},
			expect: expect{
				status:      http.StatusOK,
				contentType: "application/json",
				body:        []byte(`{"message":"hello"}` + "\n"),
			},
		},
		{
			name: "get echo 405",
			request: request{
				method: http.MethodGet,
				path:   "echo",
			},
			expect: expect{status: http.StatusMethodNotAllowed},
		},
		{
			name: "get non existing handler 404",
			request: request{
				method: http.MethodGet,
				path:   "not_found",
			},
			expect: expect{
				status:      http.StatusNotFound,
				contentType: "text/plain; charset=utf-8",
				body:        []byte("404 page not found\n"),
			},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var r mockCallResourceResponseSender
			err = app.CallResource(context.Background(), &backend.CallResourceRequest{
				Method: tc.request.method,
				Path:   tc.request.path,
				Body:   tc.request.body,
			}, &r)
			require.NoError(t, err, "CallResource must not return an error")
			require.NotNil(t, r.response, "no response received from CallResource")
			if tc.expect.status > 0 {
				assert.Equalf(t, tc.expect.status, r.response.Status, "response status should be %d", tc.expect.status)
			}
			if len(tc.expect.contentType) > 0 {
				ct := r.response.Headers["Content-Type"]
				require.Len(t, ct, 1, "should have 1 Content-Type header")
				assert.Equalf(t, tc.expect.contentType, ct[0], "should have %s content-type", tc.expect.contentType)
			}
			if tc.expect.body != nil {
				assert.Equal(t, tc.expect.body, r.response.Body, "response body should be correct")
			}
		})
	}
}
