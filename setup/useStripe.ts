import path from "path";
import fs from "fs";
import chalk from "chalk";
import type { SetupModule } from "./types";

const stripeModule: SetupModule = {
    name: "useStripe",
    question: {
        type: "confirm",
        message: "💳 Do you want to add Stripe for payments?",
        default: false,
    },
    setup: async context => {
        console.log(chalk.yellow("Adding Stripe..."));
        if (await context.execCommand("npm install @stripe/stripe-js stripe")) {
            // Create Stripe configuration file
            const stripeConfig = `
import Stripe from 'stripe';

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;

if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe environment variables');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});
`;
            fs.writeFileSync(
                path.join(context.projectPath, "lib", "stripe.ts"),
                stripeConfig
            );

            // Update environment variables
            context.updateEnvFile(
                {
                    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
                    STRIPE_SECRET_KEY: "",
                },
                "Stripe Configuration (Get these from https://dashboard.stripe.com/apikeys)"
            );

            // Add Stripe setup instructions
            console.log(chalk.yellow("\nStripe Setup Instructions:"));
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
            console.log(
                chalk.white(
                    "4. Copy your 'Publishable key' and add it to NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env"
                )
            );
            console.log(
                chalk.white(
                    "5. Copy your 'Secret key' and add it to STRIPE_SECRET_KEY in .env"
                )
            );
            console.log(
                chalk.white(
                    "6. For production, repeat steps 4-5 with live keys\n"
                )
            );
        }
    },
};

export default stripeModule;
