# Building remote docker developer image

This is a first-pass at creating a dev image of grafana that spins up `delve` along with grafana to allow remote debugging.

The image it is based on also supports the full dev build of react to enable profiling (chrome react dev tools)

## Connecting from VSCode

Example launch config for vscode:

```JSON
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Standalone debug mode",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/pkg",
      "env": {},
      "args": [
        "-standalone"
      ]
    },
    {
      "name": "Attach to plugin backend in docker",
      "type": "go",
      "request": "attach",
      "mode": "remote",
      "remotePath": "",
      "port": 2345,
      "host": "127.0.0.1",
      "showLog": true,
      "trace": "log",
      "logOutput": "rpc"
    }
  ]
}
```
