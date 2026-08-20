package kinds

// exampleKind holds the information about the Example kind that does not change between versions.
// Rename this kind (and its file) to model your own resource.
exampleKind: {
	kind:       "Example"
	pluralName: "Examples"
	// Namespaced resources are created per-tenant. Use "Cluster" for global resources.
	scope: "Namespaced"
	codegen: {
		ts: {
			enabled: true
		}
		go: {
			enabled: true
		}
	}
}

// examplev1alpha1 is the v1alpha1 version of the Example kind: the common kind information plus
// this version's schema. Edit the spec to model your resource, then re-run code generation.
examplev1alpha1: exampleKind & {
	schema: {
		spec: {
			title:       string
			description: string
		}
	}
}
