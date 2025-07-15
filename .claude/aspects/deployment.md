# Deployment

This project is an MCP server intended for use via `npx`. To enable this, it must be published to the npm registry.

## Deployment Steps

1. **Build the Project**

    Ensure all build steps are completed and the output is ready for publishing.

    ```sh
    npm run build
    ```

2. **Update Version**

    Update the version in `package.json` according to [semantic versioning](https://semver.org/).

    ```sh
    npm version <major|minor|patch>
    ```

3. **Login to npm**

    Authenticate with your npm account.

    ```sh
    npm login
    ```

4. **Publish to npm**

    Publish the package to the npm registry.

    ```sh
    npm publish --access public
    ```

5. **Usage via npx**

    After publishing, users can invoke the MCP server directly:

    ```sh
    npx <package-name> [options]
    ```

## Notes

- Ensure the `bin` field in `package.json` is correctly set for CLI usage.
- Test the published package with `npx` before announcing availability.
- For private packages, adjust the `--access` flag and npm settings accordingly.
