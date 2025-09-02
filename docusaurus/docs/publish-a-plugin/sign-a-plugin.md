---
id: sign-a-plugin
title: Sign a plugin
sidebar_position: 3
description: How to sign a Grafana plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - sign plugin
  - signing plugin
---

# Sign a plugin

All Grafana Labs-authored plugins, including Enterprise plugins, are signed so that we can verify their authenticity with [signature verification](https://grafana.com/docs/grafana/latest/administration/plugin-management#plugin-signatures). By [default](https://grafana.com/docs/grafana/latest/administration/plugin-management#allow-unsigned-plugins), Grafana requires all plugins to be signed in order for them to be loaded.

:::info

You don't need to sign a plugin during development or when submitting a plugin for review for the first time. The [Docker development environment](../set-up/) that is scaffolded with `@grafana/create-plugin` is configured by default to run in [development mode](https://github.com/grafana/grafana/blob/main/contribute/developer-guide.md#configure-grafana-for-development), which allows you to load the plugin without a signature.

:::

## Public or private plugins

Plugins can have different [signature levels](https://grafana.com/legal/plugins/#what-are-the-different-classifications-of-plugins) depending on their author, related technology, and intended use.

A plugin can be either _public_ or _private_: 

- Public plugins are signed as Community or Commercial. They're distributed within the [Grafana plugin catalog](https://grafana.com/plugins) and are available for others to install.
- Private plugins are only available for use within your organization.

Before signing your plugin, review the [Plugins policy](https://grafana.com/legal/plugins/) to determine the appropriate signature for your plugin.

## Generate an Access Policy token

To verify ownership of your plugin, generate an Access Policy token that you'll use every time you need to sign a new version of your plugin.

1. [Create a Grafana Cloud account](https://grafana.com/signup).

1. Log into your account, and then go to **My Account > Security > Access Policies**.

1. Click **Create access policy**.

   Realm: has to be **your-org-name** (all-stacks)  
   Scope: **plugins:write**

   ![Create access policy.](/img/create-access-policy-v2.png)

1. Click **Create token** to create a new token.

   **Expiration date** is optional, though you should change tokens periodically for increased security.

   ![Create access policy token.](/img/create-access-policy-token.png)

1. Click **Create** and then save a copy of the token somewhere secure for future reference.

1. Proceed to signing your [public plugin](#sign-a-public-plugin) or [private plugin](#sign-a-private-plugin).

## Sign a public plugin

Public plugins need to be reviewed by the Grafana team before you can sign them.

1. Submit your plugin for [review](./publish-or-update-a-plugin.md).
1. If we approve your plugin, you're granted a plugin signature level. You need this signature level to proceed.
1. In your plugin directory, export the Access Policy token as an environment variable using the token you just created.

   ```bash
   export GRAFANA_ACCESS_POLICY_TOKEN=<YOUR_ACCESS_POLICY_TOKEN>
   ```

1. Next, sign the plugin. The Grafana sign-plugin tool creates a [MANIFEST.txt](#add-a-plugin-manifest-for-verification) file in the `dist` directory of your plugin:

   ```shell npm2yarn
   npx @grafana/sign-plugin@latest
   ```

## Sign a private plugin

1. In your plugin directory, export the Access Policy token as an environment variable using the token you just created.

   ```bash
   export GRAFANA_ACCESS_POLICY_TOKEN=<YOUR_ACCESS_POLICY_TOKEN>
   ```

1. Next, sign the plugin. The Grafana sign-plugin tool creates a [MANIFEST.txt](#add-a-plugin-manifest-for-verification) file in the `dist` directory of your plugin. After the `rootUrls` flag, enter a comma-separated list of URLs for the Grafana instances where you intend to install the plugin:

   ```shell npm2yarn
   npx @grafana/sign-plugin@latest --rootUrls https://example.com/grafana
   ```

## Add a plugin manifest for verification

For Grafana to verify the digital signature of a plugin, include a signed manifest file, `MANIFEST.txt`. The signed manifest file contains two sections:

- **Signed message -** Contains plugin metadata and plugin files with their respective checksums (SHA256).
- **Digital signature -** Created by encrypting the signed message using a private key. Grafana has a public key built-in that can be used to verify that the digital signature has been encrypted using the expected private key.

**Example**

```txt
-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

{
  "manifestVersion": "2.0.0",
  "signatureType": "community",
  "signedByOrg": "myorgid",
  "signedByOrgName": "My Org",
  "plugin": "myorgid-simple-panel",
  "version": "1.0.0",
  "time": 1602753404133,
  "keyId": "7e4d0c6a708866e7",
  "files": {
    "LICENSE": "12ab7a0961275f5ce7a428e662279cf49bab887d12b2ff7bfde738346178c28c",
    "module.js.LICENSE.txt": "0d8f66cd4afb566cb5b7e1540c68f43b939d3eba12ace290f18abc4f4cb53ed0",
    "module.js.map": "8a4ede5b5847dec1c6c30008d07bef8a049408d2b1e862841e30357f82e0fa19",
    "plugin.json": "13be5f2fd55bee787c5413b5ba6a1fae2dfe8d2df6c867dadc4657b98f821f90",
    "README.md": "2d90145b28f22348d4f50a81695e888c68ebd4f8baec731fdf2d79c8b187a27f",
    "module.js": "b4b6945bbf3332b08e5e1cb214a5b85c82557b292577eb58c8eb1703bc8e4577"
  }
}
-----BEGIN PGP SIGNATURE-----
Version: OpenPGP.js v4.10.1
Comment: https://openpgpjs.org

wqEEARMKAAYFAl+IE3wACgkQfk0ManCIZudpdwIHTCqjVzfm7DechTa7BTbd
+dNIQtwh8Tv2Q9HksgN6c6M9nbQTP0xNHwxSxHOI8EL3euz/OagzWoiIWulG
7AQo7FYCCQGucaLPPK3tsWaeFqVKy+JtQhrJJui23DAZLSYQYZlKQ+nFqc9x
T6scfmuhWC/TOcm83EVoCzIV3R5dOTKHqkjIUg==
=GdNq
-----END PGP SIGNATURE-----
```

## Troubleshooting

### Why do I get a "Modified signature" error?

In some cases an invalid `MANIFEST.txt` is generated because of an issue when signing the plugin on Windows. You can fix this by replacing all double backslashes, `\\`, with a forward slash, `/`, in the `MANIFEST.txt` file. You need to do this every time you sign your plugin.

### Why do I get a "Field is required: `rootUrls`" error for my public plugin?

With a _public_ plugin, your plugin doesn't have a plugin signature level assigned to it yet. A Grafana team member will assign a signature level to your plugin once it has been reviewed and approved. For more information, refer to [Sign a public plugin](#sign-a-public-plugin).

### Why do I get a "Field is required: `rootUrls`" error for my private plugin?

With a _private_ plugin, you need to add a `rootUrls` flag to the `plugin:sign` command. The `rootUrls` must match the [`root_url`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana#root_url) configuration. For more information, refer to [Sign a private plugin](#sign-a-private-plugin).

If you still get this error, make sure that the Access Policy token was generated by a Grafana Cloud account that matches the first part of the plugin ID.
