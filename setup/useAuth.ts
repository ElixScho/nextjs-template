import path from "path";
import fs from "fs";
import chalk from "chalk";
import type { SetupModule } from "./types";
import { updateRootLayout } from "./utils";

const authModule: SetupModule = {
    name: "addAuth",
    question: {
        type: "confirm",
        message: "🔐 Do you want to add Clerk for authentication?",
        default: true,
    },
    setup: async context => {
        console.log(chalk.yellow("Adding Clerk authentication..."));
        if (await context.execCommand("npm install @clerk/nextjs")) {
            // Update environment variables
            context.updateEnvFile(
                {
                    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "your_publishable_key",
                    CLERK_SECRET_KEY: "your_secret_key",
                    NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
                    NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
                    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/",
                    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/",
                },
                "Clerk Authentication (Get these from https://dashboard.clerk.com)"
            );

            // Create middleware for protected routes
            const middleware = `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/trpc/(.*)',
])

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}`;

            // Create auth utils file
            const authUtils = `import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Get the authenticated user with full user object
 * Redirects to sign-in if not authenticated
 */
export async function getUser() {
    const { userId } = await auth();
    
    if (!userId) {
        redirect("/sign-in");
    }

    const user = await currentUser();
    if (!user) {
        redirect("/sign-in");
    }

    return user;
}

/**
 * Check if user is authenticated
 * Returns userId if authenticated, null if not
 * Does not redirect
 */
export async function checkAuth() {
    const { userId } = await auth();
    return userId;
}`;

            // Create sign-in page
            const signInPage = `import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignIn />
        </div>
    );
}`;

            // Create sign-up page
            const signUpPage = `import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignUp />
        </div>
    );
}`;

            // Create the directories and files
            fs.writeFileSync(
                path.join(context.projectPath, "middleware.ts"),
                middleware
            );

            const libDir = path.join(context.projectPath, "lib");
            if (!fs.existsSync(libDir)) {
                fs.mkdirSync(libDir);
            }
            fs.writeFileSync(path.join(libDir, "auth.ts"), authUtils);

            // Create sign-in and sign-up pages
            const signInDir = path.join(
                context.projectPath,
                "app",
                "sign-in",
                "[[...sign-in]]"
            );
            const signUpDir = path.join(
                context.projectPath,
                "app",
                "sign-up",
                "[[...sign-up]]"
            );

            fs.mkdirSync(signInDir, { recursive: true });
            fs.mkdirSync(signUpDir, { recursive: true });

            fs.writeFileSync(path.join(signInDir, "page.tsx"), signInPage);
            fs.writeFileSync(path.join(signUpDir, "page.tsx"), signUpPage);

            // Update root layout with ClerkProvider
            updateRootLayout({
                projectPath: context.projectPath,
                importStatement: `import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";\n`,
                providerComponent: `<ClerkProvider>
                    <header className="flex justify-end items-center p-4 gap-4 h-16">
                        <SignedOut>
                            <SignInButton />
                            <SignUpButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </header>
                    {children}
                </ClerkProvider>`,
            });

            console.log(
                chalk.green(
                    "\n✓ Clerk authentication has been set up successfully!"
                )
            );
            console.log(chalk.cyan("\nℹ️  Next steps:"));
            console.log(chalk.cyan("   1. Add your Clerk keys to .env.local"));
            console.log(
                chalk.cyan(
                    "   2. Visit http://localhost:3000 and test the auth flow"
                )
            );
            console.log(
                chalk.cyan(
                    "   3. Use getUser() from lib/auth.ts to protect routes"
                )
            );
        }
    },
};

export default authModule;
