import chalk from "chalk";
import type { SetupModule } from "./types";
import fs from "fs";
import { updateEnvVariables } from "./utils";

const prismaModule: SetupModule = {
    name: "usePrisma",
    question: {
        type: "confirm",
        message: "🗄️ Do you want to add Prisma with Supabase?",
        default: false,
    },
    setup: async context => {
        console.log(chalk.yellow("\nAdding Prisma and Supabase..."));

        // Install dependencies
        if (
            await context.execCommand(
                "npm install @prisma/client @supabase/supabase-js"
            )
        ) {
            await context.execCommand("npx prisma init");

            // Guide user through Supabase setup
            console.log(chalk.cyan("\nℹ️  Supabase Setup Instructions:"));
            console.log(chalk.white("1. Go to https://supabase.com"));
            console.log(
                chalk.white("2. Create a new project or select an existing one")
            );
            console.log(chalk.white("3. In the project dashboard:"));
            console.log(chalk.white("   - Go to Project Settings"));
            console.log(chalk.white("   - Find the 'Database' section"));
            console.log(
                chalk.white(
                    "   - Copy the 'Connection string' (with your password)"
                )
            );
            console.log(chalk.white("4. In the 'API' section:"));
            console.log(chalk.white("   - Copy the 'Project URL'"));
            console.log(chalk.white("   - Copy the 'anon' public API key"));

            // Prompt user for input
            const inquirer = (await import("inquirer")).default;
            const answers = await inquirer.prompt([
                {
                    type: "input",
                    name: "databaseUrl",
                    message:
                        "Enter your Supabase database URL (connection string):",
                    default:
                        "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres",
                },
                {
                    type: "input",
                    name: "supabaseUrl",
                    message: "Enter your Supabase project URL:",
                    default: "https://[YOUR-PROJECT-REF].supabase.co",
                },
                {
                    type: "input",
                    name: "supabaseKey",
                    message: "Enter your Supabase anon key:",
                    default: "your_anon_key",
                },
            ]);

            // Update environment variables with user input
            updateEnvVariables(
                context.projectPath,
                [
                    {
                        key: "DATABASE_URL",
                        value: answers.databaseUrl,
                        description: "Your Supabase database connection string",
                        isSecret: true,
                    },
                    {
                        key: "SUPABASE_URL",
                        value: answers.supabaseUrl,
                        description: "Your Supabase project URL",
                    },
                    {
                        key: "SUPABASE_ANON_KEY",
                        value: answers.supabaseKey,
                        description: "Your Supabase anonymous API key",
                        isSecret: true,
                    },
                ],
                "Database Configuration"
            );

            // Create initial Prisma schema
            const schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here
// Example:
// model User {
//   id        String   @id @default(cuid())
//   email     String   @unique
//   name      String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
`;
            context.ensureDirectoryExists("prisma");
            fs.writeFileSync("prisma/schema.prisma", schema);

            console.log(
                chalk.green(
                    "\n✓ Prisma and Supabase have been set up successfully!"
                )
            );
            console.log(chalk.cyan("\nℹ️  Next steps:"));
            console.log(
                chalk.cyan(
                    "1. Check your .env file for the correct credentials"
                )
            );
            console.log(
                chalk.cyan("2. Edit prisma/schema.prisma to add your models")
            );
            console.log(
                chalk.cyan(
                    "3. Run 'npx prisma generate' after modifying the schema"
                )
            );
            console.log(
                chalk.cyan("4. Run 'npx prisma db push' to sync your database")
            );
        }
    },
};

export default prismaModule;
