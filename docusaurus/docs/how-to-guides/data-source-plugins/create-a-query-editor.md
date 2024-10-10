---
id: create-a-query-editor
title: Creating a Query Editor for a Grafana Data Source Plugin
description: Learn how to create a query editor for a data source
keywords:
  - grafana
  - plugins
  - query
  - editor
  - code editor
  - builder editor
  - datasource
---

# Creating a Query Editor for a Grafana Data Source Plugin

### Introduction

A query editor in Grafana is an interface that allows users to define and customize queries to retrieve data from a specific data source. It provides a way for users to interact with their data through either a code editor or a builder interface, making it easier to construct queries.

In addition to data source plugins, the query editor is also used within Grafana alerting. When creating alerting rules, the query editor allows users to define the conditions under which alerts should be triggered. This enables precise monitoring and alerting based on specific data metrics or log patterns.

### Types of Query Editor

There are primarily two types of query editors in Grafana:

1. **Code Editor**: This allows users to write raw query code using a text editor, often enhanced with features like syntax highlighting, auto-completion, and error detection.
2. **Builder Editor**: This provides a more visual and guided way to construct queries, often through dropdowns, checkboxes, and other interactive UI elements.

### Creating a Code Editor

Here's a step-by-step guide to creating a basic Monaco code editor as a query editor.

#### Steps:

1. **Set up the Code Editor Component**:

   - Import necessary modules and components:
     ```typescript
     import { CodeEditor } from '@grafana/ui';
     import { useState, useEffect, useRef } from 'react';
     ```
   - Define the `CodeEditor` component:

     ```tsx
     const QueryCodeEditor = ({ query, onChange, onRunQuery }) => {
       const editorRef = useRef(null);

       const handleEditorChange = (value) => {
         onChange({ ...query, expr: value });
       };

       return (
         <CodeEditor
           value={query.expr || ''}
           language="sql" // or any other language
           onBlur={handleEditorChange}
           onChange={handleEditorChange}
           onEditorDidMount={(editor) => {
             editorRef.current = editor;
             // Additional configurations or listeners can be added here
           }}
         />
       );
     };
     ```

2. **Integrate the Code Editor into the Plugin**:

   - Import and use the `QueryCodeEditor` in your plugin setup:

     ```typescript
     import { DataSourcePlugin } from '@grafana/data';
     import { QueryCodeEditor } from './QueryCodeEditor'; // Path to your editor component

     export const plugin = new DataSourcePlugin(DataSource).setQueryEditor(QueryCodeEditor);
     ```

### Creating a Builder Editor

Here's how you can create a builder editor and provide a selector to switch between the code editor and builder editor.

#### Steps:

1. **Set up the Builder Editor Component**:

   - Define the `BuilderEditor` component:

     ```tsx
     const QueryBuilderEditor = ({ query, onChange, onRunQuery }) => {
       const handleFieldChange = (field, value) => {
         onChange({ ...query, [field]: value });
       };

       return (
         <div>
           {/* Example field */}
           <input type="text" value={query.field || ''} onChange={(e) => handleFieldChange('field', e.target.value)} />
           {/* Add more fields as needed */}
         </div>
       );
     };
     ```

2. **Create a Selector Component**:

   - Define a component that allows users to switch between the code and builder editors:

     ```tsx
     const QueryEditorSelector = ({ query, onChange, onRunQuery }) => {
       const [editorMode, setEditorMode] = useState('code'); // 'code' or 'builder'

       return (
         <div>
           <button onClick={() => setEditorMode('code')}>Code Editor</button>
           <button onClick={() => setEditorMode('builder')}>Builder Editor</button>
           {editorMode === 'code' ? (
             <QueryCodeEditor query={query} onChange={onChange} onRunQuery={onRunQuery} />
           ) : (
             <QueryBuilderEditor query={query} onChange={onChange} onRunQuery={onRunQuery} />
           )}
         </div>
       );
     };
     ```

3. **Integrate the Selector into the Plugin**:

   - Use the `QueryEditorSelector` in your plugin setup:

     ```typescript
     import { DataSourcePlugin } from '@grafana/data';
     import { QueryEditorSelector } from './QueryEditorSelector'; // Path to your selector component

     export const plugin = new DataSourcePlugin(DataSource).setQueryEditor(QueryEditorSelector);
     ```

### Summary

In this tutorial, we've explored what a query editor is and the different types available in Grafana.
We provided a step-by-step guide to creating both a code editor and a builder editor for a Grafana data source plugin, including how to switch between these editors.
This allows users to choose their preferred method for constructing queries.
