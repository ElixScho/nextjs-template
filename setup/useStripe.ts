import chalk from "chalk";
import type { SetupModule } from "./types";
import { updateEnvVariables } from "./utils";

const stripeModule: SetupModule = {
    name: "useStripe",
    question: {
        type: "confirm",
        message: "💳 Do you want to add Stripe for payments?",
        default: false,
    },
    setup: async context => {
        console.log(chalk.yellow("\nAdding Stripe..."));
        if (await context.execCommand("npm install stripe @stripe/stripe-js")) {
            // Guide user through Stripe setup
            console.log(chalk.cyan("\nℹ️  Stripe Setup Instructions:"));
            console.log(
                chalk.white("1. Go to https://dashboard.stripe.com/apikeys")
            );
            console.log(
                chalk.white("2. Sign in or create a new Stripe account")
            );
            console.log(
                chalk.white(
                    "3. In the Stripe Dashboard, ensure you're in 'Test Mode' for development"
                )
            );
            console.log(chalk.white("4. Copy your 'Publishable key'"));
            console.log(chalk.white("5. Copy your 'Secret key'"));

            // Prompt user for input
            const inquirer = (await import("inquirer")).default;
            const answers = await inquirer.prompt([
                {
                    type: "input",
                    name: "publishableKey",
                    message: "Enter your Stripe Publishable Key:",
                    default: "pk_test_",
                },
                {
                    type: "input",
                    name: "secretKey",
                    message: "Enter your Stripe Secret Key:",
                    default: "sk_test_",
                },
            ]);

            // Update environment variables
            updateEnvVariables(
                context.projectPath,
                [
                    {
                        key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
                        value: answers.publishableKey,
                        description:
                            "Your Stripe publishable key (starts with pk_)",
                    },
                    {
                        key: "STRIPE_SECRET_KEY",
                        value: answers.secretKey,
                        description: "Your Stripe secret key (starts with sk_)",
                        isSecret: true,
                    },
                ],
                "Stripe Configuration"
            );

            console.log(
                chalk.green("\n✓ Stripe has been set up successfully!")
            );
            console.log(chalk.cyan("\nℹ️  Next steps:"));
            console.log(
                chalk.cyan("1. Verify your Stripe keys in .env and .env.local")
            );
            console.log(
                chalk.cyan("2. For production, repeat setup with live keys")
            );
        }
    },
};

export default stripeModule;
