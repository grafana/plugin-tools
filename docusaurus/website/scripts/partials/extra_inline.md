{{~#if (isdefined default)}}{{prefix_text}}Default: {{jsoninline default}}<br/>{{~/if}}
{{~#if (isdefined enum)}}{{prefix_text}}Possible values are: {{jsoninline enum}}<br/>{{~/if}}
{{~#if (isdefined const)}}{{prefix_text}}Constant Value: {{jsoninline const}}<br/>{{~/if}}
{{~#if (isdefined contentMediaType)}}{{prefix_text}}Content Media Type: {{jsoninline contentMediaType}}<br/>{{~/if}}
{{~#if (isdefined contentEncoding)}}{{prefix_text}}Content Encoding: {{jsoninline contentEncoding}}<br/>{{~/if}}
{{~#if (isdefined minLength)}}{{prefix_text}}Minimal Length: {{jsoninline minLength}}<br/>{{~/if}}
{{~#if (isdefined maxLength)}}{{prefix_text}}Maximal Length: {{jsoninline maxLength}}<br/>{{~/if}}
{{~#if (isdefined format)}}{{prefix_text}}Format: {{jsoninline format}}<br/>{{~/if}}
{{~#if (isdefined pattern)}}{{prefix_text}}Pattern: {{code (escapeRegexp pattern)}}<br/>{{~/if~}}
{{~#if (isdefined exclusiveMinimum)}}{{prefix_text}}Minimum (exclusive): {{jsoninline exclusiveMinimum}}<br/>{{~/if}}
{{~#if (isdefined minimum)}}{{prefix_text}}Minimum: {{jsoninline minimum}}<br/>{{~/if}}
{{~#if (isdefined exclusiveMaximum)}}{{prefix_text}}Maximum (exclusive): {{jsoninline exclusiveMaximum}}<br/>{{~/if}}
{{~#if (isdefined maximum)}}{{prefix_text}}Maximum: {{jsoninline maximum}}<br/>{{~/if}}
{{~#if (isdefined multipleOf)}}{{prefix_text}}Multiple of: {{jsoninline multipleOf}}<br/>{{~/if~}}
