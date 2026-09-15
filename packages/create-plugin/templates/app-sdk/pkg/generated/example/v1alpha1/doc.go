// Package v1alpha1 is a stub that exists purely so `go mod tidy` resolves its dependencies before
// code generation has run. `generate:kinds` fills this package with its own generated files, without
// removing this one — it's left behind, harmless, since it exports nothing.
package v1alpha1

import (
	_ "k8s.io/apimachinery/pkg/apis/meta/v1"
	_ "k8s.io/apimachinery/pkg/runtime"
	_ "k8s.io/apimachinery/pkg/runtime/schema"
	_ "k8s.io/apimachinery/pkg/types"
)
