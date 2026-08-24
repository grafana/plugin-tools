package kinds

// config holds the grafana-app-sdk code generation settings, and is read by
// `grafana-app-sdk generate` (via the default `-c config` selector) when you run
// `{{ packageManagerName }} run generate:kinds`.
//
// Paths are relative to the plugin root and match the layout scaffolded by @grafana/create-plugin:
// the frontend lives in src/.
config: {
	definitions: {
       		manifestVersion:  "v1alpha2"

                // DO NOT EDIT
		// The manifest tells Grafana which kinds and capabilities your app serves. Write it
		// straight into src/ so the frontend build picks it up as-is.
		manifestSchemas:  true
		path:             "src"
		manifestFileName: "app-sdk-manifest.json"
		encoding:         "json"
		// Do not generate separate files per-CRD, they are not used.
		genCRDs: false
	}

	codegen: {
		// This plugin has no Go backend, so skip Go code generation entirely: only TypeScript and
		// the definitions below are emitted, and no Go toolchain is needed to generate them.
		goEnabled: false
		// Generated TypeScript types land in the frontend source dir.
		tsGenPath:                      "src/generated/"
		enableK8sPostProcessing:        false
		enableOperatorStatusGeneration: false
	}
}
