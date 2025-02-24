#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import shell from "shelljs";
import { spawn } from "child_process";
import {
    useStripe,
    useToaster,
    useShadcn,
    usePrisma,
    useAuth,
    useStorybook,
    SetupContext,
} from "./setup/index";
import { updateRootLayout } from "./setup/utils";

// Helper function to manage environment variables
function updateEnvFile(
    newVariables: Record<string, string>,
    description?: string
) {
    const envPath = path.join(process.cwd(), ".env");
    const envExamplePath = path.join(process.cwd(), ".env.example");

    // Prepare content with description if provided
    const content = description ? `\n# ${description}\n` : "\n";
    const envContent =
        content +
        Object.entries(newVariables)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n") +
        "\n";

    const exampleContent =
        content +
        Object.entries(newVariables)
            .map(
                ([key, value]) =>
                    `${key}=${
                        value.startsWith("your_")
                            ? value
                            : `your_${key.toLowerCase()}`
                    }`
            )
            .join("\n") +
        "\n";

    // Update or create .env
    if (fs.existsSync(envPath)) {
        const existingEnv = fs.readFileSync(envPath, "utf-8");
        const hasAnyVar = Object.keys(newVariables).some(key =>
            existingEnv.includes(key)
        );
        if (!hasAnyVar) {
            fs.writeFileSync(envPath, existingEnv + envContent);
        }
    } else {
        fs.writeFileSync(envPath, envContent);
    }

    // Update or create .env.example
    if (fs.existsSync(envExamplePath)) {
        const existingExample = fs.readFileSync(envExamplePath, "utf-8");
        const hasAnyVar = Object.keys(newVariables).some(key =>
            existingExample.includes(key)
        );
        if (!hasAnyVar) {
            fs.writeFileSync(envExamplePath, existingExample + exampleContent);
        }
    } else {
        fs.writeFileSync(envExamplePath, exampleContent);
    }
}

async function main() {
    const inquirer = (await import("inquirer")).default;

    // Helper function to execute shell commands
    const execCommand = (
        command: string,
        interactive = false
    ): Promise<boolean> => {
        return new Promise(resolve => {
            if (interactive) {
                // Split command into command and args
                const [cmd, ...args] = command.split(" ");

                // For interactive commands, use spawn with inherit
                const child = spawn(cmd, args, {
                    stdio: "inherit",
                    shell: true,
                });

                child.on("exit", code => {
                    resolve(code === 0);
                });
            } else {
                // For non-interactive commands, use silent execution
                const result = shell.exec(command, { silent: true });
                if (result.code !== 0) {
                    console.error(
                        chalk.red(`Error executing command: ${command}`)
                    );
                    console.error(chalk.red(result.stderr));
                    resolve(false);
                }
                resolve(true);
            }
        });
    };

    // Helper function to create directories if they don't exist
    const ensureDirectoryExists = (dirPath: string): void => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    };

    console.log(chalk.blue.bold("🚀 Welcome to the Next.js Template Setup!"));
    console.log(
        chalk.cyan("Let's configure your project with some awesome features.\n")
    );

    // Setup modules
    const modules = [
        useStripe,
        useToaster,
        useShadcn,
        usePrisma,
        useAuth,
        useStorybook,
    ];

    // Get user choices
    const questions = modules.map(module => ({
        type: module.question.type,
        name: module.name,
        message: module.question.message,
        default: module.question.default,
    }));

    const answers = await inquirer.prompt(questions);

    console.log(
        chalk.green("\n🛠️ Setting up your project based on your choices...\n")
    );

    // Initialize base environment variables
    updateEnvFile(
        {
            NODE_ENV: "development",
            NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        },
        "Base Configuration"
    );

    // Create necessary directories
    ensureDirectoryExists("components");
    ensureDirectoryExists("lib");
    ensureDirectoryExists("styles");
    ensureDirectoryExists("types");

    // Setup context
    const context: SetupContext = {
        projectPath: process.cwd(),
        execCommand,
        ensureDirectoryExists,
        updateEnvFile,
        updateRootLayout,
    };

    // Run setup for each selected module
    for (const setupModule of modules) {
        if (answers[setupModule.name]) {
            await setupModule.setup(context);
        }
    }

    // Update package.json scripts
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    packageJson.scripts = {
        ...packageJson.scripts,
        setup: "ts-node setup.ts",
        format: "prettier --write .",
    };
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

    // Print completion message
    console.log(
        chalk.green("\n✨ Setup complete! Your project is ready to go!\n")
    );
    console.log(chalk.cyan("Next steps:"));
    console.log(chalk.white("1. Run `npm install` to install dependencies"));
    console.log(
        chalk.white("2. Run `npm run dev` to start the development server")
    );

    console.log(chalk.blue("\nHappy coding! 🎉\n"));
}

main().catch(error => {
    console.error(chalk.red("Error during setup:"));
    console.error(error);
    process.exit(1);
});
