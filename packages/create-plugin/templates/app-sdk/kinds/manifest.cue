package kinds

manifest: {
	// appName is the unique name of your app. It is used to reference the app from other config
	// objects, and to derive the API group your app serves (by default,
	// LOWER(strip dashes)+".ext.grafana.app"). Set `groupOverride` if you need to pin a shorter or
	// different group.
	appName: "{{ pluginId }}"

	// versions maps each version your app serves to the kinds it exposes. Version names follow the
	// format "v<integer>" or "v<integer>(alpha|beta)<integer>".
	versions: {
		"v1alpha1": v1alpha1
	}

	// extraPermissions declares any additional permissions your app needs, e.g. access to kinds
	// owned by other apps.
	extraPermissions: {
		accessKinds: []
	}

	// roles declares custom RBAC roles for your app. Each role name follows "<app>:<role>" and grants
	// one of three tiers: "viewer" (read), "editor" (read + write), or "admin" (currently identical
	// to "editor"). A role you define here is never granted to anyone without a matching entry in
	// roleBindings below.
	// roles: [
	// 	{
	// 		name:          "{{ pluginId }}:editor"
	// 		permissionSet: "editor"
	// 	},
	// ]

	// roleBindings attaches your app's roles to Grafana's basic roles (viewer/editor/admin), so every
	// Grafana user with that basic role automatically inherits the matching app role.
	// roleBindings: [
	// 	{
	// 		roleName:  "{{ pluginId }}:editor"
	// 		basicRole: "editor"
	// 	},
	// ]
}

// v1alpha1 is the v1alpha1 version of the app's API.
v1alpha1: {
	// kinds lists the version-specific kind values served by this version.
	kinds: [examplev1alpha1]
	// served indicates whether this version is served by the API server. Defaults to true.
	served: true
}
