import chalk from "chalk";
import fs from "fs";
import type { SetupModule } from "./types";
import { updateRootLayout } from "./utils";

interface ShadcnConfig {
    style: "new-york" | "default";
    baseColor: string;
    cssVariables: boolean;
}

const shadcnModule: SetupModule = {
    name: "useShadcn",
    question: {
        type: "confirm",
        message: "🎨 Do you want to add shadcn/ui components?",
        default: true,
    },
    setup: async context => {
        // Default configuration
        const config: ShadcnConfig = {
            style: "new-york",
            baseColor: "zinc",
            cssVariables: true,
        };

        console.log(chalk.yellow("Adding shadcn..."));

        // Run shadcn init in interactive mode
        const initSuccess = await context.execCommand(
            "npx shadcn@latest init",
            true
        );
        if (!initSuccess) {
            console.error(chalk.red("Failed to initialize shadcn/ui"));
            return;
        }

        // Install required dependencies for dark mode
        console.log(chalk.yellow("\nInstalling dark mode dependencies..."));
        const depsSuccess = await context.execCommand(
            "npm install next-themes lucide-react --force"
        );
        if (!depsSuccess) {
            console.error(
                chalk.red("Failed to install dark mode dependencies")
            );
            return;
        }

        // Add required shadcn components for dark mode toggle
        console.log(
            chalk.yellow("\nAdding required components for dark mode...")
        );

        // Add button component with force flag
        const buttonSuccess = await context.execCommand(
            "npx shadcn@latest add button",
            true
        );
        if (!buttonSuccess) {
            console.error(chalk.red("Failed to add button component"));
            return;
        }

        // Add dropdown-menu component with force flag
        const dropdownSuccess = await context.execCommand(
            "npx shadcn@latest add dropdown-menu",
            true
        );
        if (!dropdownSuccess) {
            console.error(chalk.red("Failed to add dropdown-menu component"));
            return;
        }

        // Update root layout with ThemeProvider
        console.log(chalk.yellow("\nSetting up ThemeProvider..."));
        updateRootLayout({
            projectPath: context.projectPath,
            importStatement:
                'import { ThemeProvider } from "@/components/theme-provider";\n\n',
            providerComponent: `<ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>`,
        });

        // Add suppressHydrationWarning to html tag
        console.log(chalk.yellow("Adding hydration warning suppression..."));
        const layoutPath = `${context.projectPath}/app/layout.tsx`;
        let layoutContent = fs.readFileSync(layoutPath, "utf-8");
        if (!layoutContent.includes("suppressHydrationWarning")) {
            layoutContent = layoutContent.replace(
                /<html([^>]*)>/,
                "<html$1 suppressHydrationWarning>"
            );
            fs.writeFileSync(layoutPath, layoutContent, "utf-8");
        }

        // Log completion message with helpful information
        console.log(chalk.green("\n✓ shadcn/ui has been set up successfully!"));
        console.log(chalk.cyan("\nℹ️  Using configuration:"));
        console.log(chalk.cyan(`   • Style: ${config.style}`));
        console.log(chalk.cyan(`   • Base color: ${config.baseColor}`));
        console.log(chalk.cyan(`   • CSS variables: ${config.cssVariables}`));
        console.log(chalk.cyan("\nℹ️  You can add more components using:"));
        console.log(chalk.white("   npx shadcn@latest add [component-name]"));
    },
};

export default shadcnModule;
