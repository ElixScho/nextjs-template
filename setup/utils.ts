import fs from "fs";
import path from "path";

interface UpdateRootLayoutOptions {
    projectPath: string;
    importStatement: string;
    providerComponent: string;
}

/**
 * Updates the root layout file with new providers and imports
 */
export function updateRootLayout(options: UpdateRootLayoutOptions) {
    const layoutPath = path.join(options.projectPath, "app", "layout.tsx");
    let layoutContent = fs.readFileSync(layoutPath, "utf-8");

    // Add import statement if it doesn't exist
    if (!layoutContent.includes(options.importStatement)) {
        layoutContent = options.importStatement + layoutContent;
    }

    // Add provider to the body if it doesn't exist
    if (!layoutContent.includes(options.providerComponent)) {
        if (options.providerComponent.includes("{children}")) {
            // For providers that wrap children
            // Find the innermost provider or the children placeholder
            const bodyMatch = layoutContent.match(
                /<body[^>]*>([\s\S]*?){children}([\s\S]*?)<\/body>/
            );
            if (bodyMatch) {
                const [, beforeChildren] = bodyMatch;
                // Check if there are existing providers
                const hasProviders = beforeChildren.includes("Provider");

                if (hasProviders) {
                    // Find the innermost provider's children
                    const lastProviderMatch = beforeChildren.match(
                        /(.*Provider[^>]*>)([\s\S]*)$/
                    );
                    if (lastProviderMatch) {
                        const [, , indent] = lastProviderMatch;
                        // Replace the children in the new provider and maintain indentation
                        const indentedProvider =
                            options.providerComponent.replace(
                                "{children}",
                                `\n${indent}{children}`
                            );
                        layoutContent = layoutContent.replace(
                            /{children}/,
                            indentedProvider
                        );
                    }
                } else {
                    // No existing providers, just wrap children
                    layoutContent = layoutContent.replace(
                        /{children}/,
                        options.providerComponent
                    );
                }
            }
        } else {
            // For providers that don't wrap children (like modals, toasts)
            layoutContent = layoutContent.replace(
                /<body([^>]*)>\s*(?=[\s\S]*{children})/,
                `<body$1>\n                ${options.providerComponent}\n`
            );
        }
    }

    // Write the updated content back to the file
    fs.writeFileSync(layoutPath, layoutContent, "utf-8");
}

/**
 * Helper to check if a provider is already present in the layout
 */
export function hasProvider(
    projectPath: string,
    providerName: string
): boolean {
    const layoutPath = path.join(projectPath, "app", "layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    return layoutContent.includes(providerName);
}
