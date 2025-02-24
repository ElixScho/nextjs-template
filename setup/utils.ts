import fs from "fs";
import path from "path";

interface UpdateRootLayoutOptions {
    projectPath: string;
    importStatement: string;
    providerComponent: string;
}

interface EnvVariable {
    key: string;
    value: string;
    description?: string;
    isSecret?: boolean;
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
        // Find the body content
        const bodyMatch = layoutContent.match(
            /<body[^>]*>([\s\S]*?){children}([\s\S]*?)<\/body>/
        );
        if (bodyMatch) {
            const [, beforeChildren, afterChildren] = bodyMatch;
            let newBodyContent = beforeChildren;

            // Find all existing providers
            const providers =
                beforeChildren.match(/<(\w+Provider)[^>]*>[\s\S]*?<\/\1>/g) ||
                [];

            // If we have providers, we need to handle nesting
            if (providers.length > 0) {
                // Get the innermost provider
                const lastProvider = providers[providers.length - 1];
                // Replace its children with our new provider
                const newProviderContent = options.providerComponent.replace(
                    "{children}",
                    "{children}"
                );
                newBodyContent = beforeChildren.replace(
                    lastProvider,
                    lastProvider.replace(/{children}/, newProviderContent)
                );
            } else {
                // No existing providers, just add at the start of body
                newBodyContent = options.providerComponent + beforeChildren;
            }

            // Replace the body content
            const bodyOpenTag = bodyMatch[0].match(/<body([^>]*>)/);
            if (bodyOpenTag) {
                layoutContent = layoutContent.replace(
                    /<body[^>]*>[\s\S]*?<\/body>/,
                    `<body${bodyOpenTag[1]}\n                ${newBodyContent}{children}${afterChildren}</body>`
                );
            }
        }
    }

    // Write the updated content back to the file
    fs.writeFileSync(layoutPath, layoutContent, "utf-8");
}

/**
 * Updates or creates environment variables in .env and .env.local files
 * @param projectPath - Path to the project root
 * @param variables - Array of environment variables to add
 * @param sectionDescription - Optional description for this section of variables
 */
export function updateEnvVariables(
    projectPath: string,
    variables: EnvVariable[],
    sectionDescription?: string
) {
    const envPath = path.join(projectPath, ".env");
    const envLocalPath = path.join(projectPath, ".env.local");

    // Prepare content with description if provided
    const header = sectionDescription ? `\n# ${sectionDescription}\n` : "\n";

    // Split variables into regular and secret
    const regularVars = variables.filter(v => !v.isSecret);
    const secretVars = variables.filter(v => v.isSecret);

    // Generate content for .env (non-secret variables)
    if (regularVars.length > 0) {
        const envContent =
            header +
            regularVars
                .map(({ key, value, description }) => {
                    return description
                        ? `# ${description}\n${key}=${value}`
                        : `${key}=${value}`;
                })
                .join("\n") +
            "\n";

        // Update or create .env
        if (fs.existsSync(envPath)) {
            const existingEnv = fs.readFileSync(envPath, "utf-8");
            const hasAnyVar = regularVars.some(({ key }) =>
                existingEnv.includes(key)
            );
            if (!hasAnyVar) {
                fs.writeFileSync(envPath, existingEnv + envContent);
            }
        } else {
            fs.writeFileSync(envPath, envContent);
        }
    }

    // Generate content for .env.local (secret variables)
    if (secretVars.length > 0) {
        const envLocalContent =
            header +
            secretVars
                .map(({ key, value, description }) => {
                    return description
                        ? `# ${description}\n${key}=${value}`
                        : `${key}=${value}`;
                })
                .join("\n") +
            "\n";

        // Update or create .env.local
        if (fs.existsSync(envLocalPath)) {
            const existingLocal = fs.readFileSync(envLocalPath, "utf-8");
            const hasAnyVar = secretVars.some(({ key }) =>
                existingLocal.includes(key)
            );
            if (!hasAnyVar) {
                fs.writeFileSync(envLocalPath, existingLocal + envLocalContent);
            }
        } else {
            fs.writeFileSync(envLocalPath, envLocalContent);
        }
    }
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
