import chalk from "chalk";
import type { SetupModule } from "./types";

const prismaModule: SetupModule = {
    name: "usePrisma",
    question: {
        type: "confirm",
        message: "🗄️ Do you want to add Prisma with Supabase?",
        default: false,
    },
    setup: async context => {
        console.log(chalk.yellow("Adding Prisma and Supabase..."));
        if (
            await context.execCommand(
                "npm install @prisma/client @supabase/supabase-js"
            )
        ) {
            await context.execCommand("npx prisma init");

            // Update environment variables
            context.updateEnvFile(
                {
                    DATABASE_URL:
                        "postgresql://postgres:password@localhost:5432/mydb",
                    SUPABASE_URL: "",
                    SUPABASE_ANON_KEY: "",
                },
                "Database Configuration"
            );
        }
    },
};

export default prismaModule;
