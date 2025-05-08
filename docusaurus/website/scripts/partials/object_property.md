|
{{~#mylink .}}**{{escape name}}**{{/mylink ~}}
{{#if (and title (title_isnot_name .))}}<br/>({{escape title}}){{/if ~}}
|
{{~code display_type ~}}
|
{{~#if deprecated}}(DEPRECATED)<br/>{{/if}}
{{~#if description ~}}
{{firstline description .}}<br/>{{/if ~}}
{{>extra_inline . ~}}
|
{{~#if (isdefined required)}}{{#if required}} ✅ {{/if}}{{/if~}}
|
