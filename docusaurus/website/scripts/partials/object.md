{{#if (length properties) ~}}
**{{prefix_text}}Properties**

{{> object_property_header}}
{{#each properties ~}}
{{> object_property (jsmk_property . path=(pathjoinobj ../path @key .) parent=.. name=@key)}}
{{/each}}

{{/if}}
{{#if (length patternProperties) ~}}
**{{prefix_text}}Properties (Pattern)**

{{> object_property_header}}
{{#each patternProperties ~}}
{{> object_property (jsmk_property . path=(pathjoinobj ../path @key .) parent=.. name=@key)}}
{{/each}}

{{/if}}

{{#if (isdefined minProperties)}}
**{{prefix_text}}Minimal Properties:** {{escape minProperties}}{{br}}
{{/if~}}
{{#if (isdefined maxProperties)}}
**{{prefix_text}}Maximal Properties:** {{escape maxProperties}}{{br}}
{{/if~}}
{{#if (and (isdefined propertyNames) (isdefined propertyNames.pattern))}}
**{{prefix_text}}Property Name Pattern:** {{code (escapeRegexp propertyNames.pattern)}}{{br}}
{{/if~}}
{{#if (isdefined dependentRequired)}}
{{#each dependentRequired}}
**{{prefix_text}}If property _{{@key}}_ is defined**, property/ies {{#each this}}_{{this}}_{{#unless @last}}, {{/unless}}{{/each}} is/are required.{{br}}
{{/each}}
{{/if~}}
{{#if (isdefined dependentSchemas)}}
{{#each dependentSchemas}}
**{{prefix_text}}If property _{{@key}}_ is defined**:

{{> element_part this type=(or type ../type) path=(pathjoin path (plus "dependentSchemas " @key))}}

{{/each}}
{{/if~}}
