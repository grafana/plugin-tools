/**
 * E2E Data panel - renders the PanelData it receives as JSON for @grafana/plugin-e2e to read.
 *
 * Hand-written AMD with React.createElement so it loads in Grafana without a build step.
 * The payload is an allowlist: keys Grafana adds between versions are left out on purpose,
 * so a recorded snapshot only changes when the data itself changes.
 */
define(['react', '@grafana/data'], function (React, grafanaData) {
  'use strict';

  let SCHEMA_VERSION = 1;
  let META_KEYS = ['type', 'preferredVisualisationType', 'notices', 'custom'];
  let CONFIG_KEYS = ['unit', 'displayName', 'displayNameFromDS', 'decimals', 'min', 'max', 'interval'];
  let ERROR_KEYS = ['refId', 'message', 'status'];
  let h = React.createElement;

  function pick(source, keys) {
    let result = {};
    keys.forEach(function (key) {
      if (source && source[key] !== undefined) {
        result[key] = source[key];
      }
    });
    return result;
  }

  function isDataFrame(value) {
    return (
      Boolean(value) && typeof value === 'object' && Array.isArray(value.fields) && typeof value.length === 'number'
    );
  }

  // grafana < 10 stores field values in a Vector, not a plain array
  function toArray(values) {
    if (Array.isArray(values)) {
      return values;
    }
    if (values && typeof values.toArray === 'function') {
      return values.toArray();
    }
    return Array.from(values || []);
  }

  function encodeValue(value) {
    if (value === undefined) {
      return null;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return String(value);
    }
    if (isDataFrame(value)) {
      return serializeFrame(value);
    }
    return value;
  }

  function serializeLinks(links) {
    return links.map(function (link) {
      let result = pick(link, ['title', 'url']);
      if (link.internal) {
        result.internal = pick(link.internal, ['datasourceUid']);
      }
      return result;
    });
  }

  function getDisplayName(field, frame, frames) {
    try {
      return grafanaData.getFieldDisplayName(field, frame, frames);
    } catch (e) {
      return field.name;
    }
  }

  function serializeField(field, frame, frames) {
    let config = pick(field.config, CONFIG_KEYS);
    if (field.config && Array.isArray(field.config.links) && field.config.links.length > 0) {
      config.links = serializeLinks(field.config.links);
    }
    return {
      name: field.name,
      displayName: getDisplayName(field, frame, frames),
      type: field.type,
      labels: field.labels,
      config: config,
      values: toArray(field.values).map(encodeValue),
    };
  }

  function serializeFrame(frame, frames) {
    let meta = pick(frame.meta, META_KEYS);
    return {
      refId: frame.refId,
      name: frame.name,
      length: frame.length,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
      fields: frame.fields.map(function (field) {
        return serializeField(field, frame, frames);
      }),
    };
  }

  function serializePanelData(data) {
    let series = (data && data.series) || [];
    let errors = (data && data.errors) || (data && data.error ? [data.error] : []);
    return {
      schemaVersion: SCHEMA_VERSION,
      requestId: data && data.request ? data.request.requestId : undefined,
      state: data ? data.state : undefined,
      errors: errors.map(function (error) {
        return pick(error, ERROR_KEYS);
      }),
      series: series.map(function (frame) {
        return serializeFrame(frame, series);
      }),
    };
  }

  function summarizeFrame(frame) {
    let type = frame.meta && frame.meta.type ? ' ' + frame.meta.type : '';
    let fields = frame.fields
      .map(function (field) {
        return field.name + ':' + field.type;
      })
      .join('  ');
    return (frame.refId || '-') + type + '  ' + frame.fields.length + ' fields x ' + frame.length + ' rows  ' + fields;
  }

  function DataPanel(props) {
    let data = props.data;
    let revisionRef = React.useRef({ data: null, revision: 0 });
    if (revisionRef.current.data !== data) {
      revisionRef.current = { data: data, revision: revisionRef.current.revision + 1 };
    }
    let revision = revisionRef.current.revision;
    let payload = React.useMemo(
      function () {
        return serializePanelData(data);
      },
      [data]
    );

    return h(
      'div',
      {
        'data-testid': 'data-testid e2e-data-panel',
        'data-state': payload.state,
        'data-revision': String(revision),
        'data-request-id': payload.requestId || '',
        style: { width: props.width, height: props.height, overflow: 'auto', fontFamily: 'monospace', fontSize: 12 },
      },
      h('div', null, 'E2E data · ' + payload.state + ' · revision ' + revision),
      payload.series.map(function (frame, index) {
        return h('div', { key: index }, summarizeFrame(frame));
      }),
      payload.errors.map(function (error, index) {
        return h('div', { key: 'error-' + index }, 'error ' + (error.refId || '') + ': ' + (error.message || ''));
      }),
      h('pre', { hidden: true, 'data-testid': 'data-testid e2e-data-panel-json' }, JSON.stringify(payload))
    );
  }

  return {
    plugin: new grafanaData.PanelPlugin(DataPanel),
    serializePanelData: serializePanelData,
  };
});
